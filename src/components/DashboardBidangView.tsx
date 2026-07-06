import { useMemo, useState } from 'react';
import { Employee, PerformanceAgreement, CooperationContract, ReporterTarget, NewsReport } from '../types';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  User, 
  Award, 
  Briefcase, 
  Clock, 
  Radio, 
  FileText, 
  Handshake, 
  Share2, 
  Settings, 
  GitFork,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Send,
  Trash2,
  ShieldAlert,
  Edit
} from 'lucide-react';

interface DashboardBidangViewProps {
  currentUser: { id: string; name: string; role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; division?: string; photo?: string };
  employees: Employee[];
  agreements: PerformanceAgreement[];
  contracts?: CooperationContract[];
  reporterTargets?: ReporterTarget[];
  newsReports?: NewsReport[];
  onUpdateAgreements?: (agreements: PerformanceAgreement[]) => void;
  onAddNotification?: (notification: any) => void;
}

export default function DashboardBidangView({
  currentUser,
  employees,
  agreements,
  contracts = [],
  reporterTargets = [],
  newsReports = [],
  onUpdateAgreements,
  onAddNotification
}: DashboardBidangViewProps) {
  
  const [activeTab, setActiveTab] = useState<'summary' | 'delegation'>('summary');
  const [delegatingIndicator, setDelegatingIndicator] = useState<{ indicator: any; agreement: any } | null>(null);
  const [delegateEmployeeId, setDelegateEmployeeId] = useState('');
  const [delegatedIndicatorName, setDelegatedIndicatorName] = useState('');
  const [delegatedTarget, setDelegatedTarget] = useState('');
  const [delegatedUnit, setDelegatedUnit] = useState('');
  const [delegatedWeight, setDelegatedWeight] = useState(25);
  const [editingAchievement, setEditingAchievement] = useState<{
    agreementId: string;
    indicatorId: string;
    employeeName: string;
    indicatorName: string;
    currentAchievement: number;
    target: string;
    unit: string;
  } | null>(null);
  const [newAchievementVal, setNewAchievementVal] = useState('');

  // Find current active employee details
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === currentUser.id);
  }, [employees, currentUser]);

  const activeDivision = currentUser.division || 'Umum';

  // Find all agreements relevant to this division
  // 1. Their own agreement (assignedToEmployeeId === currentEmployee.id)
  // 2. Their Ketua Tim / Kabid agreement for this division
  const divisionAgreements = useMemo(() => {
    return agreements.filter(ag => {
      // Direct assignment
      if (ag.assignedToEmployeeId === currentUser.id) return true;
      
      // Ketua Tim of their division
      const divisionKey = activeDivision.toLowerCase();
      const levelKey = ag.level.toLowerCase();
      
      if (divisionKey.includes('pemberitaan') && levelKey.includes('pemberitaan')) return true;
      if (divisionKey.includes('konten') && levelKey.includes('konten')) return true;
      if (divisionKey.includes('teknologi') && levelKey.includes('teknologi')) return true;
      if (divisionKey.includes('layanan') && levelKey.includes('layanan')) return true;
      if (divisionKey.includes('siaran') && levelKey.includes('siaran')) return true;
      if (divisionKey.includes('tata usaha') && levelKey.includes('tata usaha')) return true;
      if (divisionKey.includes('tata usaha') && levelKey.includes('kabid')) return true;
      
      return false;
    });
  }, [agreements, currentUser, activeDivision]);

  // Extract objectives
  const { ownObjectives, teamObjectives } = useMemo(() => {
    const own = divisionAgreements.find(ag => ag.assignedToEmployeeId === currentUser.id);
    const team = divisionAgreements.find(ag => ag.assignedToEmployeeId !== currentUser.id && ag.level !== 'Pegawai');
    
    return {
      ownObjectives: own ? own.objectives : [],
      teamObjectives: team ? team.objectives : [],
      teamAgreement: team
    };
  }, [divisionAgreements, currentUser]);

  // Calculate stats for this specific division
  const stats = useMemo(() => {
    // 1. Calculate average achievement of their own objectives
    let ownPctTotal = 0;
    ownObjectives.forEach(obj => {
      const tgt = parseFloat(obj.target) || 100;
      const progress = tgt > 0 ? (obj.achievement / tgt) * 100 : 0;
      ownPctTotal += Math.min(120, progress);
    });
    const ownAverageProgress = ownObjectives.length > 0 ? Math.round(ownPctTotal / ownObjectives.length) : 0;

    // 2. Calculate average achievement of their team's objectives
    let teamPctTotal = 0;
    teamObjectives.forEach(obj => {
      const tgt = parseFloat(obj.target) || 100;
      const progress = tgt > 0 ? (obj.achievement / tgt) * 100 : 0;
      teamPctTotal += Math.min(120, progress);
    });
    const teamAverageProgress = teamObjectives.length > 0 ? Math.round(teamPctTotal / teamObjectives.length) : 0;

    // 3. For division-specific metrics
    const divReports = newsReports.filter(r => r.employeeId === currentUser.id);
    const totalDivValue = contracts
      .filter(c => c.linkedIndicatorId === 'ind-11')
      .reduce((sum, c) => sum + c.value, 0);

    return {
      ownAverageProgress,
      teamAverageProgress,
      divReportsCount: divReports.length,
      totalDivValue
    };
  }, [ownObjectives, teamObjectives, newsReports, currentUser, contracts]);

  // Find Level 2 Agreement for this division (e.g. Siaran, Pemberitaan, etc.)
  const level2Agreement = useMemo(() => {
    const divKey = activeDivision.toLowerCase();
    return agreements.find(ag => {
      const lvlKey = ag.level.toLowerCase();
      if (divKey.includes('pemberitaan') && lvlKey.includes('pemberitaan')) return true;
      if (divKey.includes('konten') && lvlKey.includes('konten')) return true;
      if (divKey.includes('teknologi') && lvlKey.includes('teknologi')) return true;
      if (divKey.includes('layanan') && lvlKey.includes('layanan')) return true;
      if (divKey.includes('siaran') && lvlKey.includes('siaran')) return true;
      if (divKey.includes('tata usaha') && (lvlKey.includes('tata usaha') || lvlKey.includes('kabid'))) return true;
      return false;
    });
  }, [agreements, activeDivision]);

  // Find all level 3 (Pegawai) agreements of this division
  const divisionPegawaiAgreements = useMemo(() => {
    return agreements.filter(ag => {
      if (ag.level !== 'Pegawai' || !ag.assignedToEmployeeId) return false;
      const emp = employees.find(e => e.id === ag.assignedToEmployeeId);
      return emp?.divisi === activeDivision;
    });
  }, [agreements, employees, activeDivision]);

  // Find staff/subordinates of this division
  const divisionStaff = useMemo(() => {
    return employees.filter(e => e.divisi === activeDivision && e.role !== 'Ketua Bidang');
  }, [employees, activeDivision]);

  const openDelegationForm = (indicator: any, agreement: any) => {
    setDelegatingIndicator({ indicator, agreement });
    setDelegatedIndicatorName(`Dukungan Pencapaian: ${indicator.indicatorName}`);
    setDelegatedTarget('');
    setDelegatedUnit(indicator.unit);
    setDelegatedWeight(25);
    setDelegateEmployeeId(divisionStaff[0]?.id || '');
  };

  const handleSendDelegation = () => {
    if (!delegatingIndicator || !delegatedIndicatorName || !delegatedTarget || !delegateEmployeeId || !onUpdateAgreements) return;

    const selectedEmployee = employees.find(e => e.id === delegateEmployeeId);
    if (!selectedEmployee) return;

    // Find if target agreement already exists
    const existingAgIndex = agreements.findIndex(a => 
      a.year === 2026 && 
      a.level === 'Pegawai' && 
      a.assignedToEmployeeId === delegateEmployeeId
    );

    const newDelegatedIndicator = {
      id: `ind-${Date.now()}`,
      indicatorName: delegatedIndicatorName,
      target: delegatedTarget,
      unit: delegatedUnit,
      weight: delegatedWeight,
      achievement: 0,
      parentIndicatorId: delegatingIndicator.indicator.id
    };

    let updated: PerformanceAgreement[];

    if (existingAgIndex !== -1) {
      updated = agreements.map((ag, idx) => {
        if (idx === existingAgIndex) {
          return {
            ...ag,
            objectives: [...ag.objectives, newDelegatedIndicator]
          };
        }
        return ag;
      });
    } else {
      const newAgId = `pk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newAg: PerformanceAgreement = {
        id: newAgId,
        year: 2026,
        level: 'Pegawai',
        assignedToEmployeeId: delegateEmployeeId,
        assignedToName: `${selectedEmployee.gelarDepan ? selectedEmployee.gelarDepan + ' ' : ''}${selectedEmployee.nama}${selectedEmployee.gelarBelakang ? ', ' + selectedEmployee.gelarBelakang : ''}`,
        objectives: [newDelegatedIndicator],
        status: 'Draft',
        createdAt: new Date().toISOString()
      };
      updated = [...agreements, newAg];
    }

    onUpdateAgreements(updated);

    if (onAddNotification) {
      onAddNotification({
        id: `notif-pk-delegation-${Date.now()}`,
        title: "Pendelegasian Sasaran Baru",
        message: `Sasaran Kinerja "${delegatedIndicatorName}" (Target: ${delegatedTarget} ${delegatedUnit}) telah didelegasikan kepada ${selectedEmployee.nama}. Harap segera laksanakan tindak lanjut.`,
        type: "warning",
        timestamp: new Date().toISOString(),
        isRead: false,
        metricName: "IKU Terkait",
        metricValue: delegatingIndicator.indicator.indicatorName
      });
    }

    // Play quick success sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}

    setDelegatingIndicator(null);
  };

  const handleDeleteDelegation = (agreementId: string, indicatorId: string) => {
    if (!onUpdateAgreements) return;
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.filter(o => o.id !== indicatorId)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  const handleSaveStaffAchievement = () => {
    if (!editingAchievement || !onUpdateAgreements) return;
    const value = parseFloat(newAchievementVal) || 0;

    const updated = agreements.map(ag => {
      if (ag.id === editingAchievement.agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === editingAchievement.indicatorId) {
              return {
                ...o,
                achievement: value
              };
            }
            return o;
          })
        };
      }
      return ag;
    });

    onUpdateAgreements(updated);

    if (onAddNotification) {
      onAddNotification({
        id: `notif-pk-achievement-${Date.now()}`,
        title: "Pembaruan Capaian Kinerja Staf",
        message: `Capaian kinerja untuk ${editingAchievement.employeeName} pada sasaran "${editingAchievement.indicatorName}" telah diperbarui menjadi ${value} ${editingAchievement.unit}.`,
        type: "success",
        timestamp: new Date().toISOString(),
        isRead: false,
        metricName: "Capaian Baru",
        metricValue: `${value} ${editingAchievement.unit}`
      });
    }

    // Play quick success sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}

    setEditingAchievement(null);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Bidang Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white relative overflow-hidden">
        {/* Decorative backdrop patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase font-mono">
                Selamat Datang di Portal Bidang
              </span>
              <h1 className="text-xl font-bold tracking-tight">{currentUser.name}</h1>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>NIP. {currentEmployee?.nip || 'Simulator NIP'} • Divisi <strong>{activeDivision}</strong></span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex flex-col md:items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Dashboard Bidang Aktif</span>
            <span className="text-sm font-extrabold text-indigo-400 mt-0.5 tracking-wide">
              {activeDivision.toUpperCase()}
            </span>
            <span className="text-[9px] text-slate-500 font-mono mt-1">Tahun Anggaran 2026</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation if user is Ketua Bidang */}
      {currentUser.role === 'Ketua Bidang' && (
        <div className="flex border-b border-slate-200 gap-1 mt-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-5 py-2.5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ringkasan Kinerja Bidang
          </button>
          <button
            onClick={() => setActiveTab('delegation')}
            className={`px-5 py-2.5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'delegation'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitFork className="w-4 h-4" /> Menu Delegasi Tugas
          </button>
        </div>
      )}

      {activeTab === 'summary' && (
        <>
          {/* Overview Division Metrics Rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Progres Kerja Individu</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-800 font-mono">{stats.ownAverageProgress}%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Rerata SKP</span>
                </div>
                <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.ownAverageProgress)}%` }} />
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <User className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Progres Kinerja Tim Divisi</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-800 font-mono">{stats.teamAverageProgress}%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Rerata PK Bidang</span>
                </div>
                <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, stats.teamAverageProgress)}%` }} />
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 3: Division specific quick stat */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                {activeDivision === 'Pemberitaan' || activeDivision === 'Konten Media Baru' ? (
                  <>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Publikasi Konten Saya</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-slate-800 font-mono">{stats.divReportsCount}</span>
                      <span className="text-xs text-slate-400">Terbit Bulan Ini</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Mendukung otomatisasi cascade stasiun</p>
                  </>
                ) : activeDivision === 'Layanan Pengembangan Usaha' ? (
                  <>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Kontrak Mitra Aktif</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-slate-800 font-mono">Rp {stats.totalDivValue}Jt</span>
                      <span className="text-xs text-slate-400">Total Potensi</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Realisasi dihitung otomatis masuk PNBP</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Sistem Kerja Terverifikasi</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-emerald-600 font-mono">AKTIF</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Sinkronisasi 2026
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                {activeDivision === 'Pemberitaan' || activeDivision === 'Konten Media Baru' ? (
                  <Share2 className="w-6 h-6" />
                ) : activeDivision === 'Layanan Pengembangan Usaha' ? (
                  <Handshake className="w-6 h-6" />
                ) : (
                  <Settings className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>

          {/* Target & Perjanjian Kerja Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Sasaran Kinerja Individu (SKP Pegawai) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Sasaran Kinerja Individu (SKP Anda)
                  </h2>
                  <p className="text-[11px] text-slate-400">Kontrak target pribadi yang harus Anda penuhi tahun ini.</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">Pegawai</span>
              </div>

              <div className="space-y-4">
                {ownObjectives.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Belum ada Perjanjian Kinerja Individu yang didelegasikan untuk akun Anda.
                  </div>
                ) : (
                  ownObjectives.map((obj) => {
                    const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                    return (
                      <div key={obj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 space-y-2.5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                            <h3 className="text-xs font-bold text-slate-700 mt-1 leading-normal">{obj.indicatorName}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block font-medium">Realisasi / Target</span>
                            <span className="text-xs font-extrabold text-slate-800 font-mono">
                              {obj.achievement} {obj.unit} / {obj.target} {obj.unit}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Persentase Ketercapaian</span>
                            <span className="font-extrabold text-emerald-600 font-mono">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Perjanjian Kinerja Tim / Bidang (Cascade Reference) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-indigo-600" />
                    Sasaran Kinerja Bidang ({activeDivision})
                  </h2>
                  <p className="text-[11px] text-slate-400">Target Ketua Tim / Koordinator sebagai rujukan cascading Anda.</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">Ketua Tim</span>
              </div>

              <div className="space-y-4">
                {teamObjectives.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Belum ada Perjanjian Kinerja tingkat Bidang yang dimuat.
                  </div>
                ) : (
                  teamObjectives.map((obj) => {
                    const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                    return (
                      <div key={obj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 space-y-2.5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                            <h3 className="text-xs font-bold text-slate-700 mt-1 leading-normal">{obj.indicatorName}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block font-medium">Realisasi / Target</span>
                            <span className="text-xs font-extrabold text-slate-800 font-mono">
                              {obj.achievement} {obj.unit} / {obj.target} {obj.unit}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Persentase Ketercapaian Tim</span>
                            <span className="font-extrabold text-indigo-600 font-mono">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Information Traceability Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
              Mekanisme Cascading & Penyelarasan Kinerja
            </h4>
            <p className="leading-relaxed text-[11px]">
              Target individu Anda (SKP Pegawai) diselaraskan secara vertikal dengan Sasaran Kinerja Bidang (Ketua Tim). Setiap realisasi atau laporan pekerjaan yang Anda masukkan di portal ini (misalnya jumlah rilis berita atau publikasi media) akan dihitung secara langsung dan otomatis mengalir naik (cascade) meningkatkan capaian tim divisi, dan akhirnya berkontribusi penuh bagi Indeks Kinerja Utama (IKU) Kepala Stasiun.
            </p>
          </div>
        </>
      )}

      {/* Tab Content 2: Delegation Menu */}
      {currentUser.role === 'Ketua Bidang' && activeTab === 'delegation' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <GitFork className="w-5 h-5 text-indigo-600" />
              Kelola Delegasi Sasaran Kinerja (Level 2 → Level 3)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sebagai Ketua Bidang / Ketua Tim <strong>{activeDivision}</strong>, Anda menerima Sasaran Strategis (Level 2) dari Kepala Stasiun. Di sini Anda dapat mendelegasikan (cascade) sasaran tersebut kepada Staf Pelaksana di bawah koordinasi Anda untuk mendukung pencapaian kinerja divisi secara keseluruhan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: List of level 2 indicators from Head of Station */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Daftar Sasaran Level 2 Anda ({level2Agreement?.objectives?.length || 0} Indikator)
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-sm">
                  Rujukan Cascading
                </span>
              </div>

              {!level2Agreement || level2Agreement.objectives.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 italic">
                  Belum ada Sasaran Kinerja Level 2 yang ditetapkan oleh Kepala Stasiun untuk Bidang {activeDivision}.
                </div>
              ) : (
                level2Agreement.objectives.map((obj) => {
                  // Find existing delegations for this indicator
                  const existingDelegations: { agreementId: string; indicatorId: string; employeeName: string; text: string; target: string; unit: string; weight: number; achievement: number }[] = [];
                  divisionPegawaiAgreements.forEach(pag => {
                    pag.objectives.forEach(pobj => {
                      if (pobj.parentIndicatorId === obj.id) {
                        existingDelegations.push({
                          agreementId: pag.id,
                          indicatorId: pobj.id,
                          employeeName: pag.assignedToName,
                          text: pobj.indicatorName,
                          target: pobj.target,
                          unit: pobj.unit,
                          weight: pobj.weight || 25,
                          achievement: pobj.achievement || 0
                        });
                      }
                    });
                  });

                  return (
                    <div key={obj.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-slate-200 transition-colors">
                      {/* Level 2 Indicator details */}
                      <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                            <span className="text-[9px] font-bold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm uppercase">LEVEL 2</span>
                          </div>
                          <h3 className="text-xs font-extrabold text-slate-800 leading-snug">{obj.indicatorName}</h3>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Target Utama</span>
                          <span className="text-xs font-black text-indigo-600 font-mono">
                            {obj.target} {obj.unit}
                          </span>
                        </div>
                      </div>

                      {/* Delegations header */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            Delegasi ke Staf Pelaksana ({existingDelegations.length})
                          </span>
                          <button
                            onClick={() => openDelegationForm(obj, level2Agreement)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-indigo-600/10 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Delegasikan
                          </button>
                        </div>

                        {existingDelegations.length === 0 ? (
                          <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400 italic">
                            Belum ada delegasi tugas ke staf untuk sasaran ini. Klik tombol "Delegasikan" untuk memulainya.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {existingDelegations.map((del) => {
                              const pct = parseFloat(del.target) > 0 ? Math.round((del.achievement / parseFloat(del.target)) * 100) : 0;
                              return (
                                <div key={del.indicatorId} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors">
                                  <div className="space-y-1.5 flex-1 w-full">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">{del.employeeName}</span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm font-mono uppercase ${
                                        pct >= 100 ? 'bg-emerald-50 text-emerald-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        Progres: {pct}%
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700 leading-normal">{del.text}</p>
                                    
                                    {/* Target and Weight */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-semibold">
                                      <span>Target: <strong className="text-slate-600 font-mono">{del.target} {del.unit}</strong></span>
                                      <span>Bobot: <strong className="text-slate-600 font-mono">{del.weight}%</strong></span>
                                      <span>Realisasi: <strong className="text-indigo-600 font-mono">{del.achievement} {del.unit}</strong></span>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-1">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${Math.min(100, pct)}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                                    <button
                                      onClick={() => {
                                        setEditingAchievement({
                                          agreementId: del.agreementId,
                                          indicatorId: del.indicatorId,
                                          employeeName: del.employeeName,
                                          indicatorName: del.text,
                                          currentAchievement: del.achievement,
                                          target: del.target,
                                          unit: del.unit
                                        });
                                        setNewAchievementVal(del.achievement.toString());
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                      title="Update Realisasi Capaian"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>Update Capaian</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Apakah Anda yakin ingin membatalkan/menghapus delegasi sasaran ini untuk ${del.employeeName}?`)) {
                                          handleDeleteDelegation(del.agreementId, del.indicatorId);
                                        }
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-xl transition-all shrink-0 cursor-pointer"
                                      title="Hapus Delegasi"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Division Team Roster Info */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block pb-1">
                Staf Pelaksana di Bidang Anda ({divisionStaff.length} Pegawai)
              </span>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Berikut adalah daftar Pegawai Pelaksana (Staf) di bidang <strong>{activeDivision}</strong> yang dapat menerima delegasi target kinerja:
                </p>

                <div className="space-y-2.5">
                  {divisionStaff.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      Tidak ada staf pelaksana terdaftar di divisi ini.
                    </div>
                  ) : (
                    divisionStaff.map((staff) => {
                      // Count delegated indicators for this staff
                      const staffAg = divisionPegawaiAgreements.find(ag => ag.assignedToEmployeeId === staff.id);
                      const delegatedCount = staffAg?.objectives?.length || 0;

                      return (
                        <div key={staff.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100/50 transition-colors">
                          <img
                            src={staff.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces"}
                            alt={staff.nama}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-700 leading-tight">{staff.nama}</h4>
                            <p className="text-[10px] text-slate-400">NIP. {staff.nip || 'Simulator NIP'}</p>
                            <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-sm">
                              {delegatedCount} Sasaran Diterima
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delegation Form Modal */}
      {delegatingIndicator && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-800">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-bold font-mono tracking-wider text-indigo-400 uppercase">PENDELEGASIAN INDIKATOR</span>
                <h3 className="text-sm font-bold tracking-tight">Delegasikan ke Staf Pelaksana</h3>
              </div>
              <button
                onClick={() => setDelegatingIndicator(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Rujukan Sasaran */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-1">
                <span className="text-[9px] font-black text-indigo-600 uppercase font-mono">Rujukan Sasaran Level 2 (Induk)</span>
                <p className="text-xs font-bold text-slate-800 leading-snug">{delegatingIndicator.indicator.indicatorName}</p>
                <p className="text-[10px] text-slate-500">Target Utama: <strong className="text-slate-700">{delegatingIndicator.indicator.target} {delegatingIndicator.indicator.unit}</strong></p>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                {/* Select Staff */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Staf Penerima Delegasi</label>
                  <select
                    value={delegateEmployeeId}
                    onChange={(e) => setDelegateEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs outline-none transition-all"
                  >
                    {divisionStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} ({s.nip || 'NIP Simulator'})</option>
                    ))}
                  </select>
                </div>

                {/* Delegated Indicator Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama Sasaran Delegasi (IKU Staf)</label>
                  <textarea
                    value={delegatedIndicatorName}
                    onChange={(e) => setDelegatedIndicatorName(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs outline-none transition-all resize-none"
                    placeholder="Contoh: Terlaksananya siaran program opini publik berkualitas"
                  />
                </div>

                {/* Target & Satuan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Delegasi</label>
                    <input
                      type="text"
                      value={delegatedTarget}
                      onChange={(e) => setDelegatedTarget(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs outline-none transition-all"
                      placeholder="Contoh: 12 atau 100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Satuan</label>
                    <input
                      type="text"
                      value={delegatedUnit}
                      onChange={(e) => setDelegatedUnit(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs outline-none transition-all"
                      placeholder="Contoh: Kegiatan / Laporan"
                    />
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bobot Sasaran (%)</label>
                  <input
                    type="number"
                    value={delegatedWeight}
                    onChange={(e) => setDelegatedWeight(parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setDelegatingIndicator(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSendDelegation}
                disabled={!delegatedTarget.trim() || !delegatedIndicatorName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <Send className="w-4 h-4" /> Kirim Delegasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Achievement Modal */}
      {editingAchievement && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-800">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-bold font-mono tracking-wider text-indigo-400 uppercase">UPDATE REALISASI CAPAIAN</span>
                <h3 className="text-sm font-bold tracking-tight">Perbarui Capaian Staf</h3>
              </div>
              <button
                onClick={() => setEditingAchievement(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-indigo-600 block uppercase font-mono">Pegawai Pelaksana</span>
                  <p className="text-xs font-bold text-slate-800">{editingAchievement.employeeName}</p>
                </div>
                <div className="space-y-0.5 border-t border-slate-200/60 pt-2">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Sasaran Tugas</span>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{editingAchievement.indicatorName}</p>
                </div>
              </div>

              {/* Input Achievement */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <label htmlFor="new_ach_input">Nilai Realisasi Baru</label>
                  <span>Target: {editingAchievement.target} {editingAchievement.unit}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="new_ach_input"
                    type="number"
                    step="any"
                    value={newAchievementVal}
                    onChange={(e) => setNewAchievementVal(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-sm outline-none transition-all font-mono"
                    placeholder="Masukkan angka realisasi..."
                    autoFocus
                  />
                  <span className="absolute right-3 text-xs font-extrabold text-slate-400 font-mono">
                    {editingAchievement.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingAchievement(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveStaffAchievement}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan Capaian
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
