import React, { useState } from 'react';
import { AppSettings, InstitutionalIdentity, Employee, NewsReport, CriticalNotification, PerformanceAgreement, CooperationContract, ReporterTarget } from '../types';
import SignaturePad from './SignaturePad';
import DatabaseExplorer from './DatabaseExplorer';
import { 
  Building, Award, PenTool, Check, FileText, Phone, MapPin, Printer, 
  Database, Download, Upload, Radio, FileSpreadsheet, AlertCircle, 
  Clock, UserCheck, RefreshCw, Layers, Share2, Search, Plus, 
  Trash2, Edit3, Save, FileJson, X, ShieldAlert 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseFlexibleDate } from '../utils/dateUtils';

interface AppAdminViewProps {
  settings: AppSettings;
  identity: InstitutionalIdentity;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateIdentity: (identity: InstitutionalIdentity) => void;
  employees?: Employee[];
  onUpdateEmployees?: (employees: Employee[]) => void;
  notifications?: CriticalNotification[];
  onUpdateNotifications?: (notifications: CriticalNotification[]) => void;
  agreements?: PerformanceAgreement[];
  onUpdateAgreements?: (agreements: PerformanceAgreement[]) => void;
  contracts?: CooperationContract[];
  onUpdateContracts?: (contracts: CooperationContract[]) => void;
  reporterTargets?: ReporterTarget[];
  onUpdateReporterTargets?: (targets: ReporterTarget[]) => void;
  onResetToProductionMode?: () => void;
  onExportDatabase?: () => void;
  onImportDatabase?: (jsonData: string) => Promise<boolean>;
  currentUser?: {
    id: string;
    name: string;
    role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin';
    division?: string;
    photo?: string;
  } | null;
  newsReports?: NewsReport[];
  onUpdateNewsReports?: (reports: NewsReport[]) => void;
}

export default function AppAdminView({
  settings,
  identity,
  onUpdateSettings,
  onUpdateIdentity,
  employees = [],
  onUpdateEmployees,
  notifications = [],
  onUpdateNotifications,
  agreements = [],
  onUpdateAgreements,
  contracts = [],
  onUpdateContracts,
  reporterTargets = [],
  onUpdateReporterTargets,
  onResetToProductionMode,
  onExportDatabase,
  onImportDatabase,
  currentUser,
  newsReports = [],
  onUpdateNewsReports
}: AppAdminViewProps) {
  const formatFullName = (emp: Employee) => {
    let full = emp.nama;
    if (emp.gelarDepan) full = `${emp.gelarDepan} ${full}`;
    if (emp.gelarBelakang) full = `${full}, ${emp.gelarBelakang}`;
    return full;
  };

  const [activeMainTab, setActiveMainTab] = useState<'settings' | 'explorer'>('settings');

  // General Settings Local State
  const [instansiNama, setInstansiNama] = useState(settings.namaInstansi);
  const [instansiAlamat, setInstansiAlamat] = useState(settings.alamat);
  const [instansiNoTelp, setInstansiNoTelp] = useState(settings.noTelp);
  const [isSavedSettings, setIsSavedSettings] = useState(false);

  // Institutional Identity Local State
  const [stasiunNama, setStasiunNama] = useState(identity.kepalaStasiunNama);
  const [stasiunTtd, setStasiunTtd] = useState(identity.kepalaStasiunTtd);
  const [stasiunUsername, setStasiunUsername] = useState(identity.kepalaStasiunUsername || 'kepala');
  const [stasiunPassword, setStasiunPassword] = useState(identity.kepalaStasiunPassword || 'kepala');

  const [bidangNama, setBidangNama] = useState(identity.kepalaBidangNama);
  const [bidangTtd, setBidangTtd] = useState(identity.kepalaBidangTtd);

  const [timSiaranNama, setTimSiaranNama] = useState(identity.ketuaTimSiaranNama || '');
  const [timSiaranTtd, setTimSiaranTtd] = useState(identity.ketuaTimSiaranTtd || '');

  const [timPemberitaanNama, setTimPemberitaanNama] = useState(identity.ketuaTimPemberitaanNama || '');
  const [timPemberitaanTtd, setTimPemberitaanTtd] = useState(identity.ketuaTimPemberitaanTtd || '');

  const [timTeknikNama, setTimTeknikNama] = useState(identity.ketuaTimTeknikNama || '');
  const [timTeknikTtd, setTimTeknikTtd] = useState(identity.ketuaTimTeknikTtd || '');

  const [timKontenNama, setTimKontenNama] = useState(identity.ketuaTimKontenNama || '');
  const [timKontenTtd, setTimKontenTtd] = useState(identity.ketuaTimKontenTtd || '');

  const [timLayananNama, setTimLayananNama] = useState(identity.ketuaTimLayananNama || '');
  const [timLayananTtd, setTimLayananTtd] = useState(identity.ketuaTimLayananTtd || '');
  
  const [isSavedKepala, setIsSavedKepala] = useState(false);
  const [isSavedKabidKatim, setIsSavedKabidKatim] = useState(false);

  // Database Backup/Restore local state and references
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isImporting) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processBackupFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isImporting) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      await processBackupFile(files[0]);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processBackupFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert("Jenis file tidak valid. Harap unggah file cadangan .json.");
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (onImportDatabase) {
          await onImportDatabase(text);
        }
      } catch (err) {
        console.error("Gagal membaca file:", err);
        alert("Gagal membaca file.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      alert("Gagal membaca file.");
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  // State & Handlers for News/Media Import feature (teks/radio/adlibs/feature/podcast/sosmed)
  const [newsImportText, setNewsImportText] = useState('');
  const [parsedNews, setParsedNews] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importActiveTab, setImportActiveTab] = useState<'upload' | 'paste'>('upload');
  const newsFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isNewsDragging, setIsNewsDragging] = useState(false);
  const [isImportingNews, setIsImportingNews] = useState(false);

  const handleNewsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsNewsDragging(true);
  };

  const handleNewsDragLeave = () => {
    setIsNewsDragging(false);
  };

  const handleNewsDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsNewsDragging(false);
    if (isImportingNews) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processNewsFile(files[0]);
    }
  };

  const handleNewsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isImportingNews) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      await processNewsFile(files[0]);
    }
    if (newsFileInputRef.current) {
      newsFileInputRef.current.value = '';
    }
  };

  const processNewsFile = (file: File) => {
    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (!isJson && !isCsv && !isExcel) {
      setImportError("Format file tidak didukung. Harap unggah file .json, .csv, atau .xlsx/.xls Excel.");
      setParsedNews([]);
      return;
    }

    setIsImportingNews(true);
    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
          
          parseNewsData(jsonData, 'array');
        } catch (err: any) {
          setImportError("Gagal memproses file Excel: " + (err.message || err));
        } finally {
          setIsImportingNews(false);
        }
      };
      reader.onerror = () => {
        setImportError("Gagal membaca file.");
        setIsImportingNews(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          parseNewsData(text, isJson ? 'json' : 'csv');
        } catch (err: any) {
          setImportError("Gagal memproses file: " + (err.message || err));
        } finally {
          setIsImportingNews(false);
        }
      };
      reader.onerror = () => {
        setImportError("Gagal membaca file.");
        setIsImportingNews(false);
      };
      reader.readAsText(file);
    }
  };

  const parseNewsData = (inputData: string | any[], format: 'json' | 'csv' | 'array') => {
    try {
      setImportError(null);
      setImportSuccess(null);
      let items: any[] = [];

      if (format === 'array') {
        items = inputData as any[];
      } else if (format === 'json') {
        const parsed = JSON.parse(inputData as string);
        items = Array.isArray(parsed) ? parsed : (parsed.data || parsed.reports || []);
        if (!Array.isArray(items)) {
          throw new Error("JSON harus berupa array data berita");
        }
      } else {
        // CSV / TSV Parsing
        const rawText = inputData as string;
        const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) {
          throw new Error("CSV/TSV harus memiliki baris header dan minimal satu baris data");
        }

        // Support Tab (excel copy-paste), Semicolon (Indonesian regional excel), and Comma
        let delimiter = ',';
        if (lines[0].includes('\t')) {
          delimiter = '\t';
        } else if (lines[0].includes(';')) {
          delimiter = ';';
        }

        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
          if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

          const item: any = {};
          headers.forEach((header, index) => {
            if (index < row.length) {
              item[header] = row[index];
            }
          });
          items.push(item);
        }
      }

      if (items.length === 0) {
        throw new Error("Tidak ada data berita yang berhasil diuraikan.");
      }

      const normalized = items.map((item, idx) => {
        // Safe case/spacing-insensitive header getter
        const getVal = (keys: string[]) => {
          for (const key of keys) {
            const foundKey = Object.keys(item).find(k => k.toLowerCase().replace(/[\s_-]/g, '') === key.toLowerCase().replace(/[\s_-]/g, ''));
            if (foundKey) return item[foundKey];
          }
          return undefined;
        };

        const judul = getVal(['judul berita', 'judul_berita', 'judul', 'title', 'nama', 'headline', 'name', 'nama konten', 'nama_konten']) || '';
        const link = getVal(['link eviden', 'link_eviden', 'url', 'link', 'eviden', 'linkeviden', 'website']) || '';
        const pembuat = getVal(['penulis', 'pembuat', 'reporter', 'creator', 'writer', 'penyiar', 'author', 'penulis (reporter)', 'penulis/reporter']) || '';
        const kategoriRaw = getVal(['jenis berita', 'jenis_berita', 'tipe berita', 'tipe_berita', 'kategori', 'category', 'type', 'jenis', 'jenis/tipe berita']) || 'Berita Online';
        const kategoriStr = String(kategoriRaw).toLowerCase().trim();
        const publishRaw = getVal(['waktu publish', 'waktu_publish', 'waktupublish', 'tgl_jam_publish', 'tgl jampublish', 'publishdatetime', 'publish_date', 'date', 'tanggal', 'publish', 'tgl', 'tanggal publish', 'waktu terbit']);
        const parsedDate = parseFlexibleDate(publishRaw);
        const datePart = parsedDate.dateISO;
        const publishStr = parsedDate.publishDateTimeISO;
        const editor = getVal(['editor', 'reviewer', 'pemeriksa']) || '';
        const daerah = getVal(['daerah', 'region', 'lokasi', 'location', 'kota', 'city', 'wilayah']) || '';
        const programa = getVal(['programa', 'pro', 'channel', 'saluran']) || 'Programa 1';
        const subKategori = getVal(['kategori berita', 'kategori_berita', 'subkategori', 'sub_kategori', 'topik', 'kategori_topik']) || 'Politik';

        if (!judul) {
          throw new Error(`Baris ke-${idx + 1} tidak memiliki judul.`);
        }

        // Try to match reporter in employees
        let reporterId = '';
        let matchedReporter = employees.find(emp => 
          emp.nip === pembuat || 
          emp.nama.toLowerCase().trim() === String(pembuat).toLowerCase().trim() ||
          emp.nama.toLowerCase().includes(String(pembuat).toLowerCase()) || 
          String(pembuat).toLowerCase().includes(emp.nama.toLowerCase())
        );

        if (matchedReporter) {
          reporterId = matchedReporter.id;
        } else {
          // fallback to first employee in news division or any employee
          const defaultRep = employees.find(emp => emp.divisi === 'Pemberitaan' || emp.divisi === 'Konten Media Baru');
          reporterId = defaultRep ? defaultRep.id : (employees[0]?.id || 'emp-unknown');
        }

        // Try to match editor
        let matchedEditorId = '';
        let matchedEditor = employees.find(emp => 
          (emp.isEditor || emp.role === 'Superadmin' || emp.divisi === 'Tata Usaha / Umum' || emp.role === 'Ketua Bidang') && (
            emp.nip === editor || 
            emp.nama.toLowerCase().trim() === String(editor).toLowerCase().trim() ||
            emp.nama.toLowerCase().includes(String(editor).toLowerCase()) || 
            String(editor).toLowerCase().includes(emp.nama.toLowerCase())
          )
        );
        if (matchedEditor) {
          matchedEditorId = matchedEditor.id;
        }

        let reportType: 'Berita Ringan LPU' | 'Berita Radio' | 'Berita Online' | 'Konten Siaran' = 'Berita Online';
        if (kategoriStr.includes('ringan') || kategoriStr.includes('lpu')) {
          reportType = 'Berita Ringan LPU';
        } else if (kategoriStr.includes('radio')) {
          reportType = 'Berita Radio';
        } else if (kategoriStr.includes('siaran') || kategoriStr.includes('konten')) {
          reportType = 'Konten Siaran';
        } else {
          reportType = 'Berita Online';
        }

        return {
          id: `rep-imported-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          employeeId: reporterId,
          editorId: matchedEditorId || undefined,
          title: String(judul),
          url: String(link),
          type: reportType,
          date: datePart,
          category: String(subKategori),
          publishDateTime: String(publishStr),
          writerName: matchedReporter ? matchedReporter.nama : String(pembuat),
          reporterName: matchedReporter ? matchedReporter.nama : String(pembuat),
          editorName: matchedEditor ? matchedEditor.nama : String(editor),
          daerah: String(daerah),
          programa: String(programa)
        };
      });

      setParsedNews(normalized);
      setImportSuccess(`Berhasil mengurai ${normalized.length} data berita. Silakan tinjau data di bawah dan klik simpan.`);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Gagal mengurai data. Pastikan format kolom/baris sesuai.");
      setParsedNews([]);
    }
  };

  const handleSaveImportedNews = () => {
    if (parsedNews.length === 0) return;
    if (!onUpdateNewsReports) {
      alert("Fungsi penyimpanan berita tidak tersedia.");
      return;
    }

    try {
      // Append parsed news as additional data to existing news reports
      const existingIds = new Set(newsReports.map(r => r.id));
      const newItems = parsedNews.filter(r => !existingIds.has(r.id));
      const updatedReports = [...newItems, ...newsReports];
      onUpdateNewsReports(updatedReports);
      setImportSuccess(`Berhasil menambahkan ${newItems.length} data berita baru ke database Firestore! (Total data berita: ${updatedReports.length})`);
      setParsedNews([]);
      setNewsImportText('');
    } catch (error) {
      console.error(error);
      setImportError("Gagal menyimpan ke database Firestore.");
    }
  };

  const downloadSampleTemplate = (type: 'json' | 'csv' | 'xlsx') => {
    let content = '';
    let filename = '';

    const sampleData = [
      {
        "Jenis Berita": "Berita Online",
        "Judul Berita": "Sosialisasi Digitalisasi Penyiaran RRI Bandar Lampung",
        "Waktu Publish": "2026-07-29 09:30:00",
        "Penulis": "Nanda Febriand",
        "Editor": "Kepala Bidang",
        "Kategori Berita": "Politik",
        "Programa": "-",
        "Daerah": "Bandar Lampung",
        "Link Eviden": "https://rri.co.id/bandar-lampung/berita/12345"
      },
      {
        "Jenis Berita": "Berita Ringan LPU",
        "Judul Berita": "Tips Menjaga Kesehatan Telinga Saat Mendengarkan Radio",
        "Waktu Publish": "2026-07-29 10:15:00",
        "Penulis": "Nanda Febriand",
        "Editor": "Editor LPU",
        "Kategori Berita": "Sosial",
        "Programa": "-",
        "Daerah": "Bandar Lampung",
        "Link Eviden": "https://rri.co.id/bandar-lampung/lpu/67890"
      },
      {
        "Jenis Berita": "Berita Radio",
        "Judul Berita": "Laporan Siaran Warta Berita Pagi Daerah",
        "Waktu Publish": "2026-07-29 07:00:00",
        "Penulis": "Penyiar Radio",
        "Editor": "-",
        "Kategori Berita": "-",
        "Programa": "Programa 1",
        "Daerah": "Bandar Lampung",
        "Link Eviden": "https://rri.co.id/audio/warta-pagi-20260729.mp3"
      },
      {
        "Jenis Berita": "Konten Siaran",
        "Judul Berita": "Dialog Interaktif Tantangan Penyiaran Publik di Era Digital",
        "Waktu Publish": "2026-07-29 14:00:00",
        "Penulis": "Tim Siaran",
        "Editor": "-",
        "Kategori Berita": "-",
        "Programa": "Programa 2",
        "Daerah": "Bandar Lampung",
        "Link Eviden": "https://youtube.com/watch?v=sample123"
      }
    ];

    if (type === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Import Berita");
      XLSX.writeFile(workbook, "template_import_berita.xlsx");
      return;
    }

    if (type === 'json') {
      content = JSON.stringify(sampleData, null, 2);
      filename = 'template_import_berita.json';
    } else {
      content = "Jenis Berita,Judul Berita,Waktu Publish,Penulis,Editor,Kategori Berita,Programa,Daerah,Link Eviden\n" +
                "Berita Online,Sosialisasi Digitalisasi Penyiaran RRI Bandar Lampung,2026-07-29 09:30:00,Nanda Febriand,Kepala Bidang,Politik,-,Bandar Lampung,https://rri.co.id/bandar-lampung/berita/12345\n" +
                "Berita Ringan LPU,Tips Menjaga Kesehatan Telinga Saat Mendengarkan Radio,2026-07-29 10:15:00,Nanda Febriand,Editor LPU,Sosial,-,Bandar Lampung,https://rri.co.id/bandar-lampung/lpu/67890\n" +
                "Berita Radio,Laporan Siaran Warta Berita Pagi Daerah,2026-07-29 07:00:00,Penyiar Radio,-,-,Programa 1,Bandar Lampung,https://rri.co.id/audio/warta-pagi-20260729.mp3\n" +
                "Konten Siaran,Dialog Interaktif Tantangan Penyiaran Publik di Era Digital,2026-07-29 14:00:00,Tim Siaran,-,-,Programa 2,Bandar Lampung,https://youtube.com/watch?v=sample123";
      filename = 'template_import_berita.csv';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save General settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      namaInstansi: instansiNama,
      alamat: instansiAlamat,
      noTelp: instansiNoTelp
    });
    setIsSavedSettings(true);
    setTimeout(() => setIsSavedSettings(false), 2000);
  };

  // Save Kepala Stasiun Identity
  const handleSaveKepala = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentity({
      ...identity,
      kepalaStasiunNama: stasiunNama,
      kepalaStasiunTtd: stasiunTtd,
      kepalaStasiunUsername: stasiunUsername,
      kepalaStasiunPassword: stasiunPassword,
    });
    setIsSavedKepala(true);
    setTimeout(() => setIsSavedKepala(false), 2000);
  };

  // Save Kabid / Katim Identity
  const handleSaveKabidKatim = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentity({
      ...identity,
      kepalaBidangNama: bidangNama,
      kepalaBidangTtd: bidangTtd,
      ketuaTimSiaranNama: timSiaranNama,
      ketuaTimSiaranTtd: timSiaranTtd,
      ketuaTimPemberitaanNama: timPemberitaanNama,
      ketuaTimPemberitaanTtd: timPemberitaanTtd,
      ketuaTimTeknikNama: timTeknikNama,
      ketuaTimTeknikTtd: timTeknikTtd,
      ketuaTimKontenNama: timKontenNama,
      ketuaTimKontenTtd: timKontenTtd,
      ketuaTimLayananNama: timLayananNama,
      ketuaTimLayananTtd: timLayananTtd
    });
    setIsSavedKabidKatim(true);
    setTimeout(() => setIsSavedKabidKatim(false), 2000);
  };

  // Official document printable
  const handlePrintDocument = () => {
    window.print();
  };

  if (currentUser?.role !== 'Superadmin') {
    return (
      <div className="lg:col-span-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-md flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-full animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Akses Ditolak / Terbatas</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Maaf, menu Administrasi Aplikasi, Manajemen Database, serta Fitur Cadangan & Impor hanya dapat diakses secara eksklusif oleh akun dengan level kewenangan <strong>Superadmin</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-white rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight">Administrasi & Pengelola Portal</h1>
            <p className="text-xs text-slate-400">Konfigurasi stasiun, kelola tanda tangan pejabat, dan jelajahi seluruh database utama Swara.</p>
          </div>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveMainTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'settings'
                ? 'bg-white text-slate-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Pengaturan Aplikasi & TTD
          </button>
          <button
            onClick={() => setActiveMainTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              activeMainTab === 'explorer'
                ? 'bg-white text-slate-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Penjelajah & Pengelola DB
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>

      {activeMainTab === 'settings' ? (
        <div className="max-w-4xl mx-auto space-y-6">
        
        {/* General Application Settings Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Building className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pengaturan Umum Aplikasi</h2>
              <p className="text-[10px] text-slate-400">Identitas umum instansi/lembaga penyiaran.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nama Instansi / Lembaga</label>
              <input
                type="text"
                value={instansiNama}
                onChange={(e) => setInstansiNama(e.target.value)}
                placeholder="Contoh: RRI Stasiun Pemancar Utama"
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nomor Telepon</label>
                <input
                  type="text"
                  value={instansiNoTelp}
                  onChange={(e) => setInstansiNoTelp(e.target.value)}
                  placeholder="Contoh: (021) 123456"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Alamat Instansi</label>
                <input
                  type="text"
                  value={instansiAlamat}
                  onChange={(e) => setInstansiAlamat(e.target.value)}
                  placeholder="Jl. Radio Pemancar No. 45, Jakarta"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                {isSavedSettings ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Berhasil Disimpan
                  </>
                ) : (
                  "Simpan Pengaturan Umum"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 1: Pengaturan Kepala Stasiun */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pengaturan Kepala Stasiun</h2>
              <p className="text-[10px] text-slate-400">Kelola nama, tanda tangan, dan kata sandi akun Kepala Stasiun.</p>
            </div>
          </div>

          <form onSubmit={handleSaveKepala} className="space-y-4">
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setStasiunNama(formatFullName(emp));
                          setStasiunTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={stasiunNama}
                      onChange={(e) => setStasiunNama(e.target.value)}
                      placeholder="Budi Rahardjo, M.Sn."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                                    <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Username Akun Kepala</label>
                    <input
                      type="text"
                      value={stasiunUsername}
                      onChange={(e) => setStasiunUsername(e.target.value)}
                      placeholder="Masukkan username"
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kata Sandi Akun Kepala</label>
                    <input
                      type="text"
                      value={stasiunPassword}
                      onChange={(e) => setStasiunPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold font-mono"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={stasiunTtd}
                  onChange={(dataUrl) => setStasiunTtd(dataUrl)}
                  height={135}
                  label="Tanda Tangan Kepala Stasiun"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                {isSavedKepala ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Berhasil Menyimpan Pengaturan Kepala
                  </>
                ) : (
                  "Simpan Pengaturan Kepala Stasiun"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Pengaturan Kabid / Katim */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pengaturan Kabid & Ketua Tim (Katim)</h2>
              <p className="text-[10px] text-slate-400">Kelola nama pejabat dan tanda tangan elektronik Kepala Bidang dan Ketua Tim.</p>
            </div>
          </div>

          <form onSubmit={handleSaveKabidKatim} className="space-y-5">
            
            {/* 2. Kepala Bagian Tata Usaha */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kepala Bagian Tata Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setBidangNama(formatFullName(emp));
                          setBidangTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={bidangNama}
                      onChange={(e) => setBidangNama(e.target.value)}
                      placeholder="Ir. H. Ahmad Fauzi, M.T."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={bidangTtd}
                  onChange={(dataUrl) => setBidangTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Kepala Bagian Tata Usaha"
                />
              </div>
            </div>

            {/* 3. Ketua Tim Siaran */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Siaran</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimSiaranNama(formatFullName(emp));
                          setTimSiaranTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timSiaranNama}
                      onChange={(e) => setTimSiaranNama(e.target.value)}
                      placeholder="Rina Kartika, S.Sos."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timSiaranTtd}
                  onChange={(dataUrl) => setTimSiaranTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Siaran"
                />
              </div>
            </div>

            {/* 4. Ketua Tim Pemberitaan */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Pemberitaan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimPemberitaanNama(formatFullName(emp));
                          setTimPemberitaanTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timPemberitaanNama}
                      onChange={(e) => setTimPemberitaanNama(e.target.value)}
                      placeholder="Fahri Hamzah, M.I.Kom."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timPemberitaanTtd}
                  onChange={(dataUrl) => setTimPemberitaanTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Pemberitaan"
                />
              </div>
            </div>

            {/* 5. Ketua Tim Teknologi dan Media Baru */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">5</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Teknologi dan Media Baru</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimTeknikNama(formatFullName(emp));
                          setTimTeknikTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timTeknikNama}
                      onChange={(e) => setTimTeknikNama(e.target.value)}
                      placeholder="Andi Wijaya, M.T."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timTeknikTtd}
                  onChange={(dataUrl) => setTimTeknikTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Teknologi & Media Baru"
                />
              </div>
            </div>

            {/* 6. Ketua Tim Konten Media Baru */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">6</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Konten Media Baru</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimKontenNama(formatFullName(emp));
                          setTimKontenTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timKontenNama}
                      onChange={(e) => setTimKontenNama(e.target.value)}
                      placeholder="Siti Rahmawati, S.I.Kom."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timKontenTtd}
                  onChange={(dataUrl) => setTimKontenTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Konten Media Baru"
                />
              </div>
            </div>

            {/* 7. Ketua Tim Layanan Pengembangan Usaha */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">7</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Layanan Pengembangan Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimLayananNama(formatFullName(emp));
                          setTimLayananTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timLayananNama}
                      onChange={(e) => setTimLayananNama(e.target.value)}
                      placeholder="Budi Santoso, S.E., M.M."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timLayananTtd}
                  onChange={(dataUrl) => setTimLayananTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Layanan Pengembangan Usaha"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
              >
                {isSavedKabidKatim ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Berhasil Menyimpan Pengaturan Kabid/Katim
                  </>
                ) : (
                  "Simpan Pengaturan Kabid / Katim"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Backup, Export & Import Database Card */}
        {currentUser?.role === 'Superadmin' && (
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-slate-800 text-white rounded-lg">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Cadangan & Impor Database</h2>
                <p className="text-[10px] text-slate-400">Ekspor data ke file cadangan atau pulihkan dari file .json.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export section */}
              <div className="space-y-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Ekspor Data</span>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Unduh seluruh data instansi saat ini (Daftar Pegawai, Perjanjian Kinerja, Kontrak Kerja Sama, dll.) dalam bentuk file .json terkompresi.
                  </p>
                </div>
                {onExportDatabase && (
                  <button
                    type="button"
                    onClick={onExportDatabase}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full justify-center active:scale-98 mt-2"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File Cadangan (.json)
                  </button>
                )}
              </div>

              {/* Import section with drag & drop */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Impor & Pulihkan</span>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[110px] ${
                    isDragging
                      ? "border-slate-800 bg-slate-50 text-slate-800"
                      : "border-slate-200 hover:border-slate-300 text-slate-500 bg-slate-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-slate-400" />
                  <div className="text-[11px] font-semibold">
                    {isDragging ? "Lepaskan file di sini" : "Klik atau seret file .json ke sini"}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Mendukung file cadangan .json dari portal Swara
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exclusive Menu: Import Data Berita & Media Baru */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Import Data Berita & Media Baru</h2>
              <p className="text-[10px] text-slate-400">Import massal laporan berita teks, radio, adlibs, feature, podcast, dan sosmed ke database.</p>
            </div>
          </div>

          {currentUser?.role !== 'Superadmin' ? (
            /* Restricted Access Notice */
            <div className="p-5 border border-amber-200 bg-amber-50/50 rounded-xl flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Akses Eksklusif Terbatas</h3>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Mohon maaf, menu import data massal ini dikunci secara eksklusif hanya untuk **Admin Utama (Superadmin)** guna menjaga validitas penargetan kinerja dan integritas database utama RRI Swara.
                </p>
              </div>
            </div>
          ) : (
            /* Full Import Wizard for Superadmin */
            <div className="space-y-4">
              {/* Alert Logs */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 items-start text-xs text-rose-800">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-extrabold block">Gagal Import:</span>
                    <p className="font-medium">{importError}</p>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2 items-start text-xs text-emerald-800">
                  <Check className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <span className="font-extrabold block">Berhasil:</span>
                    <p className="font-medium">{importSuccess}</p>
                  </div>
                </div>
              )}

              {/* Tab Selector & Template Downloaders */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-2">
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setImportActiveTab('upload'); setImportError(null); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      importActiveTab === 'upload' 
                        ? 'bg-white text-slate-800 shadow-xs' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Unggah File (.xlsx/.csv/.json)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImportActiveTab('paste'); setImportError(null); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      importActiveTab === 'paste' 
                        ? 'bg-white text-slate-800 shadow-xs' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Tempel Teks Manual
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('xlsx')}
                    className="flex items-center gap-1.5 text-indigo-700 hover:text-white font-extrabold text-[10px] bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh Contoh Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('csv')}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-bold text-[10px] bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh Contoh CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('json')}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-bold text-[10px] bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh Contoh JSON
                  </button>
                </div>
              </div>

              {/* Tab 1: Upload Dropzone */}
              {importActiveTab === 'upload' && (
                <div
                  onDragOver={handleNewsDragOver}
                  onDragLeave={handleNewsDragLeave}
                  onDrop={handleNewsDrop}
                  onClick={() => newsFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] ${
                    isNewsDragging
                      ? 'border-indigo-600 bg-indigo-50/30 text-indigo-800'
                      : 'border-slate-200 hover:border-indigo-400 text-slate-500 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={newsFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    onChange={handleNewsFileChange}
                    className="hidden"
                  />
                  {isImportingNews ? (
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400" />
                  )}
                  <div className="text-xs font-bold">
                    {isNewsDragging ? 'Lepaskan file di sini...' : 'Klik atau seret file .xlsx, .xls, .csv, atau .json Anda di sini'}
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-md leading-normal">
                    Pastikan file memiliki header/kolom yang sesuai: **Judul**, **Link**, **Pembuat** (nama/NIP), **Kategori** (teks/radio/adlibs/feature/podcast/sosmed), **Tgl Jam Publish**, dan **Editor**.
                  </p>
                </div>
              )}

              {/* Tab 2: Paste manual */}
              {importActiveTab === 'paste' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tempel Data JSON atau CSV Mentah</label>
                      <span className="text-[9px] text-slate-400">Sertakan baris judul kolom di baris pertama jika CSV</span>
                    </div>
                    <textarea
                      value={newsImportText}
                      onChange={(e) => setNewsImportText(e.target.value)}
                      placeholder={`Contoh CSV:\njudul,link,pembuat,kategori,tgl jam publish,editor\nInovasi RRI Swara Baru,https://rri.co.id/swara/1,Nanda,teks,2026-07-06,Admin`}
                      className="w-full h-32 bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newsImportText.trim()) {
                          setImportError("Masukkan teks data terlebih dahulu.");
                          return;
                        }
                        const isJsonText = newsImportText.trim().startsWith('[') || newsImportText.trim().startsWith('{');
                        parseNewsData(newsImportText, isJsonText ? 'json' : 'csv');
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-extrabold px-4 py-2 rounded-lg transition-all active:scale-98"
                    >
                      Urai & Pratinjau Data
                    </button>
                  </div>
                </div>
              )}

              {/* Live Preview of Parsed Data */}
              {parsedNews.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Pratinjau Hasil Pembacaan ({parsedNews.length} Berita)
                    </span>
                    <button
                      type="button"
                      onClick={() => { setParsedNews([]); setImportError(null); setImportSuccess(null); }}
                      className="text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Hapus Pratinjau
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase">
                          <th className="px-3 py-2">Berita / Media & Link</th>
                          <th className="px-3 py-2 text-center">Kategori</th>
                          <th className="px-3 py-2">Pembuat (Reporter)</th>
                          <th className="px-3 py-2">Editor Penerima</th>
                          <th className="px-3 py-2">Daerah</th>
                          <th className="px-3 py-2">Tanggal Publish</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                        {parsedNews.map((item, idx) => {
                          const isNewbie = item.employeeId === 'emp-unknown' || item.reporterName === 'emp-unknown' || !employees.some(e => e.id === item.employeeId);
                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  {item.category === 'radio' && <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                  {item.category === 'teks' && <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                  {item.category === 'adlibs' && <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                  {item.category === 'feature' && <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                                  {item.category === 'podcast' && <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                  {item.category === 'sosmed' && <Share2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                  <span className="font-semibold text-slate-800 line-clamp-1">{item.title}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[10px] text-indigo-500 hover:underline block truncate max-w-[200px]"
                                  >
                                    {item.url}
                                  </a>
                                  {item.daerah && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-bold shrink-0">📍 {item.daerah}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  item.category === 'teks' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  item.category === 'radio' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  item.category === 'adlibs' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  item.category === 'feature' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                  item.category === 'podcast' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 text-[11px] block">{item.reporterName || 'Nama Kosong'}</span>
                                  {isNewbie ? (
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-100 rounded-sm text-[8px] font-bold">Nama Teks (Belum Sinkron)</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-sm text-[8px] font-bold">✓ Pegawai Sinkron</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="font-semibold text-slate-600 text-[11px]">{item.editorName || '-'}</span>
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-700 text-[11px]">
                                {item.daerah || '-'}
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-[10px] font-mono text-slate-500 block">{item.publishDateTime}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-800 leading-normal flex gap-1.5">
                    <UserCheck className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">PENTING: Integritas Sasaran Kinerja (Cascading Indicator)</span>
                      Data berita yang disinkronkan akan langsung masuk ke database RRI Swara, menghitung ulang pencapaian indikator kinerja individu para reporter, serta melipatgandakan bobot realisasi sasaran stasiun secara real-time.
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setParsedNews([])}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-98"
                    >
                      Batalkan
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImportedNews}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer active:scale-98"
                    >
                      Simpan & Terapkan Laporan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Production Mode and Database Cleanup Card */}
        {onResetToProductionMode && currentUser?.role === 'Superadmin' && (
          <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <div className="p-2 bg-rose-600 text-white rounded-lg">
                <Building className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Manajemen Database & Mode Produksi</h2>
                <p className="text-[10px] text-slate-400">Kosongkan data dummy dan beralih ke lingkungan kerja riil.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tombol di bawah ini akan menghapus seluruh data contoh/dummy bawaan (Daftar Pegawai, Dokumen PK, Laporan Pemberitaan, dan Kontrak Kerja Sama LPU) dari sistem dan database Firestore secara permanen untuk mengaktifkan <strong>Mode Produksi Bersih</strong>.
              </p>
              <div className="p-3 bg-rose-100/50 border border-rose-200/50 rounded-xl text-[11px] text-rose-800 space-y-1">
                <span className="font-extrabold block">⚠️ PERHATIAN SEBELUM TINDAKAN:</span>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  <li>Tindakan ini tidak dapat dibatalkan (irreversible).</li>
                  <li>Sistem akan mengeluarkan Anda secara otomatis dari sesi saat ini.</li>
                  <li>Gunakan akun Superadmin bawaan untuk masuk kembali dan mendaftarkan pegawai riil pertama Anda.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onResetToProductionMode}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer active:scale-98"
              >
                Hapus Semua Data Dummy & Aktifkan Mode Produksi
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div className="p-2.5 bg-slate-800 text-white rounded-xl">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Penjelajah & Pengelola Database</h2>
              <p className="text-[10px] text-slate-400">Kelola dan jelajahi seluruh 8 tabel/koleksi utama database secara aman.</p>
            </div>
          </div>
          <DatabaseExplorer
            employees={employees}
            onUpdateEmployees={onUpdateEmployees}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            identity={identity}
            onUpdateIdentity={onUpdateIdentity}
            notifications={notifications}
            onUpdateNotifications={onUpdateNotifications}
            agreements={agreements}
            onUpdateAgreements={onUpdateAgreements}
            contracts={contracts}
            onUpdateContracts={onUpdateContracts}
            reporterTargets={reporterTargets}
            onUpdateReporterTargets={onUpdateReporterTargets}
            newsReports={newsReports}
            onUpdateNewsReports={onUpdateNewsReports}
          />
        </div>
      )}

    </div>
  );
}
