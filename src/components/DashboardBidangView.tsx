import React from 'react';
import { getGaugeColorByPercentage } from "../utils/colors";
import { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  Edit,
  GraduationCap,
  Layers,
  Eye,
  BarChart3,
  Sparkles
} from 'lucide-react';
import NewsDetailModal from './NewsDetailModal';
import { filterNewsForIndicator, isEligibleNewsIndicator } from '../utils/newsFilter';

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


  // KMB Shared Indicators Calculation
  const kmbSharedIndicators = React.useMemo(() => {
    let indicators: any[] = [];
    let sum = 0;
    
    // Group support by division
    let siaranCount = 0;
    let siaranSum = 0;
    let beritaCount = 0;
    let beritaSum = 0;

    agreements.forEach(ag => {
      if (!ag.objectives) return;
      ag.objectives.forEach(obj => {
        if (obj.supportedByKMB) {
          const targetVal = parseFloat(obj.target) || 100;
          const pct = targetVal > 0 ? Math.min(100, Math.round((obj.achievement / targetVal) * 100)) : 0;
          
          indicators.push({ ...obj, _pct: pct, division: ag.level });
          sum += pct;

          if (ag.level.includes('Siaran')) {
            siaranCount++;
            siaranSum += pct;
          } else if (ag.level.includes('Pemberitaan')) {
            beritaCount++;
            beritaSum += pct;
          }
        }
      });
    });

    const average = indicators.length > 0 ? Math.round(sum / indicators.length) : 0;
    const siaranAverage = siaranCount > 0 ? Math.round(siaranSum / siaranCount) : 0;
    const beritaAverage = beritaCount > 0 ? Math.round(beritaSum / beritaCount) : 0;

    return { indicators, average, siaranAverage, beritaAverage };
  }, [agreements]);

  // Mode visualisasi target PK per divisi
  const [visualizerMode, setVisualizerMode] = useState<'auto' | 'akumulatif' | 'triwulanan' | 'bulanan_tahunan' | 'gauge'>('gauge');

  // News detail modal state
  const [newsModalConfig, setNewsModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    indicatorName: string;
    periodLabel: string;
    newsReports: NewsReport[];
    targetValue?: string | number;
    achievementValue?: number;
    assignedToName?: string;
  }>({
    isOpen: false,
    title: '',
    indicatorName: '',
    periodLabel: '',
    newsReports: []
  });

  const handleOpenNewsModal = (obj: any, agreement?: any) => {
    const { filteredReports, periodLabel, typeLabel, isEligible } = filterNewsForIndicator({
      indicator: obj,
      agreement: agreement,
      newsReports: newsReports || [],
      period: 'tahunan',
      selectedYear: new Date().getFullYear()
    });

    if (!isEligible) {
      return;
    }

    setNewsModalConfig({
      isOpen: true,
      title: `Eviden List ${typeLabel}`,
      indicatorName: obj.indicatorName,
      periodLabel: periodLabel,
      newsReports: filteredReports,
      targetValue: obj.target,
      achievementValue: obj.achievement || 0,
      assignedToName: agreement?.assignedToName || currentUser.name
    });
  };

  // Stats for Tata Usaha dashboard duplication
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<string | null>(null);

  const genderStats = useMemo(() => {
    const male = employees.filter(e => e.jenisKelamin === 'Laki-laki').length;
    const female = employees.filter(e => e.jenisKelamin === 'Perempuan').length;
    const total = employees.length || 1;
    return {
      male,
      female,
      malePct: Math.round((male / total) * 100),
      femalePct: Math.round((female / total) * 100),
    };
  }, [employees]);

  const divisionStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Program Acara': 0,
      'Pemberitaan': 0,
      'Teknik': 0,
      'Tata Usaha / Umum': 0,
      'Layanan Publik': 0
    };
    
    employees.forEach(e => {
      if (counts[e.divisi] !== undefined) {
        counts[e.divisi]++;
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / maxCount) * 100)
    }));
  }, [employees]);

  const educationStats = useMemo(() => {
    const counts: Record<string, number> = {
      'SMA': 0,
      'D3': 0,
      'S1': 0,
      'S2': 0,
      'S3': 0
    };

    employees.forEach(e => {
      if (counts[e.jenjangPendidikan] !== undefined) {
        counts[e.jenjangPendidikan]++;
      }
    });

    return Object.entries(counts).map(([level, count]) => ({
      level,
      count
    }));
  }, [employees]);

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
                <span>NIP. {currentEmployee?.nip || '-'} • Divisi <strong>{activeDivision}</strong></span>
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
          {/* SECTION VISUALISASI CAPAIAN IKP PER BIDANG (MULTI-MODE VISUALIZER) FOR LEVEL 3 */}
          <div id="trend-bidang-section" className="bg-[#f0f4f8] p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-4 mb-4">
            
            {/* Header Dashboard & Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Capaian Indikator Kinerja Program Divisi {activeDivision}
                </h2>
                <p className="text-[10px] text-slate-500">Format tampilan kartu menyesuaikan tipe PK atau pilihan manual di kanan</p>
              </div>

              {/* Mode Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold shadow-xs">
                <span className="text-slate-400 px-2 font-mono uppercase text-[9px]">Mode:</span>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('auto')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    visualizerMode === 'auto'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('akumulatif')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    visualizerMode === 'akumulatif'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Akumulatif
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('triwulanan')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    visualizerMode === 'triwulanan'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Triwulan (Q1-Q4)
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('bulanan_tahunan')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    visualizerMode === 'bulanan_tahunan'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Bulanan/Tahunan
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode('gauge')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    visualizerMode === 'gauge'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Gauge
                </button>
              </div>
            </div>

            {/* Clean Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamObjectives.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400 italic col-span-full bg-white rounded-2xl border border-dashed border-slate-200">
                  Belum ada Perjanjian Kinerja Tingkat Bidang ({activeDivision})
                </div>
              ) : (
                teamObjectives.map((obj, idx) => {
                  const targetNum = parseFloat(obj.target) || 100;
                  const pct = targetNum > 0 ? Math.round((obj.achievement / targetNum) * 100) : 0;
                  const fillPercentage = Math.min(100, Math.max(0, pct));
                  const remaining = 100 - fillPercentage;

                  // Color palettes for cards
                  const divColors = [
                    {
                      gaugeColor: '#0ea5e9', bgColor: 'bg-white', borderColor: 'border-sky-200/80 hover:border-sky-400',
                      hoverRingColor: 'hover:ring-sky-500/10', accentColor: 'bg-sky-500', textColor: 'text-sky-600',
                    },
                    {
                      gaugeColor: '#6366f1', bgColor: 'bg-white', borderColor: 'border-indigo-200/80 hover:border-indigo-400',
                      hoverRingColor: 'hover:ring-indigo-500/10', accentColor: 'bg-indigo-500', textColor: 'text-indigo-600',
                    },
                    {
                      gaugeColor: '#10b981', bgColor: 'bg-white', borderColor: 'border-emerald-200/80 hover:border-emerald-400',
                      hoverRingColor: 'hover:ring-emerald-500/10', accentColor: 'bg-emerald-500', textColor: 'text-emerald-600',
                    },
                    {
                      gaugeColor: '#ec4899', bgColor: 'bg-white', borderColor: 'border-pink-200/80 hover:border-pink-400',
                      hoverRingColor: 'hover:ring-pink-500/10', accentColor: 'bg-pink-500', textColor: 'text-pink-600',
                    },
                    {
                      gaugeColor: '#f59e0b', bgColor: 'bg-white', borderColor: 'border-amber-200/80 hover:border-amber-400',
                      hoverRingColor: 'hover:ring-amber-500/10', accentColor: 'bg-amber-500', textColor: 'text-amber-600',
                    },
                    {
                      gaugeColor: '#8b5cf6', bgColor: 'bg-white', borderColor: 'border-violet-200/80 hover:border-violet-400',
                      hoverRingColor: 'hover:ring-violet-500/10', accentColor: 'bg-violet-500', textColor: 'text-violet-600',
                    }
                  ];

                  const style = divColors[idx % divColors.length];

                  // Determine effective mode per indicator
                  let mode = visualizerMode;
                  if (mode === 'auto') {
                    if (activeDivision === 'Pemberitaan' || activeDivision === 'Layanan Publik' || obj.unit === 'Rilis' || obj.indicatorName?.toLowerCase().includes('berita')) {
                      mode = 'akumulatif';
                    } else if (activeDivision === 'Tata Usaha / Umum' || activeDivision === 'TMB' || obj.unit === '%' || obj.indicatorName?.toLowerCase().includes('sakip')) {
                      mode = 'triwulanan';
                    } else {
                      mode = 'bulanan_tahunan';
                    }
                  }

                  // Quarters Q1..Q4 estimates
                  const qData = [1, 2, 3, 4].map(qNum => {
                    const qTarget = obj.unit === '%' ? targetNum : Math.round((targetNum / 4) * 10) / 10;
                    const qAch = obj.unit === '%' ? obj.achievement : Math.round((obj.achievement / 4) * 10) / 10;
                    const qPct = qTarget > 0 ? Math.min(120, Math.round((qAch / qTarget) * 100)) : 0;
                    return { qNum, target: qTarget, ach: qAch, pct: qPct };
                  });

                  return (
                    <div
                      key={obj.id}
                      className={`relative ${style.bgColor} p-5 rounded-2xl border ${style.borderColor} hover:ring-2 ${style.hoverRingColor} shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 select-none overflow-hidden pt-6`}
                    >
                      {/* Top status bar */}
                      <div className={`absolute top-0 left-0 right-0 h-[3.5px] ${style.accentColor}`} />

                      {/* Header block */}
                      <div className="w-full space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 font-mono tracking-wider uppercase">
                            INDIKATOR BIDANG
                          </span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                            mode === 'akumulatif' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                            mode === 'triwulanan' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            mode === 'bulanan_tahunan' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {mode === 'akumulatif' ? 'Akumulatif' : mode === 'triwulanan' ? 'Q1-Q4' : mode === 'bulanan_tahunan' ? 'Bln vs Thn' : 'Gauge'}
                          </span>
                        </div>
                        <span className="text-xs md:text-sm font-bold text-slate-800 leading-snug line-clamp-2 block" title={obj.indicatorName}>
                          {obj.indicatorName}
                        </span>
                      </div>

                      {/* MODE 1: AKUMULATIF BULANAN */}
                      {mode === 'akumulatif' && (
                        <div className="space-y-3 my-1">
                          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[9px] font-bold text-indigo-700 uppercase font-mono">Pencapaian Akumulatif YTD</span>
                              <span className="text-base font-black text-indigo-700 font-mono">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                              <span>Realisasi: <strong className="text-slate-800 font-mono">{obj.achievement} {obj.unit}</strong></span>
                              <span>Target: <strong className="text-slate-800 font-mono">{obj.target} {obj.unit}</strong></span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Proyeksi Bulan 1-12:</span>
                            <div className="grid grid-cols-6 gap-1 text-[8px] font-mono">
                              {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((mName, mIdx) => {
                                const mAch = Math.round(((obj.achievement || 0) / 12) * (mIdx + 1));
                                return (
                                  <div key={mIdx} className="p-1 rounded text-center border bg-slate-50 border-slate-200 text-slate-700">
                                    <span className="block text-[7px] uppercase font-bold opacity-80">{mName}</span>
                                    <span className="truncate block font-extrabold">{mAch}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: BREAKDOWN TRIWULAN (Q1 - Q4) */}
                      {mode === 'triwulanan' && (
                        <div className="space-y-2 my-1">
                          <div className="grid grid-cols-2 gap-1.5">
                            {qData.map(q => (
                              <div key={q.qNum} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-bold">
                                  <span className="text-slate-600 font-mono uppercase">Triwulan {q.qNum}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold ${
                                    q.pct >= 100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                    q.pct > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {q.pct >= 100 ? 'Tercapai' : q.pct > 0 ? `${q.pct}%` : 'Belum'}
                                  </span>
                                </div>
                                <div className="text-[10px] flex justify-between font-mono pt-0.5 border-t border-slate-200/50">
                                  <span className="text-slate-400">Target: <strong className="text-slate-700">{q.target}</strong></span>
                                  <span className="text-indigo-600 font-bold">Real: <strong>{q.ach}</strong></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MODE 3: BULANAN VS TAHUNAN */}
                      {mode === 'bulanan_tahunan' && (
                        <div className="space-y-2 my-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                              <span className="text-[8px] font-bold text-amber-800 uppercase font-mono block">Rerata Bulanan</span>
                              <div className="text-lg font-black text-amber-900 font-mono leading-none">
                                {Math.round((obj.achievement || 0) / 12)} <span className="text-[10px] font-normal text-amber-700">{obj.unit}</span>
                              </div>
                              <span className="text-[9px] text-amber-700 block font-mono">Tgt/Bln: {Math.round(targetNum / 12)}</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
                              <span className="text-[8px] font-bold text-indigo-800 uppercase font-mono block">Total Tahunan YTD</span>
                              <div className="text-lg font-black text-indigo-900 font-mono leading-none">
                                {obj.achievement} <span className="text-[10px] font-normal text-indigo-700">{obj.unit}</span>
                              </div>
                              <span className="text-[9px] text-indigo-700 block font-mono">Tgt/Thn: {obj.target}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 4: GAUGE */}
                      {mode === 'gauge' && (
                        <div className="relative w-full h-36 flex items-center justify-center overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
                              <Pie
                                data={[
                                  { value: fillPercentage },
                                  { value: remaining }
                                ]}
                                cx="50%"
                                cy="95%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                <Cell fill={getGaugeColorByPercentage(fillPercentage)} />
                                <Cell fill="#cbd5e1" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-800 font-mono tracking-tight leading-none">
                              {pct}%
                            </span>
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">Capaian</span>
                          </div>
                        </div>
                      )}

                      {/* Metrics Footer Boxes */}
                      <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-slate-200/80 text-[10px]">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 min-w-0">
                          <span className="text-[8px] text-slate-500 font-bold block uppercase font-mono">Target</span>
                          <span className="font-extrabold text-slate-800 font-mono truncate block" title={`${obj.target} ${obj.unit}`}>{obj.target} {obj.unit}</span>
                        </div>
                        {isEligibleNewsIndicator(obj) ? (
                          <button
                            type="button"
                            className="p-2 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 min-w-0 cursor-pointer transition-colors text-left group"
                            onClick={() => handleOpenNewsModal(obj)}
                            title="Klik untuk melihat eviden berita terfilter"
                          >
                            <span className="text-[8px] text-indigo-600 font-bold uppercase font-mono flex items-center justify-between">
                              <span>Realisasi</span>
                              <Eye className="w-2.5 h-2.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                            </span>
                            <span className={`font-extrabold ${style.textColor} font-mono truncate block`} title={`${obj.achievement} ${obj.unit}`}>{obj.achievement} {obj.unit}</span>
                          </button>
                        ) : (
                          <div 
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 min-w-0 text-left"
                            title="Eviden List aktif untuk indikator kuantitas Berita & Siaran (Berita Ringan LPU, Berita Radio, Berita KBRN, dan Konten Siaran)"
                          >
                            <span className="text-[8px] text-slate-400 font-bold uppercase font-mono block">Realisasi</span>
                            <span className={`font-extrabold ${style.textColor} font-mono truncate block`} title={`${obj.achievement} ${obj.unit}`}>{obj.achievement} {obj.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Overview Division Metrics Rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
          {/* SIMULASI OPSI 1: KMB SHARED INDICATORS */}
          {activeDivision === 'Konten Media Baru' && (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-indigo-500/30 shadow-xl mb-6 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Simulasi Sistem: Opsi 1 (Shared Indicators)
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Kalkulasi Capaian Otomatis KMB</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                      Capaian kinerja KMB ditarik otomatis dari persentase indikator Bidang Siaran & Pemberitaan yang memiliki tag <strong className="text-indigo-300">"Didukung oleh KMB"</strong>.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Kontribusi Siaran</span>
                        <span className="text-xs font-black text-emerald-400">{kmbSharedIndicators.siaranAverage}%</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">Video Podcast, Multiplatform RRI</div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Kontribusi Berita</span>
                        <span className="text-xs font-black text-emerald-400">{kmbSharedIndicators.beritaAverage}%</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">Infografis Medsos, KBRN Online</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-48 flex flex-col items-center">
                  <div className="w-40 h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Capaian', value: kmbSharedIndicators.average },
                            { name: 'Sisa', value: 100 - kmbSharedIndicators.average }
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={50}
                          outerRadius={70}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={5}
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
                      <span className="text-3xl font-black text-white font-mono">{kmbSharedIndicators.average}<span className="text-sm text-slate-400">%</span></span>
                    </div>
                    <div className="absolute bottom-4 inset-x-0 text-center">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-full border border-indigo-500/20">Capaian Agregat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DAFTAR INDIKATOR KMB */}
              {kmbSharedIndicators.indicators.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50 relative z-10">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Rincian Ketercapaian Indikator
                  </h3>
                  <div className="space-y-2">
                    {kmbSharedIndicators.indicators.map((ind, idx) => (
                      <div key={idx} className="bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 tracking-wider">
                               {ind.division}
                             </span>
                           </div>
                           <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">{ind.indicatorName}</p>
                        </div>
                        <div className="shrink-0 sm:text-right flex sm:block items-center justify-between">
                          <p className="text-[10px] text-slate-400 sm:mb-1 font-mono">
                            {ind.achievement} / {ind.target} <span className="text-[9px]">{ind.unit}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 sm:w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, ind._pct)}%` }} />
                            </div>
                            <span className="text-xs font-black text-white font-mono w-8 text-right">{ind._pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


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
                      <div key={obj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-2 flex-1 w-full">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                            <h3 className="text-xs font-bold text-slate-700 leading-normal">{obj.indicatorName}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-200/50">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Realisasi</span>
                              <span className="text-xs font-black text-indigo-600 font-mono">{obj.achievement} {obj.unit}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Target</span>
                              <span className="text-xs font-black text-slate-700 font-mono">{obj.target} {obj.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Half Circle Gauge */}
                        <div className="relative w-28 h-16 flex items-center justify-center shrink-0 overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 5, left: 0, right: 0, bottom: 0 }}>
                              <Pie
                                data={[
                                  { value: Math.min(100, Math.max(0, pct)) },
                                  { value: 100 - Math.min(100, Math.max(0, pct)) }
                                ]}
                                cx="50%"
                                cy="95%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={22}
                                outerRadius={32}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                <Cell fill={getGaugeColorByPercentage(pct)} />
                                <Cell fill="#e2e8f0" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center">
                            <span className="text-xs font-black text-slate-800 font-mono tracking-tight">{pct}%</span>
                            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Capaian</span>
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
                      <div key={obj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-2 flex-1 w-full">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                            <h3 className="text-xs font-bold text-slate-700 leading-normal">{obj.indicatorName}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-200/50">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Realisasi</span>
                              <span className="text-xs font-black text-indigo-600 font-mono">{obj.achievement} {obj.unit}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Target</span>
                              <span className="text-xs font-black text-slate-700 font-mono">{obj.target} {obj.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Half Circle Gauge */}
                        <div className="relative w-28 h-16 flex items-center justify-center shrink-0 overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 5, left: 0, right: 0, bottom: 0 }}>
                              <Pie
                                data={[
                                  { value: Math.min(100, Math.max(0, pct)) },
                                  { value: 100 - Math.min(100, Math.max(0, pct)) }
                                ]}
                                cx="50%"
                                cy="95%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={22}
                                outerRadius={32}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                <Cell fill={getGaugeColorByPercentage(pct)} />
                                <Cell fill="#e2e8f0" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center">
                            <span className="text-xs font-black text-slate-800 font-mono tracking-tight">{pct}%</span>
                            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Capaian</span>
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

          {/* Section: Duplikasi Metrik Kepegawaian untuk Bagian Tata Usaha */}
          {activeDivision === 'Tata Usaha / Umum' && (
            <div className="space-y-4 pt-4 border-t border-slate-150">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Statistik & Metrik Kepegawaian (Duplikasi Tata Usaha)
                </h3>
                <p className="text-xs text-slate-400">
                  Visualisasi data distribusi gender, sebaran personil divisi, dan kualifikasi pendidikan seluruh pegawai stasiun.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rasio Gender Pegawai */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4.5 h-4.5 text-sky-500" />
                      Rasio Gender Pegawai
                    </h3>
                    <p className="text-xs text-slate-400">Distribusi gender pegawai berdasarkan data stasiun.</p>
                  </div>

                  <div className="relative py-6 flex items-center justify-center">
                    {employees.length === 0 ? (
                      <div className="h-44 flex items-center justify-center text-xs text-slate-400 italic">
                        Tidak ada data tersedia
                      </div>
                    ) : (
                      <>
                        <svg width="180" height="180" className="transform -rotate-90">
                          {(() => {
                            const radius = 65;
                            const circumference = 2 * Math.PI * radius;
                            
                            const malePct = genderStats.malePct;
                            const maleStroke = (malePct / 100) * circumference;
                            const femaleStroke = circumference - maleStroke;

                            return (
                              <>
                                {/* Background track */}
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="transparent"
                                  stroke="#f1f5f9"
                                  strokeWidth="22"
                                />

                                {/* Male Slice */}
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="transparent"
                                  stroke="#0ea5e9" // sky-500
                                  strokeWidth={hoveredDonutSegment === 'Laki-laki' ? '26' : '22'}
                                  strokeDasharray={`${maleStroke} ${circumference}`}
                                  onMouseEnter={() => setHoveredDonutSegment('Laki-laki')}
                                  onMouseLeave={() => setHoveredDonutSegment(null)}
                                  className="transition-all duration-200 cursor-pointer"
                                />

                                {/* Female Slice */}
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="transparent"
                                  stroke="#ec4899" // pink-500
                                  strokeWidth={hoveredDonutSegment === 'Perempuan' ? '26' : '22'}
                                  strokeDasharray={`${femaleStroke} ${circumference}`}
                                  strokeDashoffset={-maleStroke}
                                  onMouseEnter={() => setHoveredDonutSegment('Perempuan')}
                                  onMouseLeave={() => setHoveredDonutSegment(null)}
                                  className="transition-all duration-200 cursor-pointer"
                                />
                              </>
                            );
                          })()}
                        </svg>

                        {/* Donut Center Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-extrabold text-slate-800 font-mono">
                            {hoveredDonutSegment === 'Laki-laki' ? `${genderStats.malePct}%` : 
                             hoveredDonutSegment === 'Perempuan' ? `${genderStats.femalePct}%` : 
                             `${employees.length}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {hoveredDonutSegment ? hoveredDonutSegment : 'Total Pegawai'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-slate-50 pt-3 flex justify-around text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-sky-500 rounded-xs" />
                      <div>
                        <p className="font-semibold text-slate-700">Laki-laki</p>
                        <p className="text-[10px] text-slate-400 font-mono">{genderStats.male} pegawai ({genderStats.malePct}%)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-pink-500 rounded-xs" />
                      <div>
                        <p className="font-semibold text-slate-700">Perempuan</p>
                        <p className="text-[10px] text-slate-400 font-mono">{genderStats.female} pegawai ({genderStats.femalePct}%)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Division Stats (Progress bars with dynamic numbers) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-4.5 h-4.5 text-emerald-500" />
                      Kekuatan Divisi Pegawai
                    </h3>
                    <p className="text-xs text-slate-400">Distribusi personel pada masing-masing bidang.</p>
                  </div>

                  <div className="py-4 space-y-3.5">
                    {divisionStats.map((div, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-700">{div.name}</span>
                          <span className="font-bold text-slate-800 font-mono">{div.count} <span className="text-[10px] text-slate-400 font-normal">Pegawai</span></span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${div.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-50 pt-2 text-[11px] text-slate-400 text-center">
                    Tata Usaha memantau alokasi sdm operasional.
                  </div>
                </div>

                {/* Education Level vertical bar chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4.5 h-4.5 text-purple-500" />
                      Pendidikan Terakhir SDM
                    </h3>
                    <p className="text-xs text-slate-400">Statistik jenjang kualifikasi formal pegawai.</p>
                  </div>

                  <div className="h-44 w-full flex items-end justify-between px-3 pt-6 pb-2">
                    {educationStats.map((edu, idx) => {
                      const maxCount = Math.max(...educationStats.map(e => e.count), 1);
                      const barHeight = Math.max((edu.count / maxCount) * 100, 8); // minimal height for visibility

                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                          <div className="relative w-full flex justify-center">
                            {/* Tooltip on hover */}
                            <span className="absolute -top-7 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm transition-transform duration-150">
                              {edu.count} Pegawai
                            </span>
                            <span className="text-xs font-bold text-slate-700 font-mono group-hover:text-purple-600 transition-colors">
                              {edu.count}
                            </span>
                          </div>
                          
                          {/* Visual Bar */}
                          <div className="w-8 bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-28">
                            <div 
                              className="bg-purple-500 group-hover:bg-purple-600 rounded-t-lg transition-all duration-300"
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>
                          
                          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                            {edu.level}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-50 pt-3 text-[11px] text-slate-400 text-center">
                    Persentase kualifikasi minimal berfokus pada S1 & D3.
                  </div>
                </div>
              </div>
            </div>
          )}
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
                            <p className="text-[10px] text-slate-400">NIP. {staff.nip || '-'}</p>
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
                      <option key={s.id} value={s.id}>{s.nama} ({s.nip || '-'})</option>
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

      {/* News Detail Evidence Modal */}
      <NewsDetailModal
        isOpen={newsModalConfig.isOpen}
        onClose={() => setNewsModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={newsModalConfig.title}
        indicatorName={newsModalConfig.indicatorName}
        periodLabel={newsModalConfig.periodLabel}
        newsReports={newsModalConfig.newsReports}
        targetValue={newsModalConfig.targetValue}
        achievementValue={newsModalConfig.achievementValue}
        assignedToName={newsModalConfig.assignedToName}
      />

    </div>
  );
}
