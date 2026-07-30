import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Link2, 
  Globe, 
  Plus, 
  Trash2, 
  Settings, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  User, 
  Calendar, 
  ArrowUpRight, 
  Activity,
  Award,
  Video,
  Share2,
  Search,
  Check,
  ChevronRight,
  Filter,
  Radio,
  Upload,
  Download,
  AlertCircle,
  UserCheck,
  RefreshCw,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { Employee, PerformanceAgreement, ReporterTarget, NewsReport } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';

interface PemberitaanMediaBaruViewProps {
  employees: Employee[];
  agreements: PerformanceAgreement[];
  onUpdateAgreements: (agreements: PerformanceAgreement[]) => void;
  reporterTargets: ReporterTarget[];
  onUpdateReporterTargets: (targets: ReporterTarget[]) => void;
  newsReports: NewsReport[];
  onUpdateNewsReports: (reports: NewsReport[]) => void;
  currentUser?: {
    id: string;
    name: string;
    role: 'Kepala' | 'Staff';
    division?: string;
    photo?: string;
  } | null;
}

export default function PemberitaanMediaBaruView({
  employees,
  agreements,
  onUpdateAgreements,
  reporterTargets,
  onUpdateReporterTargets,
  newsReports,
  onUpdateNewsReports,
  currentUser
}: PemberitaanMediaBaruViewProps) {
  // Local active tabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'online' | 'ringan' | 'radio' | 'siaran' | 'targets'>('dashboard');
  
  // Search and filter states
  const [reportSearch, setReportSearch] = useState('');
  const [reportEmpFilter, setReportEmpFilter] = useState<string>('Semua');

  // Form states - Reporter Target
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dailyTarget, setDailyTarget] = useState(2);
  const [monthlyTarget, setMonthlyTarget] = useState(50);
  const [linkedIndicatorId, setLinkedIndicatorId] = useState('');
  const [selectedEditorId, setSelectedEditorId] = useState('');

  // Form states - News Report/Evidence
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportEmployeeId, setReportEmployeeId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportType, setReportType] = useState<'Berita Online' | 'Berita Ringan LPU' | 'Berita Radio' | 'Konten Siaran'>('Berita Online');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEditorId, setReportEditorId] = useState('');
  const [reportDaerah, setReportDaerah] = useState('');

  // Custom extra fields for news categories
  const [reportCategory, setReportCategory] = useState<string>('Politik');
  const [reportPrograma, setReportPrograma] = useState<'Programa 1' | 'Programa 2' | 'Programa 3' | 'Programa 4'>('Programa 1');
  const [reportWriterName, setReportWriterName] = useState<string>('');
  const [reportEditorName, setReportEditorName] = useState<string>('');

  // News Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importActiveTab, setImportActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isNewsDragging, setIsNewsDragging] = useState(false);
  const [isImportingNews, setIsImportingNews] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [parsedNews, setParsedNews] = useState<NewsReport[]>([]);
  const [newsImportText, setNewsImportText] = useState('');
  const newsFileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop event handlers
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
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
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

      const normalized: NewsReport[] = items.map((item, idx) => {
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
        const publishStr = getVal(['waktu publish', 'waktu_publish', 'waktupublish', 'tgl_jam_publish', 'tgl jampublish', 'publishdatetime', 'publish_date', 'date', 'tanggal', 'publish', 'tgl', 'tanggal publish', 'waktu terbit']) || new Date().toISOString();
        const editor = getVal(['editor', 'reviewer', 'pemeriksa']) || '';
        const daerah = getVal(['daerah', 'region', 'lokasi', 'location', 'kota', 'city', 'wilayah']) || '';
        const programa = getVal(['programa', 'pro', 'channel', 'saluran']) || 'Programa 1';
        const subKategori = getVal(['kategori berita', 'kategori_berita', 'subkategori', 'sub_kategori', 'topik', 'kategori_topik']) || 'Politik';

        if (!judul) {
          throw new Error(`Baris ke-${idx + 1} tidak memiliki judul.`);
        }

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
          const defaultRep = employees.find(emp => emp.divisi === 'Pemberitaan' || emp.divisi === 'Konten Media Baru');
          reporterId = defaultRep ? defaultRep.id : (employees[0]?.id || 'emp-unknown');
        }

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

        let datePart = new Date().toISOString().split('T')[0];
        try {
          const d = new Date(publishStr);
          if (!isNaN(d.getTime())) {
            datePart = d.toISOString().split('T')[0];
          }
        } catch (e) {
          // ignore
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
    try {
      const updatedReports = [...parsedNews, ...newsReports];
      onUpdateNewsReports(updatedReports);
      setImportSuccess(`Berhasil menyimpan ${parsedNews.length} data berita ke database RRI Swara!`);
      setParsedNews([]);
      setNewsImportText('');
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportSuccess(null);
      }, 1500);
    } catch (error) {
      console.error(error);
      setImportError("Gagal menyimpan ke database.");
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

  // Sesuai arahan: semua pegawai tanpa melihat divisi/bidangnya dapat membuat berita
  const reporters = useMemo(() => {
    return employees;
  }, [employees]);

  // List of all employee performance indicators (Pegawai level) to link dynamically
  const availableEmployeeIndicators = useMemo(() => {
    const list: { id: string; indicatorName: string; employeeName: string; agreementId: string }[] = [];
    agreements.forEach(ag => {
      if (ag.level === 'Pegawai' && ag.assignedToEmployeeId) {
        const emp = employees.find(e => e.id === ag.assignedToEmployeeId);
        const empName = emp ? emp.nama : ag.assignedToName;
        ag.objectives.forEach(obj => {
          list.push({
            id: obj.id,
            indicatorName: obj.indicatorName,
            employeeName: empName,
            agreementId: ag.id
          });
        });
      }
    });
    return list;
  }, [agreements, employees]);

  // Get dynamic name of linked indicators for helper display
  const getIndicatorName = (id: string) => {
    const found = availableEmployeeIndicators.find(ind => ind.id === id);
    return found ? `${found.employeeName} - ${found.indicatorName}` : 'Belum Ditautkan';
  };

  // Add / Edit Target
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !linkedIndicatorId) {
      alert('Harap pilih Pegawai dan Indikator Kinerja yang akan ditautkan.');
      return;
    }

    const existingIndex = reporterTargets.findIndex(t => t.employeeId === selectedEmployeeId);
    const newTarget: ReporterTarget = {
      id: existingIndex >= 0 ? reporterTargets[existingIndex].id : `tgt-${Date.now()}`,
      employeeId: selectedEmployeeId,
      dailyTarget: Number(dailyTarget),
      monthlyTarget: Number(monthlyTarget),
      linkedIndicatorId,
      year: 2026,
      editorId: selectedEditorId || undefined
    };

    let updated = [...reporterTargets];
    if (existingIndex >= 0) {
      updated[existingIndex] = newTarget;
    } else {
      updated.push(newTarget);
    }

    onUpdateReporterTargets(updated);
    setIsTargetModalOpen(false);
    setSelectedEmployeeId('');
    setLinkedIndicatorId('');
    setSelectedEditorId('');
  };

  const handleDeleteTarget = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengaturan target untuk reporter ini?')) {
      onUpdateReporterTargets(reporterTargets.filter(t => t.id !== id));
    }
  };

  // Submit news report (Evidence)
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportEmployeeId || !reportTitle || !reportUrl) {
      alert('Harap lengkapi semua data laporan (Reporter, Judul Konten, dan Link Eviden).');
      return;
    }

    // Basic URL validation
    if (!reportUrl.startsWith('http://') && !reportUrl.startsWith('https://')) {
      alert('Link eviden harus diawali dengan http:// atau https://');
      return;
    }

    const selectedReporterTarget = reporterTargets.find(t => t.employeeId === reportEmployeeId);
    const finalEditorId = reportEditorId || selectedReporterTarget?.editorId || undefined;

    // Resolve writer and editor names if not explicitly typed
    const empObj = employees.find(e => e.id === reportEmployeeId);
    const editorObj = employees.find(e => e.id === finalEditorId);

    const newReport: NewsReport = {
      id: `rep-${Date.now()}`,
      employeeId: reportEmployeeId,
      title: reportTitle,
      url: reportUrl,
      type: reportType,
      date: reportDate,
      editorId: finalEditorId,
      daerah: reportDaerah || undefined,
      category: ['Berita Online', 'Berita Ringan LPU'].includes(reportType) ? (reportCategory || 'Politik') : undefined,
      programa: ['Berita Radio', 'Konten Siaran'].includes(reportType) ? reportPrograma : undefined,
      writerName: reportWriterName || empObj?.nama || undefined,
      editorName: reportEditorName || editorObj?.nama || undefined
    };

    const updatedReports = [newReport, ...newsReports];
    onUpdateNewsReports(updatedReports);

    // Reset Form
    setIsReportModalOpen(false);
    setReportTitle('');
    setReportUrl('');
    setReportType('Berita Online');
    setReportEditorId('');
    setReportDaerah('');
    setReportCategory('Politik');
    setReportPrograma('Programa 1');
    setReportWriterName('');
    setReportEditorName('');
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus laporan berita/konten ini?')) {
      onUpdateNewsReports(newsReports.filter(r => r.id !== id));
    }
  };

  // Statistics Computations
  const stats = useMemo(() => {
    const totalReports = newsReports.length;
    const beritaRinganCount = newsReports.filter(r => r.type === 'Berita Ringan' || r.type === 'Berita Ringan LPU').length;
    const beritaRadioCount = newsReports.filter(r => r.type === 'Berita Radio').length;
    const beritaOnlineCount = newsReports.filter(r => r.type === 'Berita Online').length;
    const kontenSiaranCount = newsReports.filter(r => r.type === 'Konten Siaran').length;
    
    // Average Daily Production
    // Get unique dates
    const uniqueDates = new Set(newsReports.map(r => r.date));
    const daysCount = Math.max(1, uniqueDates.size);
    const avgDaily = Math.round((totalReports / daysCount) * 10) / 10;

    // Monthly achievement rate against combined targets of active reporters
    const totalMonthlyTarget = reporterTargets.reduce((sum, t) => sum + t.monthlyTarget, 0) || 1; // avoid divide by zero
    const monthlyPct = Math.min(120, Math.round((totalReports / totalMonthlyTarget) * 100));

    return {
      totalReports,
      beritaRinganCount,
      beritaRadioCount,
      beritaOnlineCount,
      kontenSiaranCount,
      avgDaily,
      totalMonthlyTarget,
      monthlyPct
    };
  }, [newsReports, reporterTargets]);

  // Recharts Chart Data - Performance per Reporter
  const chartData = useMemo(() => {
    return reporterTargets.map(tgt => {
      const emp = employees.find(e => e.id === tgt.employeeId);
      const reportsCount = newsReports.filter(r => r.employeeId === tgt.employeeId).length;
      return {
        name: emp ? emp.nama.split(' ')[0] : 'Reporter',
        'Realisasi (Eviden)': reportsCount,
        'Target Bulanan': tgt.monthlyTarget,
        'Target Harian': tgt.dailyTarget
      };
    });
  }, [reporterTargets, newsReports, employees]);

  // Filtered News/Content Reports based on tab state and search query
  const filteredReports = useMemo(() => {
    return newsReports.filter(rep => {
      const emp = employees.find(e => e.id === rep.employeeId);
      const empName = emp ? emp.nama.toLowerCase() : '';
      const matchSearch = rep.title.toLowerCase().includes(reportSearch.toLowerCase()) || 
                          (rep.url && rep.url.toLowerCase().includes(reportSearch.toLowerCase())) ||
                          (rep.category && rep.category.toLowerCase().includes(reportSearch.toLowerCase())) ||
                          (rep.programa && rep.programa.toLowerCase().includes(reportSearch.toLowerCase())) ||
                          empName.includes(reportSearch.toLowerCase());
      
      let matchType = false;
      if (activeSubTab === 'online') {
        matchType = rep.type === 'Berita Online';
      } else if (activeSubTab === 'ringan') {
        matchType = rep.type === 'Berita Ringan LPU' || rep.type === 'Berita Ringan';
      } else if (activeSubTab === 'radio') {
        matchType = rep.type === 'Berita Radio';
      } else if (activeSubTab === 'siaran') {
        matchType = rep.type === 'Konten Siaran';
      } else {
        matchType = true; // For dashboard and targets, we don't filter reports by type
      }

      const matchEmp = reportEmpFilter === 'Semua' || rep.employeeId === reportEmpFilter;

      return matchSearch && matchType && matchEmp;
    });
  }, [newsReports, reportSearch, activeSubTab, reportEmpFilter, employees]);

  // Cascading Path Tracker for Selected Reporter
  const [selectedTrackerEmployeeId, setSelectedTrackerEmployeeId] = useState<string>(reporterTargets[0]?.employeeId || '');
  
  const cascadingPath = useMemo(() => {
    if (!selectedTrackerEmployeeId) return null;
    const target = reporterTargets.find(t => t.employeeId === selectedTrackerEmployeeId);
    if (!target) return null;

    const reporter = employees.find(e => e.id === selectedTrackerEmployeeId);
    if (!reporter) return null;

    // Level 3 (Pegawai) objective
    let l3Obj: any = null;
    let l3Agreement: any = null;
    agreements.forEach(ag => {
      if (ag.level === 'Pegawai' && ag.assignedToEmployeeId === selectedTrackerEmployeeId) {
        const found = ag.objectives.find(obj => obj.id === target.linkedIndicatorId);
        if (found) {
          l3Obj = found;
          l3Agreement = ag;
        }
      }
    });

    if (!l3Obj) return null;

    // Level 2 (Ketua Tim / Kabid) objective
    let l2Obj: any = null;
    let l2Agreement: any = null;
    agreements.forEach(ag => {
      if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
        const found = ag.objectives.find(obj => obj.id === l3Obj.parentIndicatorId);
        if (found) {
          l2Obj = found;
          l2Agreement = ag;
        }
      }
    });

    // Level 1 (Kepala Stasiun) objective
    let l1Obj: any = null;
    let l1Agreement: any = null;
    if (l2Obj) {
      agreements.forEach(ag => {
        if (ag.level === 'Kepala Stasiun') {
          const found = ag.objectives.find(obj => obj.id === l2Obj.parentIndicatorId);
          if (found) {
            l1Obj = found;
            l1Agreement = ag;
          }
        }
      });
    }

    return {
      reporter,
      target,
      l3: { objective: l3Obj, agreement: l3Agreement },
      l2: l2Obj ? { objective: l2Obj, agreement: l2Agreement } : null,
      l1: l1Obj ? { objective: l1Obj, agreement: l1Agreement } : null
    };
  }, [selectedTrackerEmployeeId, reporterTargets, agreements, employees]);

  return (
    <div className="space-y-6" id="pemberitaan-media-baru-section">
      {/* Tab Header with Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">Produksi Siaran dan Berita</h1>
            <p className="text-xs text-slate-500 font-medium">Pengelolaan produksi berita online, berita ringan LPU, siaran berita radio, konten siaran, dan pelacakan trajectory kinerja</p>
          </div>
        </div>

        <button 
          onClick={() => {
            // Pre-select employee if possible
            if (reporters.length > 0) {
              setReportEmployeeId(reporters[0].id);
            }
            // Set default report type based on current tab
            if (activeSubTab === 'online') setReportType('Berita Online');
            else if (activeSubTab === 'ringan') setReportType('Berita Ringan LPU');
            else if (activeSubTab === 'radio') setReportType('Berita Radio');
            else if (activeSubTab === 'siaran') setReportType('Konten Siaran');
            else setReportType('Berita Online');
            
            setIsReportModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Laporan Produksi
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-100 gap-y-2 gap-x-6">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Dashboard & Alur Kinerja
        </button>
        <button
          onClick={() => setActiveSubTab('online')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'online' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Berita Online/KBRN ({stats.beritaOnlineCount})
        </button>
        <button
          onClick={() => setActiveSubTab('ringan')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'ringan' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Berita Ringan LPU ({stats.beritaRinganCount})
        </button>
        <button
          onClick={() => setActiveSubTab('radio')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'radio' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Berita Radio ({stats.beritaRadioCount})
        </button>
        <button
          onClick={() => setActiveSubTab('siaran')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'siaran' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Konten Siaran ({stats.kontenSiaranCount})
        </button>
        <button
          onClick={() => setActiveSubTab('targets')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'targets' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Pengaturan Target ({reporterTargets.length})
        </button>
      </div>

      {/* Sub-tab 1: Dashboard Utama & Alur Capaian */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Berita Online/KBRN</span>
                <p className="text-2xl font-black text-emerald-600">{stats.beritaOnlineCount}</p>
                <div className="text-[10px] text-slate-500 font-medium">Website CMS RRI</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Berita Ringan LPU</span>
                <p className="text-2xl font-black text-amber-600">{stats.beritaRinganCount}</p>
                <div className="text-[10px] text-slate-500 font-medium">Logbook & daftar LPU</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Berita Radio</span>
                <p className="text-2xl font-black text-sky-600">{stats.beritaRadioCount}</p>
                <div className="text-[10px] text-slate-500 font-medium">Siaran berita Pro 1/2/3/4</div>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                <Radio className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Konten Siaran</span>
                <p className="text-2xl font-black text-indigo-600">{stats.kontenSiaranCount}</p>
                <div className="text-[10px] text-slate-500 font-medium">Flyer, Podcast, Dialog, dll.</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Column */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Grafik Realisasi Kinerja Berita per Reporter
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Tahun 2026</span>
              </div>

              {chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                  Belum ada pengaturan target reporter. Silakan atur target reporter terlebih dahulu.
                </div>
              ) : (
                <div className="h-72 w-full text-xs font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={10} iconType="circle" />
                      <Bar dataKey="Realisasi (Eviden)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={25} />
                      <Bar dataKey="Target Bulanan" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Quick Actions / Activity Stream */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-50 pb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Laporan Eviden Terakhir
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
                {newsReports.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic text-center py-10">Belum ada rilis berita dilaporkan.</p>
                ) : (
                  newsReports.slice(0, 5).map(rep => {
                    const emp = employees.find(e => e.id === rep.employeeId);
                    return (
                      <div key={rep.id} className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100/60 text-xs space-y-2 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wide uppercase ${
                            rep.type === 'Berita Ringan' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                              : rep.type === 'Berita Radio' 
                              ? 'bg-sky-50 text-sky-700 border border-sky-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {rep.type}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{rep.date}</span>
                        </div>
                        <p className="font-semibold text-slate-700 leading-normal line-clamp-2">{rep.title}</p>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] font-medium text-slate-500 truncate max-w-40 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {emp ? emp.nama : 'Unknown'}
                          </span>
                          <a 
                            href={rep.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            Buka Link <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Interactive Cascade Performance Visualizer (Alur Capaian Kinerja) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5 shadow-xs">
            <div className="border-b border-slate-50 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500 animate-pulse" />
                  Visualisasi Alur & Dampak Capaian Kinerja Berjenjang (Cascade Path Tracker)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Pilih reporter di bawah untuk menelusuri bagaimana rilis eviden langsung menaikkan capaian Ketua Tim hingga Kepala Stasiun!</p>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 font-semibold font-mono">PILIH REPORTER:</span>
                <select
                  value={selectedTrackerEmployeeId}
                  onChange={(e) => setSelectedTrackerEmployeeId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="">-- Pilih --</option>
                  {reporterTargets.map(tgt => {
                    const emp = employees.find(e => e.id === tgt.employeeId);
                    return (
                      <option key={tgt.id} value={tgt.employeeId}>
                        {emp ? emp.nama : 'Reporter'} ({emp ? emp.divisi : ''})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {cascadingPath ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative select-none">
                {/* Visual cascade connection lines for desktop */}
                <div className="hidden md:block absolute top-1/2 left-[31%] w-[4%] border-t-2 border-dashed border-slate-200 -translate-y-1/2" />
                <div className="hidden md:block absolute top-1/2 left-[64%] w-[4%] border-t-2 border-dashed border-slate-200 -translate-y-1/2" />

                {/* Level 3: Reporter (Pegawai) */}
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">Level 3: Reporter / Pegawai</span>
                    <div className="flex items-center gap-2.5 pt-1">
                      <div className="w-9 h-9 rounded-full bg-white border border-indigo-200 overflow-hidden shrink-0">
                        <img referrerPolicy="no-referrer" src={cascadingPath.reporter.foto} alt={cascadingPath.reporter.nama} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 leading-tight">{cascadingPath.reporter.nama}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{cascadingPath.reporter.divisi}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100/40 text-xs space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Sasaran Kinerja Terkait</div>
                    <p className="font-semibold text-slate-700 line-clamp-2">{cascadingPath.l3.objective.indicatorName}</p>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Realisasi</span>
                        <span className="text-sm font-black text-indigo-600">{cascadingPath.l3.objective.achievement} {cascadingPath.l3.objective.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Target PK</span>
                        <span className="text-sm font-bold text-slate-600">{cascadingPath.l3.objective.target} {cascadingPath.l3.objective.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-indigo-600 font-bold bg-white/80 py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 border border-indigo-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Berdasarkan {newsReports.filter(r => r.employeeId === selectedTrackerEmployeeId).length} rilis eviden
                  </div>
                </div>

                {/* Level 2: Ketua Tim (Pemberitaan / Konten) */}
                {cascadingPath.l2 ? (
                  <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="bg-amber-100 text-amber-700 font-extrabold text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">Level 2: Ketua Tim / Kabag</span>
                      <div className="pt-1">
                        <h4 className="text-xs font-bold text-slate-700 leading-tight">{cascadingPath.l2.agreement.assignedToName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{cascadingPath.l2.agreement.level}</p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-amber-100/40 text-xs space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Indikator Cascaded</div>
                      <p className="font-semibold text-slate-700 line-clamp-2">{cascadingPath.l2.objective.indicatorName}</p>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Realisasi</span>
                          <span className="text-sm font-black text-amber-600">{cascadingPath.l2.objective.achievement} {cascadingPath.l2.objective.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Target PK</span>
                          <span className="text-sm font-bold text-slate-600">{cascadingPath.l2.objective.target} {cascadingPath.l2.objective.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-700 font-bold bg-white/80 py-1.5 px-2.5 rounded-lg text-center border border-amber-100 flex items-center justify-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      Auto Roll-up dari Reporter divisi
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-center text-center text-xs text-slate-400 italic">
                    Belum ada Ketua Tim yang ditautkan ke Indikator Reporter ini.
                  </div>
                )}

                {/* Level 1: Kepala Stasiun */}
                {cascadingPath.l1 ? (
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">Level 1: Kepala Stasiun</span>
                      <div className="pt-1">
                        <h4 className="text-xs font-bold text-slate-700 leading-tight">{cascadingPath.l1.agreement.assignedToName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Kepala Stasiun RRI Bandar Lampung</p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100/40 text-xs space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">IKU Utama Kepala Stasiun</div>
                      <p className="font-semibold text-slate-700 line-clamp-2">{cascadingPath.l1.objective.indicatorName}</p>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Realisasi</span>
                          <span className="text-sm font-black text-emerald-600">{cascadingPath.l1.objective.achievement} {cascadingPath.l1.objective.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Target PK</span>
                          <span className="text-sm font-bold text-slate-600">{cascadingPath.l1.objective.target} {cascadingPath.l1.objective.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-emerald-700 font-bold bg-white/80 py-1.5 px-2.5 rounded-lg text-center border border-emerald-100 flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Capaian Kinerja Puncak (Stasiun)
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-center text-center text-xs text-slate-400 italic">
                    Belum ada Indikator Kepala Stasiun yang ditautkan ke Ketua Tim ini.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50/50 rounded-xl p-8 text-center text-xs text-slate-500 italic">
                {reporterTargets.length === 0 
                  ? 'Pengaturan target harian/bulanan reporter belum diset. Silakan buka tab "Pengaturan Target Reporter" untuk memulai.' 
                  : 'Silakan pilih salah satu reporter di atas untuk melacak alur capaian kinerjanya.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Pengaturan Target Reporter */}
      {activeSubTab === 'targets' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pengaturan Target & Tautan Kinerja Reporter</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Konfigurasi jumlah target harian/bulanan per individu reporter dan kaitkan ke sasaran pada PK Pegawai mereka</p>
            </div>

            <button
              onClick={() => {
                setIsTargetModalOpen(true);
                // Select first employee as default
                if (reporters.length > 0) {
                  setSelectedEmployeeId(reporters[0].id);
                }
                // Select first indicator as default if available
                if (availableEmployeeIndicators.length > 0) {
                  setLinkedIndicatorId(availableEmployeeIndicators[0].id);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Atur Target Baru
            </button>
          </div>

          {reporterTargets.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs italic space-y-3">
              <p>Belum ada target reporter yang diset.</p>
              <p className="text-[10px] text-slate-400 font-medium max-w-sm mx-auto">Untuk mengaktifkan kalkulasi capaian otomatis, tambahkan target untuk pegawai di divisi Pemberitaan atau Konten Media Baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Nama Reporter</th>
                    <th className="px-5 py-3">Divisi</th>
                    <th className="px-5 py-3">Editor Pengampu</th>
                    <th className="px-5 py-3 text-center">Target Harian</th>
                    <th className="px-5 py-3 text-center">Target Bulanan</th>
                    <th className="px-5 py-3">Indikator PK Pegawai yang Ditautkan</th>
                    <th className="px-5 py-3 text-center">Realisasi Saat Ini</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporterTargets.map(tgt => {
                    const emp = employees.find(e => e.id === tgt.employeeId);
                    const editor = employees.find(e => e.id === tgt.editorId);
                    const reportsCount = newsReports.filter(r => r.employeeId === tgt.employeeId).length;
                    const pct = tgt.monthlyTarget > 0 ? Math.round((reportsCount / tgt.monthlyTarget) * 100) : 0;
                    
                    return (
                      <tr key={tgt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {emp ? emp.nama : 'Unknown Reporter'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            emp?.divisi === 'Pemberitaan' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}>
                            {emp?.divisi || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {editor ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                              <span className="font-semibold text-slate-700">{editor.nama}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum Ditunjuk</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-700 font-mono">
                          {tgt.dailyTarget} berita
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-700 font-mono">
                          {tgt.monthlyTarget} berita
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-500 max-w-xs truncate">
                          {getIndicatorName(tgt.linkedIndicatorId)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-extrabold text-indigo-600 font-mono">{reportsCount} berita ({pct}%)</span>
                            <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedEmployeeId(tgt.employeeId);
                              setDailyTarget(tgt.dailyTarget);
                              setMonthlyTarget(tgt.monthlyTarget);
                              setLinkedIndicatorId(tgt.linkedIndicatorId);
                              setSelectedEditorId(tgt.editorId || '');
                              setIsTargetModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-block"
                            title="Edit target"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTarget(tgt.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-block"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Produksi Siaran & Berita Categories (online, ringan, radio, siaran) */}
      {['online', 'ringan', 'radio', 'siaran'].includes(activeSubTab) && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-xs">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeSubTab === 'online' || activeSubTab === 'ringan'
                      ? "Cari judul berita, penulis, editor, link..."
                      : "Cari nama siaran/konten, programa, link..."
                  }
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 w-full sm:w-64"
                />
              </div>

              {/* Employee Filter */}
              <select
                value={reportEmpFilter}
                onChange={(e) => setReportEmpFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-hidden"
              >
                <option value="Semua">Semua Pegawai/Reporter</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.divisi})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 ml-auto md:ml-0">
              <button
                onClick={() => {
                  setParsedNews([]);
                  setImportError(null);
                  setImportSuccess(null);
                  setIsImportModalOpen(true);
                }}
                className="bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-500" />
                Import Berita / Konten
              </button>

              <button
                onClick={() => {
                  if (reporters.length > 0) {
                    setReportEmployeeId(reporters[0].id);
                  }
                  // Pre-set report category type
                  if (activeSubTab === 'online') setReportType('Berita Online');
                  else if (activeSubTab === 'ringan') setReportType('Berita Ringan LPU');
                  else if (activeSubTab === 'radio') setReportType('Berita Radio');
                  else if (activeSubTab === 'siaran') setReportType('Konten Siaran');
                  
                  setIsReportModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Laporan Baru
              </button>
            </div>
          </div>

          <div className="border-l-4 border-indigo-500 bg-indigo-50/50 p-3.5 rounded-r-xl">
            <h4 className="text-xs font-bold text-slate-700 capitalize">
              {activeSubTab === 'online' && "Berita Online/KBRN — Diproduksi di Website CMS RRI (Kategori Berita Berbeda)"}
              {activeSubTab === 'ringan' && "Berita Ringan LPU — Logbook dan daftar berita yang diproduksi oleh LPU"}
              {activeSubTab === 'radio' && "Berita Radio — Logbook siaran divisi pemberitaan, arsip siaran (audio teks video)"}
              {activeSubTab === 'siaran' && "Konten Siaran — Flyer, Dialog, Talkshow, Obrolan, Feature, Podcast, ILM, Drama, Liputan Tematik"}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              {activeSubTab === 'online' && "Menampilkan daftar rilis berita online/KBRN lengkap dengan nama penulis, editor, link portal, dan kategori berita."}
              {activeSubTab === 'ringan' && "Menampilkan rilis berita non-hotnews (ringan) yang dikerjakan oleh bidang LPU/Pemberitaan."}
              {activeSubTab === 'radio' && "Mencakup logbook siaran Programa 1, 2, 3, atau 4 dengan tautan rekaman audio, teks, dan video sebagai eviden."}
              {activeSubTab === 'siaran' && "Daftar siaran non-berita seperti flyer acara, dialog interaktif, podcast, drama radio, dan iklan layanan masyarakat."}
            </p>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs italic">
              Belum ada data laporan untuk kategori ini atau tidak cocok dengan pencarian filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
                <thead>
                  {/* Headers for Online / Ringan */}
                  {(activeSubTab === 'online' || activeSubTab === 'ringan') ? (
                    <tr className="bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Tanggal Publish</th>
                      <th className="px-5 py-3">Judul Berita</th>
                      <th className="px-5 py-3">Penulis (Reporter)</th>
                      <th className="px-5 py-3">Editor</th>
                      <th className="px-5 py-3">Kategori Berita</th>
                      <th className="px-5 py-3">Link</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  ) : (
                    /* Headers for Radio / Siaran */
                    <tr className="bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Tanggal</th>
                      <th className="px-5 py-3">Nama {activeSubTab === 'siaran' ? 'Konten' : 'Berita'}</th>
                      <th className="px-5 py-3">Programa</th>
                      <th className="px-5 py-3">Eviden Upload (Link/Foto/File)</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map(rep => {
                    const emp = employees.find(e => e.id === rep.employeeId);
                    const reportEditor = employees.find(e => e.id === rep.editorId);
                    const reporterTarget = reporterTargets.find(t => t.employeeId === rep.employeeId);
                    const defaultEditor = reporterTarget ? employees.find(e => e.id === reporterTarget.editorId) : null;
                    const editorToDisplay = reportEditor || defaultEditor;

                    return (
                      <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">
                          {rep.date}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800 leading-normal max-w-sm">
                          <span className="block">{rep.title}</span>
                          {rep.daerah && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm text-[9px] font-bold mt-1">
                              📍 {rep.daerah}
                            </span>
                          )}
                        </td>

                        {/* Condition for Online/Ringan Extra Columns */}
                        {(activeSubTab === 'online' || activeSubTab === 'ringan') ? (
                          <>
                            <td className="px-5 py-3.5 font-semibold text-slate-700">
                              {rep.writerName || emp?.nama || 'Unknown'}
                            </td>
                            <td className="px-5 py-3.5">
                              {rep.editorName || editorToDisplay?.nama ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-700">{rep.editorName || editorToDisplay?.nama}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded-sm font-mono scale-90">Ed</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {rep.category || 'Politik'}
                              </span>
                            </td>
                          </>
                        ) : (
                          /* Condition for Radio/Siaran Extra Columns */
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100">
                              {rep.programa || 'Programa 1'}
                            </span>
                          </td>
                        )}

                        <td className="px-5 py-3.5 text-indigo-600 font-medium">
                          {rep.url ? (
                            <a
                              href={rep.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-xs">{rep.url}</span>
                              <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Tidak ada link</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteReport(rep.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-block"
                            title="Hapus rilis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Pengaturan Target Reporter */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                Konfigurasi Target Reporter
              </h4>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              {/* Select Employee */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Pilih Pegawai Reporter</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Pilih --</option>
                  {reporters.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nama} ({emp.divisi})</option>
                  ))}
                </select>
              </div>

              {/* Targets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Target Harian</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-bold text-slate-700 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 font-bold shrink-0">Berita</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Target Bulanan</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-bold text-slate-700 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 font-bold shrink-0">Berita</span>
                  </div>
                </div>
              </div>               {/* Link to Performance Indicator */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Kaitkan ke Sasaran PK Pegawai</label>
                <select
                  value={linkedIndicatorId}
                  onChange={(e) => setLinkedIndicatorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Hubungkan Indikator PK Pegawai --</option>
                  {availableEmployeeIndicators.map(ind => (
                    <option key={ind.id} value={ind.id}>
                      {ind.employeeName} - {ind.indicatorName} (ID: {ind.id})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 leading-normal mt-1 italic">Tautan ini membuat sistem auto-kalkulasi rilis eviden sebagai capaian di perjanjian kinerja berjenjang.</p>
              </div>

              {/* Tunjuk Editor Terkait */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Tunjuk Editor Terkait (Atasan / Verifikator)</label>
                <select
                  value={selectedEditorId}
                  onChange={(e) => setSelectedEditorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Tanpa Editor / Tidak Ditunjuk --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nama} ({emp.divisi})</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 leading-normal mt-1 italic">Editor ditunjuk dari pegawai yang ada untuk mengisi/melaporkan eviden bagi reporter ini.</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Laporkan Berita / Konten (Evidence) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Tambah Laporan Produksi
              </h4>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-4">
              {/* Type Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Kategori Produksi / Lapisan</label>
                <select
                  value={reportType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setReportType(val);
                    // Set default category / programa values
                    if (val === 'Berita Online' || val === 'Berita Ringan LPU') {
                      setReportCategory('Politik');
                    } else {
                      setReportPrograma('Programa 1');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="Berita Online">Berita Online / KBRN</option>
                  <option value="Berita Ringan LPU">Berita Ringan LPU</option>
                  <option value="Berita Radio">Berita Radio</option>
                  <option value="Konten Siaran">Konten Siaran</option>
                </select>
              </div>

              {/* Select Reporter */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  {['Berita Online', 'Berita Ringan LPU'].includes(reportType) ? 'Penulis / Reporter' : 'Nama Pembuat / Pegawai'}
                </label>
                <select
                  value={reportEmployeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    setReportEmployeeId(empId);
                    const emp = employees.find(x => x.id === empId);
                    if (emp) {
                      setReportWriterName(emp.nama);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} ({emp.divisi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Editor for Submission */}
              {reportEmployeeId && (() => {
                const selectedReporterTarget = reporterTargets.find(t => t.employeeId === reportEmployeeId);
                const assignedEditor = selectedReporterTarget ? employees.find(e => e.id === selectedReporterTarget.editorId) : null;
                return (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Editor Penanggung Jawab</label>
                    <select
                      value={reportEditorId}
                      onChange={(e) => {
                        const edId = e.target.value;
                        setReportEditorId(edId);
                        const ed = employees.find(x => x.id === edId);
                        if (ed) {
                          setReportEditorName(ed.nama);
                        } else if (assignedEditor) {
                          setReportEditorName(assignedEditor.nama);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      <option value="">{assignedEditor ? `-- Gunakan Editor Default: ${assignedEditor.nama} --` : '-- Pilih Editor --'}</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nama} ({emp.divisi})</option>
                      ))}
                    </select>
                    {assignedEditor && !reportEditorId && (
                      <p className="text-[9px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                        <span>✓</span> Terdeteksi editor default: <strong>{assignedEditor.nama}</strong>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Date and dynamic fields (Category / Programa) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Tanggal Selesai / Terbit</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 font-mono"
                  />
                </div>

                {['Berita Online', 'Berita Ringan LPU'].includes(reportType) ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Kategori Berita</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      <option value="Politik">Politik</option>
                      <option value="Ekonomi">Ekonomi</option>
                      <option value="Sosial">Sosial</option>
                      <option value="Budaya">Budaya</option>
                      <option value="Daerah">Daerah</option>
                      <option value="Internasional">Internasional</option>
                      <option value="Olahraga">Olahraga</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Programa Radio</label>
                    <select
                      value={reportPrograma}
                      onChange={(e) => setReportPrograma(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      <option value="Programa 1">Programa 1</option>
                      <option value="Programa 2">Programa 2</option>
                      <option value="Programa 3">Programa 3</option>
                      <option value="Programa 4">Programa 4</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Title / Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  {reportType === 'Konten Siaran' ? 'Nama Konten Siaran' : 'Nama Berita / Judul Berita'}
                </label>
                <input
                  type="text"
                  placeholder={
                    reportType === 'Konten Siaran'
                      ? "e.g. Produksi Flyer Dialog Kebangsaan Pro 1, Podcast Eps 5"
                      : "e.g. Liputan Khusus Pemilu Daerah Sukses Digelar RRI Bandar Lampung"
                  }
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                />
              </div>

              {/* Daerah / Wilayah (Optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Daerah / Wilayah Liputan</label>
                <input
                  type="text"
                  placeholder="e.g. Bandar Lampung, Surakarta, Jakarta"
                  value={reportDaerah}
                  onChange={(e) => setReportDaerah(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                />
              </div>

              {/* Link / URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Eviden Upload (Link / Foto / File URL)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/... / https://rri.co.id/..."
                    value={reportUrl}
                    onChange={(e) => setReportUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 font-mono"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 italic leading-normal">
                  Sertakan tautan Google Drive / Cloud storage untuk file audio/video, atau link CMS rri.co.id untuk berita online.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white font-semibold text-xs rounded-xl shadow-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  Laporkan Produksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Import Berita Online / Radio (Wizard) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-4xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Wizard Import Data Berita Online & Radio
                  </h4>
                  <p className="text-[11px] text-slate-400">Import file hasil export aplikasi berita Anda (Excel, CSV, JSON)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedNews([]);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Error and Success Alerts */}
            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{importError}</span>
              </div>
            )}
            {importSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{importSuccess}</span>
              </div>
            )}

            {/* Wizard Tabs */}
            <div className="flex border-b border-slate-100 space-x-4">
              <button
                onClick={() => setImportActiveTab('upload')}
                className={`pb-2 text-xs font-bold transition-all relative ${
                  importActiveTab === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Unggah File Laporan
              </button>
              <button
                onClick={() => setImportActiveTab('paste')}
                className={`pb-2 text-xs font-bold transition-all relative ${
                  importActiveTab === 'paste' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Tempel Data JSON / Text
              </button>
            </div>

            {/* Tab 1: Upload Dropzone */}
            {importActiveTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={handleNewsDragOver}
                  onDragLeave={handleNewsDragLeave}
                  onDrop={handleNewsDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                    isNewsDragging 
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                  onClick={() => newsFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={newsFileInputRef}
                    onChange={handleNewsFileChange}
                    accept=".xlsx,.xls,.csv,.json"
                    className="hidden"
                  />
                  <div className="p-4 bg-white rounded-full shadow-xs border border-slate-100 text-indigo-500">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Tarik & Lepas file di sini, atau klik untuk memilih</p>
                    <p className="text-[10px] text-slate-400">Mendukung file Excel (.xlsx, .xls), CSV (.csv), atau JSON (.json)</p>
                  </div>
                </div>

                {/* Templates download helper */}
                <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-indigo-900">Belum memiliki file laporan?</p>
                    <p className="text-[10px] text-indigo-700">Unduh salah satu template standar kolom berita di bawah ini:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadSampleTemplate('xlsx')}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSampleTemplate('csv')}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> CSV (.csv)
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSampleTemplate('json')}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> JSON
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Paste Area */}
            {importActiveTab === 'paste' && (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Tempel data terformat JSON berita di bawah</label>
                <textarea
                  value={newsImportText}
                  onChange={(e) => setNewsImportText(e.target.value)}
                  placeholder={`[\n  {\n    "Judul Berita": "Dialog Digitalisasi RRI",\n    "Waktu Publish": "2026-07-06 10:00:00",\n    "Penulis": "NIP_ATAU_NAMA_STAFF",\n    "Editor": "NIP_ATAU_NAMA_EDITOR",\n    "Daerah": "Bandung",\n    "URL": "https://rri.co.id/swara/news/1"\n  }\n]`}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden rounded-xl p-3 text-xs font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => parseNewsData(newsImportText, 'json')}
                  disabled={!newsImportText.trim()}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Proses Data Tempel
                </button>
              </div>
            )}

            {/* Preview Parsed Data */}
            {parsedNews.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Pratinjau Data yang Siap Di-import ({parsedNews.length} Berita)
                </h5>

                <div className="overflow-x-auto max-h-60 border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-[11px] text-slate-600 divide-y divide-slate-100">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-2">Kategori</th>
                        <th className="px-4 py-2">Judul Berita</th>
                        <th className="px-4 py-2">Waktu Terbit</th>
                        <th className="px-4 py-2">Penulis (Staff)</th>
                        <th className="px-4 py-2">Editor (Verifikator)</th>
                        <th className="px-4 py-2">Daerah</th>
                        <th className="px-4 py-2">URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {parsedNews.map((news, idx) => {
                        const matchedReporter = employees.find(e => e.id === news.employeeId);
                        const matchedEditor = employees.find(e => e.id === news.editorId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                news.type === 'Berita Ringan' 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                  : news.type === 'Berita Radio' 
                                  ? 'bg-sky-50 text-sky-700 border border-sky-100' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {news.type}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-semibold text-slate-800 max-w-xs truncate" title={news.title}>
                              {news.title}
                            </td>
                            <td className="px-4 py-2 font-mono text-[9px] text-slate-500 whitespace-nowrap">
                              {news.publishDateTime || news.date}
                            </td>
                            <td className="px-4 py-2">
                              {matchedReporter ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-700 leading-none">{matchedReporter.nama}</div>
                                  <div className="text-[9px] text-slate-400 font-mono scale-90 origin-left">{matchedReporter.nip}</div>
                                </div>
                              ) : (
                                <div className="text-slate-500 font-semibold">{news.reporterName || 'Default Reporter'}</div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {matchedEditor ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-700 leading-none">{matchedEditor.nama}</div>
                                  <div className="text-[9px] text-slate-400 font-mono scale-90 origin-left">{matchedEditor.nip}</div>
                                </div>
                              ) : (
                                <div className="text-slate-400 italic">{news.editorName || '-'}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 font-bold text-slate-600">
                              {news.daerah ? `📍 ${news.daerah}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-indigo-500 font-mono truncate max-w-xs" title={news.url}>
                              <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {news.url}
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedNews([]);
                      setImportError(null);
                      setImportSuccess(null);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Reset Urut
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveImportedNews}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Simpan & Daftarkan ke Database RRI Swara ({parsedNews.length} Berita)
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedNews([]);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup Wizard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
