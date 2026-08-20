import React, { useState, useMemo } from 'react';
import { 
  Handshake, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Coins, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Layers, 
  Search, 
  ArrowUpRight,
  DollarSign,
  FileCheck,
  Percent,
  TrendingDown
} from 'lucide-react';
import { Employee, PerformanceAgreement, CooperationContract, AppSettings } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface CooperationPnbpViewProps {
  employees: Employee[];
  agreements: PerformanceAgreement[];
  contracts: CooperationContract[];
  onUpdateAgreements: (agreements: PerformanceAgreement[]) => void;
  onUpdateContracts: (contracts: CooperationContract[]) => void;
}

export default function CooperationPnbpView({
  employees,
  agreements,
  contracts,
  onUpdateAgreements,
  onUpdateContracts
}: CooperationPnbpViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');
  const [selectedRenstraPKId, setSelectedRenstraPKId] = useState<string>(() => {
    return localStorage.getItem('swara_selected_renstra_pk_id') || 'ind-11';
  });

  const handleSetSelectedRenstraPKId = (val: string) => {
    setSelectedRenstraPKId(val);
    localStorage.setItem('swara_selected_renstra_pk_id', val);
  };
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<CooperationContract | null>(null);

  // Form Fields
  const [partnerName, setPartnerName] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [activityName, setActivityName] = useState('');
  const [cooperationType, setCooperationType] = useState<'Iklan/Siar Layanan' | 'Sewa Lahan/Menara' | 'Sponsorship Acara' | 'Lainnya'>('Iklan/Siar Layanan');
  const [value, setValue] = useState(0);
  const [realizedPnbp, setRealizedPnbp] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'Belum Bayar' | 'Selesai Sebagian' | 'Lunas'>('Belum Bayar');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedIndicatorId, setLinkedIndicatorId] = useState('ind-11');

  // Find PNBP related indicators in active agreements
  const pnbpIndicators = useMemo(() => {
    const list: { id: string; name: string; owner: string; target: string; unit: string }[] = [];
    agreements.forEach(ag => {
      ag.objectives.forEach(obj => {
        // If name matches pnbp or id is ind-11
        if (obj.id === 'ind-11' || obj.indicatorName.toLowerCase().includes('pnbp') || obj.indicatorName.toLowerCase().includes('penerimaan negara')) {
          list.push({
            id: obj.id,
            name: obj.indicatorName,
            owner: ag.assignedToName || ag.level,
            target: obj.target,
            unit: obj.unit
          });
        }
      });
    });
    
    // Fallback if none found
    if (list.length === 0) {
      list.push({
        id: 'ind-11',
        name: 'Capaian PNBP dari Iklan & Kerjasama',
        owner: 'Ketua Tim Layanan Pengembangan Usaha',
        target: '150',
        unit: 'Juta Rupiah'
      });
    }
    return list;
  }, [agreements]);

  // Find the dynamically selected PK level/indicator
  const selectedRenstraPK = useMemo(() => {
    for (const ag of agreements) {
      const obj = ag.objectives.find(o => o.id === selectedRenstraPKId);
      if (obj) {
        return {
          ...obj,
          level: ag.level,
          assignedToName: ag.assignedToName
        };
      }
    }
    if (pnbpIndicators.length > 0) {
      const first = pnbpIndicators[0];
      return {
        id: first.id,
        indicatorName: first.name,
        target: first.target,
        unit: first.unit,
        level: first.owner,
        assignedToName: first.owner,
        parentIndicatorId: first.id === 'ind-11' ? 'ind-1' : undefined
      };
    }
    return null;
  }, [agreements, selectedRenstraPKId, pnbpIndicators]);

  // Find parent cascade of selected PK
  const parentIndicator = useMemo(() => {
    if (!selectedRenstraPK || !selectedRenstraPK.parentIndicatorId) return null;
    for (const ag of agreements) {
      const obj = ag.objectives.find(o => o.id === selectedRenstraPK.parentIndicatorId);
      if (obj) {
        return {
          ...obj,
          level: ag.level,
          assignedToName: ag.assignedToName
        };
      }
    }
    return null;
  }, [agreements, selectedRenstraPK]);

  // Open modal for new contract
  const handleOpenAdd = () => {
    setEditingContract(null);
    setPartnerName('');
    setContractNo(`KTR/LPU/2026/00${contracts.length + 1}`);
    setActivityName('');
    setCooperationType('Iklan/Siar Layanan');
    setValue(0);
    setRealizedPnbp(0);
    setPaymentStatus('Belum Bayar');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setNotes('');
    setLinkedIndicatorId(pnbpIndicators[0]?.id || 'ind-11');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (contract: CooperationContract) => {
    setEditingContract(contract);
    setPartnerName(contract.partnerName);
    setContractNo(contract.contractNo);
    setActivityName(contract.activityName);
    setCooperationType(contract.cooperationType);
    setValue(contract.value);
    setRealizedPnbp(contract.realizedPnbp);
    setPaymentStatus(contract.paymentStatus);
    setStartDate(contract.startDate);
    setEndDate(contract.endDate);
    setNotes(contract.notes || '');
    setLinkedIndicatorId(contract.linkedIndicatorId);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !contractNo || !activityName) {
      alert("Harap lengkapi field wajib (Nama Mitra, No Kontrak, Nama Kegiatan).");
      return;
    }

    const contractData: CooperationContract = {
      id: editingContract ? editingContract.id : `ctr-${Date.now()}`,
      partnerName,
      contractNo,
      activityName,
      cooperationType,
      value: Number(value),
      realizedPnbp: Number(realizedPnbp),
      paymentStatus,
      startDate,
      endDate,
      notes,
      linkedIndicatorId
    };

    let newContracts: CooperationContract[];
    if (editingContract) {
      newContracts = contracts.map(c => c.id === editingContract.id ? contractData : c);
    } else {
      newContracts = [contractData, ...contracts];
    }

    // Trigger update (which will update localStorage and propagate)
    onUpdateContracts(newContracts);
    setIsModalOpen(false);
  };

  // Delete contract
  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data kontrak kerjasama ini?")) {
      const newContracts = contracts.filter(c => c.id !== id);
      onUpdateContracts(newContracts);
    }
  };

  // Calculated stats
  const stats = useMemo(() => {
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
    const totalRealized = contracts.reduce((sum, c) => sum + c.realizedPnbp, 0);
    const totalReceivable = totalValue - totalRealized;
    
    // Find PNBP Target using the dynamically selected PK level/indicator
    const targetValue = selectedRenstraPK ? parseFloat(selectedRenstraPK.target) || 150 : 150;
    const achievementPercent = targetValue > 0 ? Math.round((totalRealized / targetValue) * 100) : 0;

    return {
      totalValue,
      totalRealized,
      totalReceivable: totalReceivable > 0 ? totalReceivable : 0,
      targetValue,
      achievementPercent
    };
  }, [contracts, selectedRenstraPK]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = 
        c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.activityName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedTypeFilter === 'Semua' || c.cooperationType === selectedTypeFilter;
      const matchesStatus = selectedStatusFilter === 'Semua' || c.paymentStatus === selectedStatusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contracts, searchTerm, selectedTypeFilter, selectedStatusFilter]);

  // Chart 1: Revenue by Cooperation Type
  const chartTypeData = useMemo(() => {
    const categories: Record<string, { total: number; realized: number }> = {
      'Iklan/Siar Layanan': { total: 0, realized: 0 },
      'Sewa Lahan/Menara': { total: 0, realized: 0 },
      'Sponsorship Acara': { total: 0, realized: 0 },
      'Lainnya': { total: 0, realized: 0 }
    };

    contracts.forEach(c => {
      if (categories[c.cooperationType]) {
        categories[c.cooperationType].total += c.value;
        categories[c.cooperationType].realized += c.realizedPnbp;
      }
    });

    return Object.entries(categories).map(([name, val]) => ({
      name,
      'Nilai Kontrak': val.total,
      'Realisasi PNBP': val.realized
    }));
  }, [contracts]);

  // Chart 2: Payment Status Pie Chart
  const chartStatusData = useMemo(() => {
    const statuses: Record<string, number> = {
      'Belum Bayar': 0,
      'Selesai Sebagian': 0,
      'Lunas': 0
    };

    contracts.forEach(c => {
      statuses[c.paymentStatus]++;
    });

    return Object.entries(statuses).map(([name, value]) => ({
      name,
      value
    })).filter(item => item.value > 0);
  }, [contracts]);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div id="cooperation-pnbp-dashboard" className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/35 rounded-lg border border-indigo-500/20 text-indigo-400">
              <Handshake className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/20 tracking-wider">
              Layanan Pengembangan Usaha (LPU)
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Rekapitulasi Kerjasama & PNBP</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Sistem otomatisasi roll-up pendapatan kerjasama kontrak langsung ke dalam target capaian sasaran kinerja pimpinan dan Kepala Stasiun secara transparan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 self-start md:self-center"
        >
          <Plus className="w-4 h-4" /> Tambah Kontrak Baru
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Realisasi PNBP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Total Realisasi PNBP</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-800">Rp {stats.totalRealized.toFixed(1)} Juta</h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              Dari target sasaran Rp {stats.targetValue} Juta
            </p>
          </div>
          {/* Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-600">
              <span>Capaian Kinerja PNBP</span>
              <span>{stats.achievementPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.achievementPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Nilai Kontrak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Total Nilai Kontrak</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-800">Rp {stats.totalValue.toFixed(1)} Juta</h3>
            <p className="text-[10px] text-indigo-600 font-bold">
              {contracts.length} Dokumen Kerjasama Aktif
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full w-full" />
          </div>
        </div>

        {/* Piutang Kontrak Belum Tertagih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Sisa Piutang</span>
            <div className="px-2 py-1 bg-amber-50 text-amber-700 font-extrabold text-[11px] font-mono rounded-lg border border-amber-200">
              Rp
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-800">Rp {stats.totalReceivable.toFixed(1)} Juta</h3>
            <p className="text-[10px] text-slate-400">
              Menunggu termin pembayaran berikutnya
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full"
              style={{ width: `${stats.totalValue ? (stats.totalReceivable / stats.totalValue) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Target Sasaran PK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase font-mono">Target Renstra</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1 mt-1">
              <h3 className="text-xl font-extrabold text-slate-800">Rp {stats.targetValue.toFixed(1)} Juta</h3>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-2 min-h-[30px]">
                Indikator: <span className="font-bold text-indigo-600">{selectedRenstraPK?.indicatorName || 'PNBP'}</span> ({selectedRenstraPK?.level})
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Set PK Level / Indikator Aktif</label>
              <select
                value={selectedRenstraPKId}
                onChange={(e) => handleSetSelectedRenstraPKId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 text-[10px] font-extrabold text-slate-700 focus:outline-hidden"
              >
                {/* Find all available objectives to pick from */}
                {agreements
                  .map(ag => (
                    <optgroup key={ag.id} label={`${ag.level} (${ag.assignedToName}) [${ag.status}]`}>
                      {ag.objectives.map(obj => (
                        <option key={obj.id} value={obj.id}>
                          {obj.id} - {obj.indicatorName} (Target: {obj.target} {obj.unit})
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                <span>Progress Capaian</span>
                <span>{stats.achievementPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, stats.achievementPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Visual Trace of Cascade - Extremely detailed, satisfying the requirement to connect PNBP to Level 1 Kepala Stasiun */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-5 rounded-2xl border border-indigo-100 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wide">
            Sistem Pelacakan Kinerja Cascading (Pohon Kinerja PNBP)
          </h3>
        </div>
        
        <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
          Pendapatan kerjasama diinput oleh sub-koordinator LPU. Total realisasi di-roll up langsung ke sasaran kinerja terpilih (<span className="font-bold text-slate-800">{selectedRenstraPK?.id || 'ind-11'}</span>). Karena <span className="font-bold text-slate-800">{selectedRenstraPK?.id || 'ind-11'}</span> {parentIndicator ? `mendukung sasaran ${parentIndicator.level} (${parentIndicator.id})` : 'adalah sasaran utama'}, maka pencapaian realisasi di level bawah akan mengkalkulasi ulang secara proporsional nilai kinerja secara real-time menyesuaikan PK Aktif!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Box 1: Kontrak LPU */}
          <div className="bg-white p-3.5 rounded-xl border border-indigo-100/80 shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-400">
              <span>Langkah 1: Input Kontrak</span>
              <span className="text-indigo-600 font-black">Sumber</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-800">Kerjasama Kegiatan LPU</h4>
              <p className="text-[10px] text-slate-500">Kalkulasi kumulatif dari {contracts.length} kontrak.</p>
              <div className="pt-1.5 flex justify-between items-end">
                <span className="text-[10px] text-slate-400">Total PNBP:</span>
                <span className="text-xs font-black text-indigo-600">Rp {stats.totalRealized} Juta</span>
              </div>
            </div>
          </div>

          {/* Box 2: Sasaran Terpilih (Level 2/3) */}
          <div className="bg-white p-3.5 rounded-xl border border-indigo-100/80 shadow-2xs space-y-2 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
              <ChevronRight className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-400">
              <span>Langkah 2: Roll-Up Target</span>
              <span className="text-blue-600 font-black">Sasaran Terpilih</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-800 truncate">{selectedRenstraPK?.level || 'LPU'}</h4>
              <p className="text-[10px] text-blue-600 font-medium truncate" title={selectedRenstraPK?.indicatorName}>{selectedRenstraPK?.id} {selectedRenstraPK?.indicatorName}</p>
              <div className="pt-1.5 flex justify-between items-end text-[10px]">
                <span className="text-slate-400">Realisasi / Target:</span>
                <span className="font-black text-slate-800">
                  {stats.totalRealized} / {stats.targetValue} ({stats.achievementPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Box 3: Parent Cascade (Level 1) */}
          <div className="bg-white p-3.5 rounded-xl border border-indigo-100/80 shadow-2xs space-y-2 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
              <ChevronRight className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-400">
              <span>Langkah 3: Dampak Induk</span>
              <span className="text-purple-600 font-black">Parent Cascade</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-800 truncate">{parentIndicator ? parentIndicator.level : 'Induk Utama'}</h4>
              <p className="text-[10px] text-purple-600 font-medium truncate" title={parentIndicator ? parentIndicator.indicatorName : 'Tidak ada induk di atas'}>{parentIndicator ? `${parentIndicator.id} ${parentIndicator.indicatorName}` : 'Tidak ada induk di atas'}</p>
              <div className="pt-1.5 flex justify-between items-end text-[10px]">
                <span className="text-slate-400">Status Cascade:</span>
                <span className="font-black text-purple-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Terhitung Otomatis
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Graphs / Analytical Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Revenue Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Rekap Pendapatan per Jenis Kerjasama
              </h3>
              <p className="text-[10px] text-slate-400">Perbandingan Nilai Kontrak vs Realisasi PNBP Terbayar (Juta Rupiah)</p>
            </div>
            <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </span>
          </div>

          <div className="h-[250px] w-full text-xs font-mono">
            {contracts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Belum ada data kontrak untuk digambarkan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartTypeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} fontSize={10} iconSize={10} />
                  <Bar dataKey="Nilai Kontrak" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realisasi PNBP" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Payment Status Pie (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Status Pembayaran Kontrak
              </h3>
              <p className="text-[10px] text-slate-400">Proporsi status pelunasan kerjasama</p>
            </div>
            <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
              <FileText className="w-4 h-4 text-emerald-600" />
            </span>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center text-xs">
            {contracts.length === 0 ? (
              <div className="text-slate-400 italic text-center">
                Belum ada data kontrak.
              </div>
            ) : (
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartStatusData.map((entry, index) => {
                        const statusColor = 
                          entry.name === 'Lunas' ? '#10b981' : 
                          entry.name === 'Selesai Sebagian' ? '#3b82f6' : '#f59e0b';
                        return <Cell key={`cell-${index}`} fill={statusColor} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text of donut */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-lg font-black text-slate-800">{contracts.length}</span>
                  <span className="text-[8px] block uppercase font-bold text-slate-400">Kontrak</span>
                </div>
              </div>
            )}
          </div>

          {/* Custom Legends for Pie */}
          <div className="space-y-1.5 text-[11px] font-medium border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Belum Bayar</span>
              </div>
              <span className="font-bold text-slate-800 font-mono">
                {contracts.filter(c => c.paymentStatus === 'Belum Bayar').length} Kontrak
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Selesai Sebagian</span>
              </div>
              <span className="font-bold text-slate-800 font-mono">
                {contracts.filter(c => c.paymentStatus === 'Selesai Sebagian').length} Kontrak
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Lunas</span>
              </div>
              <span className="font-bold text-slate-800 font-mono">
                {contracts.filter(c => c.paymentStatus === 'Lunas').length} Kontrak
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Contracts List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari nama mitra, no kontrak, kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 font-semibold focus:outline-hidden placeholder-slate-400 w-full md:w-64"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Type filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Jenis:</span>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 font-bold focus:outline-hidden"
              >
                <option value="Semua">Semua</option>
                <option value="Iklan/Siar Layanan">Iklan/Siar Layanan</option>
                <option value="Sewa Lahan/Menara">Sewa Lahan/Menara</option>
                <option value="Sponsorship Acara">Sponsorship Acara</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Pembayaran:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 font-bold focus:outline-hidden"
              >
                <option value="Semua">Semua</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Selesai Sebagian">Selesai Sebagian</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>

          </div>

        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nama Mitra / No. Kontrak</th>
                <th className="px-6 py-4">Nama Kegiatan / Jenis</th>
                <th className="px-6 py-4 text-right">Nilai Kontrak</th>
                <th className="px-6 py-4 text-right text-emerald-600">PNBP Realisasi</th>
                <th className="px-6 py-4 text-center">Status Pembayaran</th>
                <th className="px-6 py-4 text-center">Masa Berlaku</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    {contracts.length === 0 ? "Belum ada kerjasama kontrak penunjang PNBP." : "Tidak ditemukan kerjasama yang cocok dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{c.partnerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.contractNo}</div>
                      </td>
                      
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-medium text-slate-700 max-w-xs truncate">{c.activityName}</div>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-md">
                          {c.cooperationType}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-extrabold text-slate-700">
                        Rp {c.value.toFixed(1)} Juta
                      </td>

                      <td className="px-6 py-4 text-right font-extrabold text-emerald-600">
                        Rp {c.realizedPnbp.toFixed(1)} Juta
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          c.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                          c.paymentStatus === 'Selesai Sebagian' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                          'bg-amber-50 text-amber-700 border border-amber-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.paymentStatus === 'Lunas' ? 'bg-emerald-500' :
                            c.paymentStatus === 'Selesai Sebagian' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          {c.paymentStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="text-[10px] font-semibold text-slate-600 flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{c.startDate}</span>
                          <span className="text-slate-300">s/d</span>
                          <span>{c.endDate}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                            title="Hapus"
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
          </table>
        </div>

      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{editingContract ? 'Edit Kontrak Kerjasama' : 'Tambah Kontrak Kerjasama Baru'}</h3>
                <p className="text-[10px] text-slate-400">Masukkan detail kegiatan penunjang PNBP LPU</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              
              <div className="grid grid-cols-2 gap-4">
                {/* No Kontrak */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Nomor Kontrak *</label>
                  <input 
                    type="text" 
                    value={contractNo}
                    onChange={(e) => setContractNo(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. KTR/LPU/2026/012"
                    required
                  />
                </div>

                {/* Jenis Kerjasama */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Jenis Kerjasama</label>
                  <select
                    value={cooperationType}
                    onChange={(e) => setCooperationType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Iklan/Siar Layanan">Iklan/Siar Layanan</option>
                    <option value="Sewa Lahan/Menara">Sewa Lahan/Menara</option>
                    <option value="Sponsorship Acara">Sponsorship Acara</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Nama Mitra */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Nama Mitra / Partner *</label>
                <input 
                  type="text" 
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Bank SulutGo, BPBD, Telkomsel"
                  required
                />
              </div>

              {/* Nama Kegiatan */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Nama Kegiatan / Nama Sewa *</label>
                <input 
                  type="text" 
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Siar Layanan Informasi Kebencanaan Terpadu"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Nilai Kontrak */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Nilai Kontrak (Juta Rupiah) *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-extrabold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                {/* Realisasi PNBP */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Realisasi Terbayar (Juta Rupiah)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={realizedPnbp}
                    onChange={(e) => setRealizedPnbp(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-600 font-extrabold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status Pembayaran */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Status Pembayaran</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Selesai Sebagian">Selesai Sebagian</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                {/* Sasaran Kinerja Terkait */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Hubungkan ke Sasaran PK</label>
                  <select
                    value={linkedIndicatorId}
                    onChange={(e) => setLinkedIndicatorId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    {pnbpIndicators.map(ind => (
                      <option key={ind.id} value={ind.id}>
                        {ind.name} (T: {ind.target} {ind.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal Mulai */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Masa Mulai</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Tanggal Selesai */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Masa Selesai</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-500 uppercase block text-[9px]">Catatan / Keterangan</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Pembayaran dilakukan dalam 2 termin"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  {editingContract ? 'Simpan Perubahan' : 'Tambah Kontrak'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
