import React, { useState } from 'react';
import { 
  Employee, AppSettings, InstitutionalIdentity, CriticalNotification, 
  PerformanceAgreement, CooperationContract, ReporterTarget, NewsReport, PromotionActivity 
} from '../types';
import { 
  Database, Search, Plus, Trash2, Edit3, Save, FileJson, X, 
  Download, Upload, AlertCircle, Check, Play, Settings, RefreshCw, 
  HelpCircle, ShieldCheck, ChevronRight, HardDrive, Calendar, UserCheck, 
  Award, FileText, Radio, Layers, Clock, Building, PenTool, Megaphone 
} from 'lucide-react';

interface DatabaseExplorerProps {
  employees: Employee[];
  onUpdateEmployees?: (employees: Employee[]) => void;
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  identity: InstitutionalIdentity;
  onUpdateIdentity?: (identity: InstitutionalIdentity) => void;
  notifications: CriticalNotification[];
  onUpdateNotifications?: (notifications: CriticalNotification[]) => void;
  agreements: PerformanceAgreement[];
  onUpdateAgreements?: (agreements: PerformanceAgreement[]) => void;
  contracts: CooperationContract[];
  onUpdateContracts?: (contracts: CooperationContract[]) => void;
  reporterTargets: ReporterTarget[];
  onUpdateReporterTargets?: (targets: ReporterTarget[]) => void;
  newsReports: NewsReport[];
  onUpdateNewsReports?: (reports: NewsReport[]) => void;
  promotions?: PromotionActivity[];
  onUpdatePromotions?: (promotions: PromotionActivity[]) => void;
}

export default function DatabaseExplorer({
  employees,
  onUpdateEmployees,
  settings,
  onUpdateSettings,
  identity,
  onUpdateIdentity,
  notifications,
  onUpdateNotifications,
  agreements,
  onUpdateAgreements,
  contracts,
  onUpdateContracts,
  reporterTargets,
  onUpdateReporterTargets,
  newsReports,
  onUpdateNewsReports,
  promotions = [],
  onUpdatePromotions
}: DatabaseExplorerProps) {
  
  // List of all active collections in the app
  const collections = [
    { id: 'employees', label: 'Pegawai', icon: UserCheck, data: employees, update: onUpdateEmployees },
    { id: 'agreements', label: 'Perjanjian Kinerja SAKIP', icon: Award, data: agreements, update: onUpdateAgreements },
    { id: 'promotions', label: 'Kegiatan Promosi', icon: Megaphone, data: promotions, update: onUpdatePromotions },
    { id: 'contracts', label: 'Kerja Sama PNBP', icon: FileText, data: contracts, update: onUpdateContracts },
    { id: 'newsReports', label: 'Laporan Berita & Media Baru', icon: Radio, data: newsReports, update: onUpdateNewsReports },
    { id: 'reporterTargets', label: 'Target Angka Kredit', icon: Layers, data: reporterTargets, update: onUpdateReporterTargets },
    { id: 'notifications', label: 'Notifikasi Kritis', icon: Clock, data: notifications, update: onUpdateNotifications },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Building, data: [settings], update: (val: any) => onUpdateSettings?.(val[0]) },
    { id: 'identity', label: 'Identitas Pejabat & TTD', icon: PenTool, data: [identity], update: (val: any) => onUpdateIdentity?.(val[0]) },
  ];

  const [selectedColId, setSelectedColId] = useState<string>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // CRUD states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setCrudMode] = useState<'add' | 'edit'>('add');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'fields' | 'json'>('fields');
  const [docJsonText, setDocJsonText] = useState('');
  const [structuredFields, setStructuredFields] = useState<any>({});
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');

  // Bulk Import state for individual table
  const [bulkImportText, setBulkImportText] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const activeCol = collections.find(c => c.id === selectedColId) || collections[0];

  // Search filter
  const filteredData = activeCol.data.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.entries(item).some(([key, val]) => {
      if (key === 'foto' || key === 'ttdElektronik' || key === 'signaturePembuat' || key === 'signaturePenerima' || key.toLowerCase().includes('ttd')) {
        return false; // skip large base64 strings
      }
      return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
    });
  });

  // Pagination logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getColumnHeaders = (colId: string) => {
    switch (colId) {
      case 'employees':
        return [
          { key: 'id', label: 'ID/NIK' },
          { key: 'nip', label: 'NIP' },
          { key: 'nama', label: 'Nama Pegawai' },
          { key: 'divisi', label: 'Divisi' },
          { key: 'role', label: 'Kewenangan' }
        ];
      case 'agreements':
        return [
          { key: 'year', label: 'Tahun' },
          { key: 'level', label: 'Tingkat SAKIP' },
          { key: 'assignedToName', label: 'Penanggung Jawab' },
          { key: 'status', label: 'Status' }
        ];
      case 'contracts':
        return [
          { key: 'partnerName', label: 'Mitra Kerja Sama' },
          { key: 'contractNo', label: 'No. Kontrak' },
          { key: 'cooperationType', label: 'Jenis' },
          { key: 'value', label: 'Nilai (Jt Rp)' },
          { key: 'paymentStatus', label: 'Pembayaran' }
        ];
      case 'newsReports':
        return [
          { key: 'reporterName', label: 'Reporter' },
          { key: 'title', label: 'Judul Berita/Konten' },
          { key: 'type', label: 'Tipe' },
          { key: 'category', label: 'Kategori' },
          { key: 'date', label: 'Tanggal' }
        ];
      case 'reporterTargets':
        return [
          { key: 'employeeId', label: 'ID Pegawai / NIP' },
          { key: 'dailyTarget', label: 'Target Harian' },
          { key: 'monthlyTarget', label: 'Target Bulanan' },
          { key: 'year', label: 'Tahun' }
        ];
      case 'notifications':
        return [
          { key: 'title', label: 'Notifikasi' },
          { key: 'type', label: 'Tipe' },
          { key: 'timestamp', label: 'Waktu Dibuat' },
          { key: 'isRead', label: 'Dibaca?' }
        ];
      case 'settings':
        return [
          { key: 'namaInstansi', label: 'Nama Instansi' },
          { key: 'alamat', label: 'Alamat Kantor' },
          { key: 'noTelp', label: 'No. Telepon' }
        ];
      case 'identity':
        return [
          { key: 'kepalaStasiunNama', label: 'Kepala Stasiun' },
          { key: 'kepalaBidangNama', label: 'Kepala Bidang' },
          { key: 'ketuaTimSiaranNama', label: 'Katim Siaran' },
          { key: 'ketuaTimPemberitaanNama', label: 'Katim Pemberitaan' }
        ];
      default:
        return [];
    }
  };

  const getInitialTemplate = (colId: string) => {
    const id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    switch (colId) {
      case 'employees':
        return { 
          id, nik: '', nip: '', nama: '', gelarDepan: '', gelarBelakang: '', 
          jenjangPendidikan: 'S1', divisi: 'Siaran', jenisKelamin: 'Laki-laki', 
          alamat: '', noHp: '', foto: '', ttdElektronik: '', 
          createdAt: new Date().toISOString(), role: 'Staff', isEditor: false, password: 'staff' 
        };
      case 'agreements':
        return { 
          id, year: new Date().getFullYear(), level: 'Pegawai', 
          assignedToEmployeeId: '', assignedToName: '', objectives: [], 
          status: 'Draft', createdAt: new Date().toISOString() 
        };
      case 'contracts':
        return { 
          id, partnerName: '', contractNo: '', activityName: '', 
          cooperationType: 'Iklan/Siar Layanan', value: 0, realizedPnbp: 0, 
          paymentStatus: 'Belum Bayar', startDate: new Date().toISOString().split('T')[0], 
          endDate: new Date().toISOString().split('T')[0], linkedIndicatorId: '' 
        };
      case 'newsReports':
        return { 
          id, employeeId: '', title: '', url: '', type: 'Berita Online', 
          date: new Date().toISOString().split('T')[0], writerName: '', editorName: '', 
          category: 'teks', publishDateTime: new Date().toISOString() 
        };
      case 'reporterTargets':
        return { 
          id, employeeId: '', dailyTarget: 1, monthlyTarget: 22, 
          linkedIndicatorId: '', year: new Date().getFullYear() 
        };
      case 'notifications':
        return { 
          id, title: '', message: '', type: 'info', 
          timestamp: new Date().toISOString(), isRead: false 
        };
      case 'settings':
        return { namaInstansi: '', alamat: '', noTelp: '' };
      case 'identity':
        return { 
          kepalaStasiunNama: '', kepalaStasiunTtd: '', kepalaBidangNama: '', kepalaBidangTtd: '', 
          ketuaTimSiaranNama: '', ketuaTimSiaranTtd: '', ketuaTimPemberitaanNama: '', ketuaTimPemberitaanTtd: '', 
          ketuaTimTeknikNama: '', ketuaTimTeknikTtd: '', ketuaTimKontenNama: '', ketuaTimKontenTtd: '', 
          ketuaTimLayananNama: '', ketuaTimLayananTtd: '' 
        };
      default:
        return { id };
    }
  };

  const handleOpenAdd = () => {
    setCrudMode('add');
    setEditingDocId(null);
    setCrudError('');
    setCrudSuccess('');
    const template = getInitialTemplate(selectedColId);
    setStructuredFields(template);
    setDocJsonText(JSON.stringify(template, null, 2));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setCrudMode('edit');
    const docId = item.id || 'current';
    setEditingDocId(docId);
    setCrudError('');
    setCrudSuccess('');
    setStructuredFields({ ...item });
    setDocJsonText(JSON.stringify(item, null, 2));
    setIsModalOpen(true);
  };

  const handleDeleteDoc = (docId: string) => {
    if (selectedColId === 'settings' || selectedColId === 'identity') {
      alert("Tabel sistem tunggal tidak boleh dihapus!");
      return;
    }
    if (window.confirm("PENTING: Apakah Anda yakin ingin menghapus data ini dari database Firestore secara permanen?")) {
      const newList = activeCol.data.filter((item: any) => item.id !== docId);
      if (activeCol.update) {
        activeCol.update(newList);
        alert("Data berhasil dihapus dari database!");
      } else {
        alert("Fungsi penghapusan tidak tersedia untuk tabel ini.");
      }
    }
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError('');
    setCrudSuccess('');

    let finalData: any;

    if (editorMode === 'json') {
      try {
        finalData = JSON.parse(docJsonText);
      } catch (err: any) {
        setCrudError(`Format JSON tidak valid: ${err.message}`);
        return;
      }
    } else {
      finalData = { ...structuredFields };
    }

    // Basic validation
    if (selectedColId !== 'settings' && selectedColId !== 'identity' && !finalData.id) {
      setCrudError("ID data wajib diisi.");
      return;
    }

    try {
      if (selectedColId === 'settings' || selectedColId === 'identity') {
        // Single document collections
        if (activeCol.update) {
          activeCol.update([finalData]);
          setCrudSuccess("Data pengaturan berhasil diperbarui!");
          setTimeout(() => setIsModalOpen(false), 1200);
        }
        return;
      }

      // List collections
      let newList = [...activeCol.data];
      if (modalMode === 'add') {
        // check duplicate id
        if (newList.some((item: any) => item.id === finalData.id)) {
          setCrudError(`ID '${finalData.id}' sudah digunakan oleh data lain.`);
          return;
        }
        newList.push(finalData);
      } else {
        newList = newList.map((item: any) => (item.id === editingDocId ? finalData : item));
      }

      if (activeCol.update) {
        activeCol.update(newList);
        setCrudSuccess(`Berhasil ${modalMode === 'add' ? 'menambahkan' : 'memperbarui'} data ke Firestore!`);
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setCrudError("Handler penyimpanan tidak ditemukan.");
      }
    } catch (error: any) {
      setCrudError(`Terjadi kesalahan: ${error.message}`);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...structuredFields, [key]: value };
    setStructuredFields(updated);
    setDocJsonText(JSON.stringify(updated, null, 2));
  };

  // Export current collection only
  const handleExportSingleCol = () => {
    try {
      const jsonString = JSON.stringify(activeCol.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `swara_${activeCol.id}_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal melakukan ekspor data tabel ini.");
    }
  };

  // Bulk Import for single table
  const handleBulkImportSingle = () => {
    try {
      const parsed = JSON.parse(bulkImportText);
      const itemsToImport = Array.isArray(parsed) ? parsed : [parsed];

      if (itemsToImport.length === 0) {
        alert("Data kosong.");
        return;
      }

      // Check format
      if (selectedColId !== 'settings' && selectedColId !== 'identity') {
        const hasId = itemsToImport.every((item: any) => item && item.id);
        if (!hasId) {
          alert("Gagal impor: Setiap baris data harus memiliki properti 'id'.");
          return;
        }
      }

      const confirmImport = window.confirm(
        `Apakah Anda yakin ingin menimpa seluruh data pada tabel '${activeCol.label}' (${activeCol.data.length} data) dengan ${itemsToImport.length} data dari file impor?`
      );

      if (!confirmImport) return;

      if (activeCol.update) {
        if (Array.isArray(activeCol.data)) {
          const existingIds = new Set(activeCol.data.map((item: any) => item?.id));
          const newItems = itemsToImport.filter((item: any) => !existingIds.has(item?.id));
          const merged = [...newItems, ...activeCol.data];
          activeCol.update(merged);
          alert(`Berhasil menambahkan ${newItems.length} data baru ke tabel '${activeCol.label}'! Total saat ini: ${merged.length} data.`);
        } else {
          activeCol.update(itemsToImport);
          alert(`Berhasil memperbarui data ${activeCol.label}!`);
        }
        setIsBulkImportOpen(false);
        setBulkImportText('');
      } else {
        alert("Handler update tidak tersedia.");
      }
    } catch (err: any) {
      alert(`Gagal mengurai JSON impor: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* DB Overview Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-slate-800 text-white rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tipe Database</span>
            <h3 className="text-sm font-bold text-slate-800">Firestore Cloud DB</h3>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status Koneksi</span>
            <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1">
              Online / Sinkron
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tabel</span>
            <h3 className="text-sm font-bold text-slate-800">8 Koleksi Utama</h3>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sesi Sinkronisasi</span>
            <h3 className="text-sm font-bold text-slate-800">Real-Time Sync</h3>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Collection Selector */}
        <div className="lg:col-span-3 space-y-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Koleksi Firestore</span>
          <div className="space-y-1">
            {collections.map((col) => {
              const IconComp = col.icon;
              const isSelected = col.id === selectedColId;
              const docCount = col.data.length;

              return (
                <button
                  key={col.id}
                  onClick={() => {
                    setSelectedColId(col.id);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-slate-800 text-white font-semibold shadow-xs' 
                      : 'hover:bg-slate-100 text-slate-600 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{col.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200/60 text-slate-500'
                  }`}>
                    {col.id === 'settings' || col.id === 'identity' ? '1 doc' : `${docCount} data`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser Grid */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Cari data pada tabel ${activeCol.label}...`}
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Extra utility buttons */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                onClick={handleExportSingleCol}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                title="Ekspor koleksi ini saja"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor JSON
              </button>

              {selectedColId !== 'settings' && selectedColId !== 'identity' && (
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                  title="Impor timpa koleksi ini"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Impor JSON
                </button>
              )}

              {selectedColId !== 'settings' && selectedColId !== 'identity' && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Data
                </button>
              )}
            </div>

          </div>

          {/* Bulk Import Dialog inside DB Explorer */}
          {isBulkImportOpen && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">Impor Massal JSON ke Tabel {activeCol.label}</span>
                <button onClick={() => setIsBulkImportOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                PENTING: Masukkan array JSON objek data yang valid. Ini akan menimpa seluruh baris data pada tabel {activeCol.label} secara permanen.
              </p>
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="[ { &quot;id&quot;: &quot;...&quot;, &quot;nama&quot;: &quot;...&quot; } ]"
                rows={5}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsBulkImportOpen(false);
                    setBulkImportText('');
                  }}
                  className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkImportSingle}
                  className="bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl hover:bg-slate-700"
                >
                  Proses Impor & Timpa
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {getColumnHeaders(selectedColId).map((header) => (
                      <th key={header.key} className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {header.label}
                      </th>
                    ))}
                    <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={getColumnHeaders(selectedColId).length + 1} className="p-8 text-center text-xs text-slate-400">
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item: any, idx) => {
                      const headers = getColumnHeaders(selectedColId);
                      const rowId = item.id || `idx-${idx}`;

                      return (
                        <tr key={rowId} className="hover:bg-slate-50/50 transition-colors">
                          {headers.map((header) => {
                            let value = item[header.key];

                            // Pretty print for specific fields
                            if (typeof value === 'boolean') {
                              value = value ? 'Ya' : 'Tidak';
                            } else if (Array.isArray(value)) {
                              value = `${value.length} item`;
                            } else if (typeof value === 'object' && value !== null) {
                              value = '{...}';
                            }

                            return (
                              <td key={header.key} className="p-3 text-xs text-slate-700 font-medium max-w-[200px] truncate">
                                {value === undefined || value === null ? '-' : String(value)}
                              </td>
                            );
                          })}
                          <td className="p-3 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit Dokumen"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              
                              {selectedColId !== 'settings' && selectedColId !== 'identity' && (
                                <button
                                  onClick={() => handleDeleteDoc(item.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Dokumen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/30">
                <span className="text-[10px] text-slate-400">
                  Menampilkan {paginatedData.length} dari {totalItems} data
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold bg-white disabled:opacity-50 text-slate-600 cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-[10px] px-2 text-slate-500 font-semibold">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold bg-white disabled:opacity-50 text-slate-600 cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Structured / JSON Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-800 text-white rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {modalMode === 'add' ? 'Tambah Data Baru' : 'Edit Data'} - {activeCol.label}
                  </h3>
                  <p className="text-[10px] text-slate-400">Pastikan integritas relasi tabel terjaga.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Tabs for Editor Mode */}
            <div className="px-5 border-b border-slate-100 bg-slate-50/50 flex gap-4">
              <button
                type="button"
                onClick={() => setEditorMode('fields')}
                className={`py-2 text-[11px] font-bold border-b-2 transition-all ${
                  editorMode === 'fields'
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Formulir Terstruktur
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('json')}
                className={`py-2 text-[11px] font-bold border-b-2 transition-all ${
                  editorMode === 'json'
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                JSON Editor Mandiri
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDoc} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {crudError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 items-start text-xs text-rose-800">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-600" />
                  <span>{crudError}</span>
                </div>
              )}

              {crudSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2 items-start text-xs text-emerald-800">
                  <Check className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{crudSuccess}</span>
                </div>
              )}

              {editorMode === 'json' ? (
                /* JSON Raw Mode */
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Raw JSON Data</label>
                  <textarea
                    value={docJsonText}
                    onChange={(e) => setDocJsonText(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                  <span className="text-[9px] text-slate-400 block">
                    Mode ini berguna untuk menambahkan/mengedit field array bersarang seperti 'objectives' pada SAKIP.
                  </span>
                </div>
              ) : (
                /* Structured Form Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(structuredFields).map((key) => {
                    const value = structuredFields[key];
                    const isReadOnly = (modalMode === 'edit' && key === 'id') || key === 'createdAt';

                    // Skip large binary / signature / child objects
                    if (key === 'foto' || key === 'ttdElektronik' || key === 'signaturePembuat' || key === 'signaturePenerima' || Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                      return (
                        <div key={key} className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-[10px] text-slate-500 uppercase block">{key} (Tipe Kompleks / Nested)</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Data tipe {Array.isArray(value) ? 'Array' : 'Objek'} tidak didukung di Form Terstruktur. Gunakan <strong>JSON Editor Mandiri</strong> di tab atas untuk mengedit field ini.
                          </span>
                        </div>
                      );
                    }

                    // Render suitable inputs based on type
                    return (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">{key}</label>
                        {typeof value === 'boolean' ? (
                          <select
                            value={value ? 'true' : 'false'}
                            onChange={(e) => handleFieldChange(key, e.target.value === 'true')}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="true">Ya (True)</option>
                            <option value="false">Tidak (False)</option>
                          </select>
                        ) : key === 'jenjangPendidikan' ? (
                          <select
                            value={value}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="SMA">SMA</option>
                            <option value="D3">D3</option>
                            <option value="S1">S1</option>
                            <option value="S2">S2</option>
                            <option value="S3">S3</option>
                          </select>
                        ) : key === 'role' ? (
                          <select
                            value={value || 'Staff'}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="Staff">Staff</option>
                            <option value="Ketua Bidang">Ketua Bidang / Katim</option>
                            <option value="Superadmin">Superadmin</option>
                          </select>
                        ) : key === 'divisi' ? (
                          <select
                            value={value}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="Tata Usaha / Umum">Tata Usaha / Umum</option>
                            <option value="Siaran">Siaran</option>
                            <option value="Pemberitaan">Pemberitaan</option>
                            <option value="Teknologi dan Media Baru">Teknologi dan Media Baru</option>
                            <option value="Konten Media Baru">Konten Media Baru</option>
                            <option value="Layanan Pengembangan Usaha">Layanan Pengembangan Usaha</option>
                          </select>
                        ) : key === 'jenisKelamin' ? (
                          <select
                            value={value}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        ) : key === 'paymentStatus' ? (
                          <select
                            value={value}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="Belum Bayar">Belum Bayar</option>
                            <option value="Selesai Sebagian">Selesai Sebagian</option>
                            <option value="Lunas">Lunas</option>
                          </select>
                        ) : key === 'cooperationType' ? (
                          <select
                            value={value}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="Iklan/Siar Layanan">Iklan/Siar Layanan</option>
                            <option value="Sewa Lahan/Menara">Sewa Lahan/Menara</option>
                            <option value="Sponsorship Acara">Sponsorship Acara</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        ) : (
                          <input
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={value === undefined || value === null ? '' : value}
                            readOnly={isReadOnly}
                            onChange={(e) => handleFieldChange(key, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
                            disabled={isReadOnly}
                            className={`w-full border rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 ${
                              isReadOnly 
                                ? 'bg-slate-100 text-slate-400 border-slate-150 cursor-not-allowed' 
                                : 'bg-slate-50/50 border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </form>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveDoc}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-xs"
              >
                <Save className="w-4 h-4" />
                Simpan ke Firestore
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
