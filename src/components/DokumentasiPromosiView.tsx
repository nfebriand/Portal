import React, { useState, useMemo } from 'react';
import { PromotionActivity, Employee } from '../types';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  Share2, 
  Sparkles, 
  Tv, 
  Radio, 
  FileText, 
  BarChart3,
  X,
  Eye,
  Building2,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { calculateTotalMediaItems } from '../utils/syncPromotionAchievements';

interface CurrentUserType {
  id?: string;
  name: string;
  role: string;
  division?: string;
  loginRole?: string;
}

interface DokumentasiPromosiViewProps {
  promotions: PromotionActivity[];
  onSavePromotion?: (promo: PromotionActivity) => void;
  onAddPromotion?: (promo: PromotionActivity) => void;
  onUpdatePromotion?: (promo: PromotionActivity) => void;
  onDeletePromotion: (id: string) => void;
  employees: Employee[];
  currentUser: CurrentUserType;
}

const ALL_DIVISIONS = [
  'Tata Usaha / Umum',
  'Siaran',
  'Pemberitaan',
  'Teknologi dan Media Baru',
  'Konten Media Baru',
  'Layanan Pengembangan Usaha'
];

const MONTH_NAMES = [
  'Semua Bulan',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DokumentasiPromosiView({
  promotions,
  onSavePromotion,
  onAddPromotion,
  onUpdatePromotion,
  onDeletePromotion,
  employees,
  currentUser
}: DokumentasiPromosiViewProps) {
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Submenu: 'rekap' | 'input'
  const [activeSubMenu, setActiveSubMenu] = useState<'rekap' | 'input'>('rekap');

  // Filters for Rekap Promosi Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Semua, 1-12
  const [selectedDivisi, setSelectedDivisi] = useState<string>('Semua');

  // Pagination for Rekap Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  // Form State for Input / Edit
  const [editingPromo, setEditingPromo] = useState<PromotionActivity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingEvidenPromo, setViewingEvidenPromo] = useState<PromotionActivity | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);

  // New Promotion Form Input State
  const [formData, setFormData] = useState({
    tanggal: todayStr,
    namaKegiatan: '',
    divisi: currentUser.division || 'Layanan Pengembangan Usaha',
    creatorId: currentUser.id || '',
    creatorName: currentUser.name || '',
    baliho: 0,
    spanduk: 0,
    videotron: 0,
    umbulUmbul: 0,
    pamflet: 0,
    yt: 0,
    ig: 0,
    tiktok: 0,
    fb: 0,
    eFlyer: 0,
    keterangan: '',
    linkDokumentasi: '',
    fotoDokumentasi: ''
  });

  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Compute Years available from promotions data
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([currentYear, currentYear - 1]);
    promotions.forEach(p => {
      if (p.tanggal) {
        const y = new Date(p.tanggal).getFullYear();
        if (!isNaN(y)) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [promotions, currentYear]);

  // Filtered Promotions for Rekap Table
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      // Year filter
      if (selectedYear) {
        const pDate = new Date(p.tanggal);
        if (!isNaN(pDate.getFullYear()) && pDate.getFullYear() !== selectedYear) {
          return false;
        }
      }

      // Month filter
      if (selectedMonth > 0) {
        const pDate = new Date(p.tanggal);
        if (!isNaN(pDate.getMonth()) && pDate.getMonth() + 1 !== selectedMonth) {
          return false;
        }
      }

      // Division filter
      if (selectedDivisi !== 'Semua' && p.divisi !== selectedDivisi) {
        return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.namaKegiatan.toLowerCase().includes(q);
        const matchKet = (p.keterangan || '').toLowerCase().includes(q);
        const matchCreator = (p.creatorName || '').toLowerCase().includes(q);
        return matchName || matchKet || matchCreator;
      }

      return true;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [promotions, selectedYear, selectedMonth, selectedDivisi, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    let totalLuarRuang = 0;
    let totalMultiplatform = 0;
    let totalBaliho = 0;
    let totalSpanduk = 0;
    let totalVideotron = 0;
    let totalUmbulUmbul = 0;
    let totalPamflet = 0;
    let totalYt = 0;
    let totalIg = 0;
    let totalTiktok = 0;
    let totalFb = 0;
    let totalEFlyer = 0;

    filteredPromotions.forEach(p => {
      const b = Number(p.baliho) || 0;
      const s = Number(p.spanduk) || 0;
      const v = Number(p.videotron) || 0;
      const u = Number(p.umbulUmbul) || 0;
      const pf = Number(p.pamflet) || 0;
      const yt = Number(p.yt) || 0;
      const ig = Number(p.ig) || 0;
      const tt = Number(p.tiktok) || 0;
      const fb = Number(p.fb) || 0;
      const ef = Number(p.eFlyer) || 0;

      totalBaliho += b;
      totalSpanduk += s;
      totalVideotron += v;
      totalUmbulUmbul += u;
      totalPamflet += pf;
      totalLuarRuang += (b + s + v + u + pf);

      totalYt += yt;
      totalIg += ig;
      totalTiktok += tt;
      totalFb += fb;
      totalEFlyer += ef;
      totalMultiplatform += (yt + ig + tt + fb + ef);
    });

    const totalMediaKeseluruhan = totalLuarRuang + totalMultiplatform;

    return {
      totalKegiatan: filteredPromotions.length,
      totalLuarRuang,
      totalMultiplatform,
      totalMediaKeseluruhan,
      totalBaliho,
      totalSpanduk,
      totalVideotron,
      totalUmbulUmbul,
      totalPamflet,
      totalYt,
      totalIg,
      totalTiktok,
      totalFb,
      totalEFlyer
    };
  }, [filteredPromotions]);

  // Paginated Promotions
  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / PAGE_SIZE));
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPromotions.slice(start, start + PAGE_SIZE);
  }, [filteredPromotions, currentPage]);

  // Handle Form Submission for New Promotion Activity
  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKegiatan.trim()) {
      alert('Mohon isi nama kegiatan promosi.');
      return;
    }

    const calculatedJumlah = calculateTotalMediaItems({
      id: '',
      tanggal: formData.tanggal,
      namaKegiatan: formData.namaKegiatan,
      baliho: Number(formData.baliho) || 0,
      spanduk: Number(formData.spanduk) || 0,
      videotron: Number(formData.videotron) || 0,
      umbulUmbul: Number(formData.umbulUmbul) || 0,
      pamflet: Number(formData.pamflet) || 0,
      yt: Number(formData.yt) || 0,
      ig: Number(formData.ig) || 0,
      tiktok: Number(formData.tiktok) || 0,
      fb: Number(formData.fb) || 0,
      eFlyer: Number(formData.eFlyer) || 0
    });

    const newActivity: PromotionActivity = {
      id: `promo-${Date.now()}`,
      tanggal: formData.tanggal,
      namaKegiatan: formData.namaKegiatan.trim(),
      divisi: formData.divisi,
      creatorId: formData.creatorId || currentUser.id,
      creatorName: formData.creatorName || currentUser.name,
      baliho: Number(formData.baliho) || 0,
      spanduk: Number(formData.spanduk) || 0,
      videotron: Number(formData.videotron) || 0,
      umbulUmbul: Number(formData.umbulUmbul) || 0,
      pamflet: Number(formData.pamflet) || 0,
      yt: Number(formData.yt) || 0,
      ig: Number(formData.ig) || 0,
      tiktok: Number(formData.tiktok) || 0,
      fb: Number(formData.fb) || 0,
      eFlyer: Number(formData.eFlyer) || 0,
      jumlah: calculatedJumlah,
      keterangan: formData.keterangan.trim(),
      linkDokumentasi: formData.linkDokumentasi.trim(),
      fotoDokumentasi: formData.fotoDokumentasi.trim(),
      createdAt: new Date().toISOString()
    };

    if (onSavePromotion) {
      onSavePromotion(newActivity);
    } else if (onAddPromotion) {
      onAddPromotion(newActivity);
    }
    setFormSuccessMessage(`Kegiatan promosi "${newActivity.namaKegiatan}" berhasil disimpan! Data capaian bulanan telah otomatis terupdate.`);
    
    // Reset form
    setFormData({
      tanggal: todayStr,
      namaKegiatan: '',
      divisi: currentUser.division || 'Layanan Pengembangan Usaha',
      creatorId: currentUser.id || '',
      creatorName: currentUser.name || '',
      baliho: 0,
      spanduk: 0,
      videotron: 0,
      umbulUmbul: 0,
      pamflet: 0,
      yt: 0,
      ig: 0,
      tiktok: 0,
      fb: 0,
      eFlyer: 0,
      keterangan: '',
      linkDokumentasi: '',
      fotoDokumentasi: ''
    });

    setTimeout(() => {
      setFormSuccessMessage(null);
      setActiveSubMenu('rekap');
    }, 1800);
  };

  // Handle Edit Submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    const calculatedJumlah = calculateTotalMediaItems(editingPromo);
    const updated = {
      ...editingPromo,
      jumlah: calculatedJumlah
    };

    if (onSavePromotion) {
      onSavePromotion(updated);
    } else if (onUpdatePromotion) {
      onUpdatePromotion(updated);
    }
    setIsEditModalOpen(false);
    setEditingPromo(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No', 'Tanggal', 'Nama Kegiatan', 'Divisi Pelaksana', 'PIC Pegawai',
      'Baliho', 'Spanduk', 'Videotron', 'Umbul-Umbul', 'Pamflet', 'Subtotal Luar Ruang',
      'YouTube', 'Instagram', 'TikTok', 'Facebook', 'e-Flyer', 'Subtotal Multiplatform',
      'Total Jumlah Media', 'Keterangan', 'Link Eviden'
    ];

    const rows = filteredPromotions.map((p, idx) => {
      const luarRuang = (Number(p.baliho) || 0) + (Number(p.spanduk) || 0) + (Number(p.videotron) || 0) + (Number(p.umbulUmbul) || 0) + (Number(p.pamflet) || 0);
      const multi = (Number(p.yt) || 0) + (Number(p.ig) || 0) + (Number(p.tiktok) || 0) + (Number(p.fb) || 0) + (Number(p.eFlyer) || 0);
      const total = luarRuang + multi;

      return [
        idx + 1,
        `"${p.tanggal}"`,
        `"${p.namaKegiatan.replace(/"/g, '""')}"`,
        `"${p.divisi || '-'}"`,
        `"${p.creatorName || '-'}"`,
        p.baliho || 0,
        p.spanduk || 0,
        p.videotron || 0,
        p.umbulUmbul || 0,
        p.pamflet || 0,
        luarRuang,
        p.yt || 0,
        p.ig || 0,
        p.tiktok || 0,
        p.fb || 0,
        p.eFlyer || 0,
        multi,
        total,
        `"${(p.keterangan || '').replace(/"/g, '""')}"`,
        `"${p.linkDokumentasi || '-'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_dokumentasi_promosi_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Dokumentasi & Publikasi Promosi</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Manajemen & Rekapitulasi Dokumentasi Promosi
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Pencatatan penyebaran media luar ruang dan multiplatform. Terintegrasi secara otomatis sebagai capaian kinerja bulanan <strong>"Jumlah Kegiatan Promosi"</strong> berjenjang hingga level Kepala Stasiun.
          </p>
        </div>

        {/* Submenu Navigation Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => setActiveSubMenu('rekap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubMenu === 'rekap'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Rekap Promosi</span>
            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px]">
              {promotions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubMenu('input')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubMenu === 'input'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Input Kegiatan Promosi</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: REKAP PROMOSI (MERGED CELL TABLE) */}
      {activeSubMenu === 'rekap' && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Kegiatan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kegiatan Promosi</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.totalKegiatan}</h3>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Terekam di sistem</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>

            {/* Total Media Luar Ruang */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Media Luar Ruang</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1 font-mono">{stats.totalLuarRuang}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Baliho, Spanduk, Videotron, dll
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Tv className="w-5 h-5" />
              </div>
            </div>

            {/* Total Media Multiplatform */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Media Multiplatform</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1 font-mono">{stats.totalMultiplatform}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  YT, IG, TikTok, FB, e-Flyer
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Share2 className="w-5 h-5" />
              </div>
            </div>

            {/* Total Akumulasi Item Media */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Media Terpasang</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.totalMediaKeseluruhan}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Unit / Spot Promosi
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Filter Bar & Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              
              {/* Search Bar */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kegiatan, PIC, keterangan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Filter Tahun */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:bg-white focus:outline-hidden"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>Tahun {y}</option>
                ))}
              </select>

              {/* Filter Bulan */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              {/* Filter Divisi */}
              <select
                value={selectedDivisi}
                onChange={(e) => {
                  setSelectedDivisi(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="Semua">Semua Unit Kerja</option>
                {ALL_DIVISIONS.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>

            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Download Data CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setActiveSubMenu('input')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kegiatan</span>
              </button>
            </div>
          </div>

          {/* MAIN REKAPITULASI TABLE (MERGE CELLS) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* HEADER ROW 1: MERGED CELLS */}
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                    <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 w-10">No</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 min-w-[95px]">Tanggal</th>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 min-w-[200px]">Nama Kegiatan Promosi</th>
                    <th colSpan={5} className="px-3 py-2 text-center bg-amber-50/80 text-amber-900 border-r border-slate-200">
                      Media Luar Ruang
                    </th>
                    <th colSpan={5} className="px-3 py-2 text-center bg-indigo-50/80 text-indigo-900 border-r border-slate-200">
                      Media Multiplatform
                    </th>
                    <th rowSpan={2} className="px-3 py-3 text-center bg-slate-50 font-black text-slate-900 border-r border-slate-200 min-w-[70px]">
                      Jumlah
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 min-w-[120px]">Unit Kerja</th>
                    <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 min-w-[80px]">Eviden</th>
                    <th rowSpan={2} className="px-3 py-3 text-right min-w-[80px]">Aksi</th>
                  </tr>

                  {/* HEADER ROW 2: SUB-COLUMNS */}
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    {/* Media Luar Ruang Subheaders */}
                    <th className="px-2 py-2 text-center bg-amber-50/40 border-r border-slate-200">Baliho</th>
                    <th className="px-2 py-2 text-center bg-amber-50/40 border-r border-slate-200">Spanduk</th>
                    <th className="px-2 py-2 text-center bg-amber-50/40 border-r border-slate-200">Videotron</th>
                    <th className="px-2 py-2 text-center bg-amber-50/40 border-r border-slate-200">Umbul²</th>
                    <th className="px-2 py-2 text-center bg-amber-50/40 border-r border-slate-200">Pamflet</th>

                    {/* Media Multiplatform Subheaders */}
                    <th className="px-2 py-2 text-center bg-indigo-50/40 border-r border-slate-200">YT</th>
                    <th className="px-2 py-2 text-center bg-indigo-50/40 border-r border-slate-200">IG</th>
                    <th className="px-2 py-2 text-center bg-indigo-50/40 border-r border-slate-200">TikTok</th>
                    <th className="px-2 py-2 text-center bg-indigo-50/40 border-r border-slate-200">FB</th>
                    <th className="px-2 py-2 text-center bg-indigo-50/40 border-r border-slate-200">e-Flyer</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {paginatedPromotions.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="text-center py-12 text-slate-400 italic">
                        Belum ada kegiatan promosi yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    paginatedPromotions.map((p, idx) => {
                      const itemTotal = calculateTotalMediaItems(p);
                      const displayIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* No */}
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-500 border-r border-slate-100">
                            {displayIdx}
                          </td>

                          {/* Tanggal */}
                          <td className="px-3 py-3 font-mono font-medium text-slate-700 border-r border-slate-100 whitespace-nowrap">
                            {p.tanggal}
                          </td>

                          {/* Nama Kegiatan */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div>
                              <p className="font-bold text-slate-900">{p.namaKegiatan}</p>
                              {p.keterangan && (
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.keterangan}</p>
                              )}
                            </div>
                          </td>

                          {/* Media Luar Ruang: Baliho, Spanduk, Videotron, Umbul Umbul, Pamflet */}
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.baliho > 0 ? 'font-bold text-amber-700' : 'text-slate-300'}>
                              {p.baliho || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.spanduk > 0 ? 'font-bold text-amber-700' : 'text-slate-300'}>
                              {p.spanduk || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.videotron > 0 ? 'font-bold text-amber-700' : 'text-slate-300'}>
                              {p.videotron || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.umbulUmbul > 0 ? 'font-bold text-amber-700' : 'text-slate-300'}>
                              {p.umbulUmbul || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.pamflet > 0 ? 'font-bold text-amber-700' : 'text-slate-300'}>
                              {p.pamflet || '-'}
                            </span>
                          </td>

                          {/* Media Multiplatform: YT, IG, TikTok, FB, e-Flyer */}
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.yt > 0 ? 'font-bold text-indigo-700' : 'text-slate-300'}>
                              {p.yt || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.ig > 0 ? 'font-bold text-indigo-700' : 'text-slate-300'}>
                              {p.ig || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.tiktok > 0 ? 'font-bold text-indigo-700' : 'text-slate-300'}>
                              {p.tiktok || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.fb > 0 ? 'font-bold text-indigo-700' : 'text-slate-300'}>
                              {p.fb || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 font-mono">
                            <span className={p.eFlyer > 0 ? 'font-bold text-indigo-700' : 'text-slate-300'}>
                              {p.eFlyer || '-'}
                            </span>
                          </td>

                          {/* Total Jumlah Media (Merged Calculation) */}
                          <td className="px-3 py-3 text-center border-r border-slate-100 bg-slate-50/70 font-mono">
                            <span className="font-black text-slate-900 text-xs px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                              {itemTotal}
                            </span>
                          </td>

                          {/* Unit Kerja & PIC */}
                          <td className="px-3 py-3 border-r border-slate-100">
                            <div>
                              <p className="font-semibold text-slate-800 text-[10px]">{p.divisi || 'LPU'}</p>
                              {p.creatorName && (
                                <p className="text-[9px] text-slate-400 font-mono">PIC: {p.creatorName}</p>
                              )}
                            </div>
                          </td>

                          {/* Eviden Link / Foto */}
                          <td className="px-3 py-3 text-center border-r border-slate-100">
                            <div className="flex items-center justify-center gap-1">
                              {p.linkDokumentasi ? (
                                <a
                                  href={p.linkDokumentasi}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                  title="Buka Link Eviden"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : null}
                              {p.fotoDokumentasi ? (
                                <button
                                  onClick={() => setViewingEvidenPromo(p)}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="Lihat Foto Dokumentasi"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              {!p.linkDokumentasi && !p.fotoDokumentasi && (
                                <span className="text-[10px] text-slate-300">-</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingPromo(p);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                title="Edit Data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeletingPromoId(p.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* TABLE FOOTER: TOTAL SUM ROW */}
                {filteredPromotions.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-800 text-[10px]">
                      <td colSpan={3} className="px-4 py-3 text-right border-r border-slate-200 uppercase tracking-wider font-bold">
                        TOTAL AKUMULASI ({filteredPromotions.length} KEGIATAN):
                      </td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-amber-800 bg-amber-50/50">{stats.totalBaliho}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-amber-800 bg-amber-50/50">{stats.totalSpanduk}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-amber-800 bg-amber-50/50">{stats.totalVideotron}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-amber-800 bg-amber-50/50">{stats.totalUmbulUmbul}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-amber-800 bg-amber-50/50">{stats.totalPamflet}</td>

                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-indigo-800 bg-indigo-50/50">{stats.totalYt}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-indigo-800 bg-indigo-50/50">{stats.totalIg}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-indigo-800 bg-indigo-50/50">{stats.totalTiktok}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-indigo-800 bg-indigo-50/50">{stats.totalFb}</td>
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-indigo-800 bg-indigo-50/50">{stats.totalEFlyer}</td>

                      <td className="px-3 py-3 text-center border-r border-slate-200 font-mono font-black text-slate-900 bg-indigo-100/60 text-xs">
                        {stats.totalMediaKeseluruhan}
                      </td>
                      <td colSpan={3} className="px-3 py-3 text-center text-slate-500 font-mono text-[9px]">
                        Luar Ruang: {stats.totalLuarRuang} | Multiplatform: {stats.totalMultiplatform}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 text-xs">
                <p className="text-slate-500 text-[11px]">
                  Menampilkan {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, filteredPromotions.length)} dari {filteredPromotions.length} kegiatan
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1 font-mono font-bold text-slate-700 bg-slate-100 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: INPUT KEGIATAN PROMOSI */}
      {activeSubMenu === 'input' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Success Banner */}
          {formSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Form Input Dokumentasi Kegiatan Promosi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan detail kegiatan promosi dan jumlah sebaran media. Total kegiatan akan otomatis terhitung per bulan untuk indikator PK.
              </p>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-6">
              
              {/* SECTION 1: INFORMASI DASAR */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  1. Informasi Kegiatan
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Tanggal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Unit Kerja / Bidang */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit Kerja / Bidang Pelaksana <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.divisi}
                      onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {ALL_DIVISIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nama Kegiatan */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Kegiatan Promosi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sosialisasi Aplikasi RRI Digital & Festival Suara Merdeka 2026"
                      value={formData.namaKegiatan}
                      onChange={(e) => setFormData({ ...formData, namaKegiatan: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>

                  {/* PIC Pegawai */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIC / Pegawai Pelaksana
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Pegawai / Penanggung Jawab"
                      value={formData.creatorName}
                      onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 2: MEDIA LUAR RUANG */}
              <div className="space-y-3 p-5 bg-amber-50/50 border border-amber-200/70 rounded-2xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-amber-600" />
                    2. Media Luar Ruang (Outdoor)
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Subtotal: {(Number(formData.baliho) || 0) + (Number(formData.spanduk) || 0) + (Number(formData.videotron) || 0) + (Number(formData.umbulUmbul) || 0) + (Number(formData.pamflet) || 0)} Item
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  
                  {/* Baliho */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Baliho</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.baliho}
                      onChange={(e) => setFormData({ ...formData, baliho: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* Spanduk */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Spanduk</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.spanduk}
                      onChange={(e) => setFormData({ ...formData, spanduk: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* Videotron */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Videotron</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.videotron}
                      onChange={(e) => setFormData({ ...formData, videotron: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* Umbul-Umbul */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Umbul-Umbul</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.umbulUmbul}
                      onChange={(e) => setFormData({ ...formData, umbulUmbul: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* Pamflet */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Pamflet</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.pamflet}
                      onChange={(e) => setFormData({ ...formData, pamflet: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 3: MEDIA MULTIPLATFORM */}
              <div className="space-y-3 p-5 bg-indigo-50/50 border border-indigo-200/70 rounded-2xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    3. Media Multiplatform (Digital & Social)
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                    Subtotal: {(Number(formData.yt) || 0) + (Number(formData.ig) || 0) + (Number(formData.tiktok) || 0) + (Number(formData.fb) || 0) + (Number(formData.eFlyer) || 0)} Item
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  
                  {/* YouTube */}
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">YouTube (YT)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.yt}
                      onChange={(e) => setFormData({ ...formData, yt: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">Instagram (IG)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.ig}
                      onChange={(e) => setFormData({ ...formData, ig: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">TikTok</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.tiktok}
                      onChange={(e) => setFormData({ ...formData, tiktok: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">Facebook (FB)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.fb}
                      onChange={(e) => setFormData({ ...formData, fb: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                  {/* e-Flyer */}
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">e-Flyer</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.eFlyer}
                      onChange={(e) => setFormData({ ...formData, eFlyer: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 4: EVIDEN & KETERANGAN */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  4. Eviden & Dokumentasi
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Link Dokumentasi Google Drive */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link URL Eviden / Google Drive / Postingan
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... atau https://instagram.com/..."
                      value={formData.linkDokumentasi}
                      onChange={(e) => setFormData({ ...formData, linkDokumentasi: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* URL / Base64 Foto Dokumentasi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Foto Dokumentasi (URL Gambar)
                    </label>
                    <input
                      type="text"
                      placeholder="https://... URL Foto Dokumentasi"
                      value={formData.fotoDokumentasi}
                      onChange={(e) => setFormData({ ...formData, fotoDokumentasi: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Keterangan Tambahan */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan / Lokasi Pemasangan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Catatan lokasi pemasangan baliho, jadwal penayangan videotron, link postingan medsos, dll."
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Total Media Terhitung: <strong>{calculateTotalMediaItems({
                      id: '',
                      tanggal: formData.tanggal,
                      namaKegiatan: formData.namaKegiatan,
                      baliho: Number(formData.baliho) || 0,
                      spanduk: Number(formData.spanduk) || 0,
                      videotron: Number(formData.videotron) || 0,
                      umbulUmbul: Number(formData.umbulUmbul) || 0,
                      pamflet: Number(formData.pamflet) || 0,
                      yt: Number(formData.yt) || 0,
                      ig: Number(formData.ig) || 0,
                      tiktok: Number(formData.tiktok) || 0,
                      fb: Number(formData.fb) || 0,
                      eFlyer: Number(formData.eFlyer) || 0
                    })} Item</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveSubMenu('rekap')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Kegiatan Promosi</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* MODAL: EDIT PROMOTION ACTIVITY */}
      {isEditModalOpen && editingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Edit Kegiatan Promosi
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPromo(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={editingPromo.tanggal}
                    onChange={(e) => setEditingPromo({ ...editingPromo, tanggal: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja / Bidang</label>
                  <select
                    value={editingPromo.divisi || 'LPU'}
                    onChange={(e) => setEditingPromo({ ...editingPromo, divisi: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    {ALL_DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan Promosi</label>
                  <input
                    type="text"
                    required
                    value={editingPromo.namaKegiatan}
                    onChange={(e) => setEditingPromo({ ...editingPromo, namaKegiatan: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Media Luar Ruang inputs */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">Media Luar Ruang</p>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] text-amber-900">Baliho</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.baliho}
                      onChange={(e) => setEditingPromo({ ...editingPromo, baliho: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-900">Spanduk</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.spanduk}
                      onChange={(e) => setEditingPromo({ ...editingPromo, spanduk: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-900">Videotron</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.videotron}
                      onChange={(e) => setEditingPromo({ ...editingPromo, videotron: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-900">Umbul²</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.umbulUmbul}
                      onChange={(e) => setEditingPromo({ ...editingPromo, umbulUmbul: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-900">Pamflet</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.pamflet}
                      onChange={(e) => setEditingPromo({ ...editingPromo, pamflet: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Media Multiplatform inputs */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900">Media Multiplatform</p>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] text-indigo-900">YT</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.yt}
                      onChange={(e) => setEditingPromo({ ...editingPromo, yt: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-indigo-900">IG</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.ig}
                      onChange={(e) => setEditingPromo({ ...editingPromo, ig: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-indigo-900">TikTok</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.tiktok}
                      onChange={(e) => setEditingPromo({ ...editingPromo, tiktok: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-indigo-900">FB</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.fb}
                      onChange={(e) => setEditingPromo({ ...editingPromo, fb: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-indigo-900">e-Flyer</label>
                    <input
                      type="number"
                      min="0"
                      value={editingPromo.eFlyer}
                      onChange={(e) => setEditingPromo({ ...editingPromo, eFlyer: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Link & Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link URL Eviden / Google Drive</label>
                <input
                  type="url"
                  value={editingPromo.linkDokumentasi || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, linkDokumentasi: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  value={editingPromo.keterangan || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, keterangan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW EVIDEN PHOTO */}
      {viewingEvidenPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black text-slate-900">{viewingEvidenPromo.namaKegiatan}</h4>
                <p className="text-[10px] text-slate-400 font-mono">{viewingEvidenPromo.tanggal}</p>
              </div>
              <button
                onClick={() => setViewingEvidenPromo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingEvidenPromo.fotoDokumentasi ? (
              <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 max-h-80 flex items-center justify-center">
                <img
                  src={viewingEvidenPromo.fotoDokumentasi}
                  alt={viewingEvidenPromo.namaKegiatan}
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Tidak ada foto dokumentasi.
              </div>
            )}

            {viewingEvidenPromo.linkDokumentasi && (
              <a
                href={viewingEvidenPromo.linkDokumentasi}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Link Eviden Lengkap (Google Drive)</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingPromoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Hapus Kegiatan Promosi?</h4>
              <p className="text-xs text-slate-500 mt-1">Data kegiatan promosi ini akan dihapus permanen dari rekapitulasi.</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeletingPromoId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeletePromotion(deletingPromoId);
                  setDeletingPromoId(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 shadow-md shadow-rose-600/30"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
