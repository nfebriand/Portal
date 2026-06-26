import React, { useState, useMemo } from 'react';
import { 
  Target, 
  GitFork, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  FileText, 
  Award, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  User, 
  Building, 
  Users, 
  Layers, 
  Bookmark, 
  ShieldCheck, 
  ClipboardCheck, 
  FileCheck,
  Send,
  Printer
} from 'lucide-react';
import { Employee, InstitutionalIdentity, PerformanceAgreement, PerformanceIndicator, AppSettings, CriticalNotification } from '../types';
import SignaturePad from './SignaturePad';

interface PerformanceAgreementViewProps {
  employees: Employee[];
  identity: InstitutionalIdentity;
  settings: AppSettings;
  agreements: PerformanceAgreement[];
  onUpdateAgreements: (agreements: PerformanceAgreement[]) => void;
  onAddNotification?: (notification: CriticalNotification) => void;
}

export default function PerformanceAgreementView({
  employees,
  identity,
  settings,
  agreements,
  onUpdateAgreements,
  onAddNotification
}: PerformanceAgreementViewProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<'pohon' | 'dokumen'>('pohon');
  
  // For Document Tab selection
  const [selectedDocLevel, setSelectedDocLevel] = useState<string>('Kepala Stasiun');
  const [selectedDocEmployeeId, setSelectedDocEmployeeId] = useState<string>('');

  // For inline indicator addition
  const [editingAgreementId, setEditingAgreementId] = useState<string | null>(null);
  const [newIndicatorName, setNewIndicatorName] = useState('');
  const [newIndicatorTarget, setNewIndicatorTarget] = useState('');
  const [newIndicatorUnit, setNewIndicatorUnit] = useState('%');
  const [newIndicatorWeight, setNewIndicatorWeight] = useState(25);

  // For delegation modal / state
  const [delegatingIndicator, setDelegatingIndicator] = useState<{
    indicator: PerformanceIndicator;
    sourceAgreement: PerformanceAgreement;
  } | null>(null);
  
  const [delegateLevel, setDelegateLevel] = useState<string>('');
  const [delegateEmployeeId, setDelegateEmployeeId] = useState<string>('');
  const [delegatedIndicatorName, setDelegatedIndicatorName] = useState('');
  const [delegatedTarget, setDelegatedTarget] = useState('');
  const [delegatedUnit, setDelegatedUnit] = useState('%');
  const [delegatedWeight, setDelegatedWeight] = useState(25);

  // Expanded states in tree view
  const [expandedIndicators, setExpandedIndicators] = useState<Record<string, boolean>>({
    'ind-1': true,
    'ind-2': true,
    'ind-3': true
  });

  const toggleExpandIndicator = (id: string) => {
    setExpandedIndicators(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // List of Level 2 official levels
  const level2Options = [
    { value: 'Kabid Tata Usaha', label: `Kepala Bidang Tata Usaha (${identity.kepalaBidangNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Siaran', label: `Ketua Tim Siaran (${identity.ketuaTimSiaranNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Pemberitaan', label: `Ketua Tim Pemberitaan (${identity.ketuaTimPemberitaanNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Teknologi dan Media Baru', label: `Ketua Tim Teknologi dan Media Baru (${identity.ketuaTimTeknikNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Konten Media Baru', label: `Ketua Tim Konten Media Baru (${identity.ketuaTimKontenNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Layanan Pengembangan Usaha', label: `Ketua Tim Layanan Pengembangan Usaha (${identity.ketuaTimLayananNama || 'Belum Diatur'})` }
  ];

  // Helper to resolve name by level
  const resolveLevelName = (level: string, empId?: string): string => {
    if (level === 'Kepala Stasiun') return identity.kepalaStasiunNama || 'Kepala Stasiun';
    if (level === 'Kabid Tata Usaha') return identity.kepalaBidangNama || 'Kabid Tata Usaha';
    if (level === 'Ketua Tim Siaran') return identity.ketuaTimSiaranNama || 'Ketua Tim Siaran';
    if (level === 'Ketua Tim Pemberitaan') return identity.ketuaTimPemberitaanNama || 'Ketua Tim Pemberitaan';
    if (level === 'Ketua Tim Teknologi dan Media Baru') return identity.ketuaTimTeknikNama || 'Ketua Tim Teknologi & MB';
    if (level === 'Ketua Tim Konten Media Baru') return identity.ketuaTimKontenNama || 'Ketua Tim Konten MB';
    if (level === 'Ketua Tim Layanan Pengembangan Usaha') return identity.ketuaTimLayananNama || 'Ketua Tim Layanan PU';
    if (level === 'Pegawai' && empId) {
      const emp = employees.find(e => e.id === empId);
      return emp ? `${emp.gelarDepan ? emp.gelarDepan + ' ' : ''}${emp.nama}${emp.gelarBelakang ? ', ' + emp.gelarBelakang : ''}` : 'Pegawai';
    }
    return 'Belum ditugaskan';
  };

  // Helper to resolve level supervisor (pemberi delegasi)
  const getSupervisorLevel = (level: string) => {
    if (level === 'Kepala Stasiun') return 'Atasan Pusat';
    if (level === 'Pegawai') return 'Ketua Tim / Kabid';
    return 'Kepala Stasiun';
  };

  const getSupervisorName = (level: string, assignedToEmployeeId?: string) => {
    if (level === 'Kepala Stasiun') return 'Direktur Utama / Dewan Pengawas';
    if (level === 'Pegawai' && assignedToEmployeeId) {
      const emp = employees.find(e => e.id === assignedToEmployeeId);
      if (!emp) return 'Ketua Tim';
      // Find suitable team head based on division
      if (emp.divisi === 'Tata Usaha / Umum') return identity.kepalaBidangNama || 'Kabid Tata Usaha';
      if (emp.divisi === 'Pemberitaan') return identity.ketuaTimPemberitaanNama || 'Ketua Tim Pemberitaan';
      if (emp.divisi === 'Siaran') return identity.ketuaTimSiaranNama || 'Ketua Tim Siaran';
      if (emp.divisi === 'Teknologi dan Media Baru') return identity.ketuaTimTeknikNama || 'Ketua Tim Teknologi & MB';
      if (emp.divisi === 'Konten Media Baru') return identity.ketuaTimKontenNama || 'Ketua Tim Konten MB';
      if (emp.divisi === 'Layanan Pengembangan Usaha') return identity.ketuaTimLayananNama || 'Ketua Tim Layanan PU';
    }
    return identity.kepalaStasiunNama || 'Kepala Stasiun';
  };

  // Find or Create an agreement dynamically
  const getOrCreateAgreement = (level: string, empId?: string): PerformanceAgreement => {
    const existing = agreements.find(a => a.year === selectedYear && a.level === level && (level !== 'Pegawai' || a.assignedToEmployeeId === empId));
    if (existing) return existing;

    // Create a new blank one
    const newAg: PerformanceAgreement = {
      id: `pk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      year: selectedYear,
      level: level as any,
      assignedToEmployeeId: empId,
      assignedToName: resolveLevelName(level, empId),
      objectives: [],
      status: 'Draft',
      createdAt: new Date().toISOString()
    };

    // Auto append and trigger update (async simulation friendly)
    setTimeout(() => {
      onUpdateAgreements([...agreements, newAg]);
    }, 50);

    return newAg;
  };

  // Active agreement on Document Tab
  const activeDocumentAgreement = useMemo(() => {
    return getOrCreateAgreement(selectedDocLevel, selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined);
  }, [selectedDocLevel, selectedDocEmployeeId, agreements, selectedYear]);

  // Total Statistics
  const stats = useMemo(() => {
    let totalIndicators = 0;
    let sumAchievement = 0;
    let activePks = 0;

    agreements.filter(a => a.year === selectedYear).forEach(a => {
      if (a.status === 'Aktif') activePks++;
      a.objectives.forEach(obj => {
        totalIndicators++;
        // Calculate achievement percentage (realisasi / target * 100, capped at 120%)
        const targetVal = parseFloat(obj.target) || 100;
        const real = obj.achievement || 0;
        const score = Math.min(120, Math.round((real / targetVal) * 100));
        sumAchievement += score;
      });
    });

    const avgAchievement = totalIndicators > 0 ? Math.round(sumAchievement / totalIndicators) : 0;

    return {
      totalIndicators,
      avgAchievement,
      activePks,
      totalPks: agreements.filter(a => a.year === selectedYear).length
    };
  }, [agreements, selectedYear]);

  // Cascading tree indexing
  const treeData = useMemo(() => {
    const yearAgs = agreements.filter(a => a.year === selectedYear);
    const kepalaStasiunAg = yearAgs.find(a => a.level === 'Kepala Stasiun');
    
    if (!kepalaStasiunAg) return [];

    return kepalaStasiunAg.objectives.map(rootObj => {
      // Find level 2 indicators linked to this root
      const level2Objects: Array<{
        indicator: PerformanceIndicator;
        agreement: PerformanceAgreement;
        children: Array<{
          indicator: PerformanceIndicator;
          agreement: PerformanceAgreement;
        }>;
      }> = [];

      yearAgs.forEach(ag => {
        if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
          ag.objectives.forEach(obj => {
            if (obj.parentIndicatorId === rootObj.id) {
              // Find level 3 indicators linked to this level 2 indicator
              const children: Array<{
                indicator: PerformanceIndicator;
                agreement: PerformanceAgreement;
              }> = [];

              yearAgs.forEach(pPeg => {
                if (pPeg.level === 'Pegawai') {
                  pPeg.objectives.forEach(pegObj => {
                    if (pegObj.parentIndicatorId === obj.id) {
                      children.push({ indicator: pegObj, agreement: pPeg });
                    }
                  });
                }
              });

              level2Objects.push({
                indicator: obj,
                agreement: ag,
                children
              });
            }
          });
        }
      });

      return {
        root: rootObj,
        agreement: kepalaStasiunAg,
        level2: level2Objects
      };
    });
  }, [agreements, selectedYear]);

  // Handle adding a performance indicator to an agreement
  const handleAddIndicator = (agreementId: string) => {
    if (!newIndicatorName || !newIndicatorTarget) return;

    const newObj: PerformanceIndicator = {
      id: `ind-${Date.now()}`,
      indicatorName: newIndicatorName,
      target: newIndicatorTarget,
      unit: newIndicatorUnit,
      weight: newIndicatorWeight,
      achievement: 0
    };

    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: [...ag.objectives, newObj]
        };
      }
      return ag;
    });

    onUpdateAgreements(updated);
    setNewIndicatorName('');
    setNewIndicatorTarget('');
    setNewIndicatorUnit('%');
    setNewIndicatorWeight(25);
    setEditingAgreementId(null);
  };

  // Handle deleting an indicator
  const handleDeleteIndicator = (agreementId: string, indicatorId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus indikator sasaran kinerja ini?")) return;

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

  // Handle updating achievement
  const handleUpdateAchievement = (agreementId: string, indicatorId: string, value: number) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, achievement: value } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Open delegation popup
  const openDelegation = (indicator: PerformanceIndicator, sourceAgreement: PerformanceAgreement) => {
    setDelegatingIndicator({ indicator, sourceAgreement });
    
    // Auto preset values
    setDelegatedIndicatorName(`Dukungan Pencapaian: ${indicator.indicatorName}`);
    setDelegatedTarget('');
    setDelegatedUnit(indicator.unit);
    setDelegatedWeight(25);
    
    // Set appropriate delegation level options
    if (sourceAgreement.level === 'Kepala Stasiun') {
      setDelegateLevel('Kabid Tata Usaha');
      setDelegateEmployeeId('');
    } else {
      setDelegateLevel('Pegawai');
      // pre-select first employee
      const subDeps = employees.filter(e => {
        // filter by matching division
        if (sourceAgreement.level === 'Kabid Tata Usaha') return e.divisi === 'Tata Usaha / Umum';
        if (sourceAgreement.level === 'Ketua Tim Siaran') return e.divisi === 'Siaran';
        if (sourceAgreement.level === 'Ketua Tim Pemberitaan') return e.divisi === 'Pemberitaan';
        if (sourceAgreement.level === 'Ketua Tim Teknologi dan Media Baru') return e.divisi === 'Teknologi dan Media Baru';
        if (sourceAgreement.level === 'Ketua Tim Konten Media Baru') return e.divisi === 'Konten Media Baru';
        if (sourceAgreement.level === 'Ketua Tim Layanan Pengembangan Usaha') return e.divisi === 'Layanan Pengembangan Usaha';
        return true;
      });
      setDelegateEmployeeId(subDeps[0]?.id || '');
    }
  };

  // Submit delegation
  const submitDelegation = () => {
    if (!delegatingIndicator || !delegatedIndicatorName || !delegatedTarget) return;

    // Get or Create targeted agreement
    const targetAg = getOrCreateAgreement(delegateLevel, delegateLevel === 'Pegawai' ? delegateEmployeeId : undefined);

    const newDelegatedIndicator: PerformanceIndicator = {
      id: `ind-${Date.now()}`,
      indicatorName: delegatedIndicatorName,
      target: delegatedTarget,
      unit: delegatedUnit,
      weight: delegatedWeight,
      achievement: 0,
      parentIndicatorId: delegatingIndicator.indicator.id // CRITICAL for cascade tracing!
    };

    // Update target agreement
    const updated = agreements.map(ag => {
      if (ag.id === targetAg.id) {
        return {
          ...ag,
          objectives: [...ag.objectives, newDelegatedIndicator]
        };
      }
      return ag;
    });

    onUpdateAgreements(updated);

    // Trigger critical notification for subordinate
    if (onAddNotification) {
      onAddNotification({
        id: `notif-pk-delegation-${Date.now()}`,
        title: "Pendelegasian Sasaran Baru",
        message: `Sasaran Kinerja "${delegatedIndicatorName}" (Target: ${delegatedTarget} ${delegatedUnit}) telah didelegasikan kepada ${targetAg.assignedToName || delegateLevel}. Harap segera laksanakan tindak lanjut.`,
        type: "warning",
        timestamp: new Date().toISOString(),
        isRead: false,
        metricName: "IKU Terkait",
        metricValue: delegatingIndicator.indicator.indicatorName
      });
    }
    
    // Trigger quick visual notification for beautiful feedback
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

    // Close delegation state
    setDelegatingIndicator(null);
  };

  // Sign document
  const handleSignDocument = (agreementId: string, role: 'pembuat' | 'penerima', dataUrl: string) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        const signField = role === 'pembuat' ? 'signaturePembuat' : 'signaturePenerima';
        const isSignedBoth = (role === 'pembuat' && ag.signaturePenerima) || (role === 'penerima' && ag.signaturePembuat);
        
        return {
          ...ag,
          [signField]: dataUrl,
          status: isSignedBoth ? 'Aktif' : ag.status
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Quick Action to activate/approve
  const handleApproveDocument = (agreementId: string) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          status: 'Aktif' as const
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-indigo-500/30">
               cascading system 
            </span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 font-mono">STANDAR PERPRES 8/2021</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Perjanjian Kinerja & Cascading Sasaran</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Penyusunan target kinerja berjenjang dari Kepala Stasiun Radio, didelegasikan kepada Ketua Tim dan Kepala Bidang, hingga ke tingkat capaian sasaran kinerja Pegawai.
          </p>
        </div>

        {/* Year & Navigation Selector */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-950/40 p-2 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Tahun Dokumen:</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-indigo-400 font-extrabold text-xs focus:outline-hidden"
            >
              <option value={2026} className="bg-slate-900 text-white">2026 (Aktif)</option>
              <option value={2027} className="bg-slate-900 text-white">2027</option>
            </select>
          </div>
          
          <div className="h-5 w-px bg-slate-800" />

          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('pohon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'pohon' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pohon Kinerja
            </button>
            <button
              onClick={() => setActiveTab('dokumen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'dokumen' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dokumen PK
            </button>
          </div>
        </div>
      </div>

      {/* Statistical metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">Total Indikator</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">{stats.totalIndicators} Sasaran</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">Rata-Rata Capaian</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">{stats.avgAchievement}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">PK Aktif / Total</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">{stats.activePks} / {stats.totalPks}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">Status Kaskade</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">Terintegrasi</p>
          </div>
        </div>
      </div>

      {/* Main Tab Content Workspace */}
      {activeTab === 'pohon' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-indigo-500" />
                Silsilah Cascading Sasaran Kinerja (Pohon Kinerja)
              </h3>
              <p className="text-[11px] text-slate-400">Peta penyelarasan indikator kinerja dari Kepala Stasiun turun langsung ke tim hingga individu pegawai.</p>
            </div>
            
            <button
              onClick={() => {
                const kepStasiunAg = getOrCreateAgreement('Kepala Stasiun');
                setEditingAgreementId(kepStasiunAg.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors self-start"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Sasaran Kepala Stasiun
            </button>
          </div>

          {/* Root Level 1 Tree Nodes */}
          <div className="space-y-4">
            {treeData.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 italic">Belum ada sasaran Kepala Stasiun yang diatur.</p>
                <button
                  onClick={() => {
                    const kepStasiunAg = getOrCreateAgreement('Kepala Stasiun');
                    setEditingAgreementId(kepStasiunAg.id);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat Perjanjian Kinerja
                </button>
              </div>
            ) : (
              treeData.map((node, idx) => {
                const rootId = node.root.id;
                const isExpanded = !!expandedIndicators[rootId];
                
                // Calculate score
                const rootTargetVal = parseFloat(node.root.target) || 100;
                const rootReal = node.root.achievement || 0;
                const rootScore = Math.min(120, Math.round((rootReal / rootTargetVal) * 100));

                return (
                  <div key={rootId} className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                    
                    {/* Header - Kepala Stasiun Level 1 Objective */}
                    <div className="bg-slate-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                      
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button 
                          onClick={() => toggleExpandIndicator(rootId)}
                          className="mt-0.5 p-1 hover:bg-slate-200 text-slate-500 rounded-lg shrink-0 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black uppercase rounded-md border border-purple-200">
                              LEVEL 1 • KEPALA STASIUN
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {rootId}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 leading-normal">{node.root.indicatorName}</h4>
                          <p className="text-[10px] text-slate-400">Penanggung Jawab: <span className="font-bold text-slate-600">{node.agreement.assignedToName}</span></p>
                        </div>
                      </div>

                      {/* Right Metrics / Actions */}
                      <div className="flex items-center flex-wrap gap-4 text-xs">
                        <div className="bg-white border border-slate-200/60 rounded-xl px-2.5 py-1">
                          <span className="text-[9px] text-slate-400 block font-mono">TARGET</span>
                          <span className="font-extrabold text-slate-700">{node.root.target} {node.root.unit}</span>
                        </div>

                        <div className="bg-white border border-slate-200/60 rounded-xl px-2.5 py-1">
                          <span className="text-[9px] text-slate-400 block font-mono">REALISASI</span>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number"
                              value={node.root.achievement}
                              onChange={(e) => handleUpdateAchievement(node.agreement.id, rootId, parseFloat(e.target.value) || 0)}
                              className="w-12 bg-slate-50 border border-slate-200 rounded px-1 text-center font-bold text-slate-800 text-[11px] focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                            />
                            <span className="text-[10px] text-slate-400">{node.root.unit}</span>
                          </div>
                        </div>

                        {/* Progress Ring or Bar representation */}
                        <div className="text-center min-w-[50px]">
                          <span className="text-[9px] text-slate-400 block font-mono">CAPAIAN</span>
                          <span className={`font-black text-xs ${
                            rootScore >= 100 ? 'text-emerald-600' : rootScore >= 75 ? 'text-blue-600' : 'text-amber-500'
                          }`}>{rootScore}%</span>
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                          <button
                            onClick={() => openDelegation(node.root, node.agreement)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg transition-colors uppercase tracking-wide"
                            title="Delegasikan target ini kepada Kepala Bidang atau Ketua Tim"
                          >
                            <Send className="w-3 h-3" /> Delegasikan
                          </button>
                          <button
                            onClick={() => handleDeleteIndicator(node.agreement.id, rootId)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Children Cascading Section (Level 2 & 3) */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50/20 divide-y divide-slate-100">
                        {node.level2.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 italic text-[11px] bg-white rounded-xl border border-dashed border-slate-100">
                            Belum ada delegasi ke level 2 (Kabid/Ketua Tim). Klik tombol "Delegasikan" untuk memecah target ini.
                          </div>
                        ) : (
                          node.level2.map((l2) => {
                            const l2Id = l2.indicator.id;
                            const isL2Expanded = !!expandedIndicators[l2Id];
                            const l2TargetVal = parseFloat(l2.indicator.target) || 100;
                            const l2Real = l2.indicator.achievement || 0;
                            const l2Score = Math.min(120, Math.round((l2Real / l2TargetVal) * 100));

                            return (
                              <div key={l2Id} className="py-3.5 pl-6 pr-2">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-150/60 shadow-xs relative">
                                  
                                  {/* Visual cascade trace line */}
                                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-indigo-200" />
                                  <div className="absolute -left-6 top-0 bottom-1/2 w-px bg-indigo-200" />

                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <button 
                                      onClick={() => toggleExpandIndicator(l2Id)}
                                      className="mt-0.5 p-0.5 hover:bg-slate-100 text-slate-400 rounded-md shrink-0"
                                    >
                                      {isL2Expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>

                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-extrabold uppercase rounded border border-blue-200">
                                          LEVEL 2 • {l2.agreement.level.toUpperCase()}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-mono">Parent ID: {l2.indicator.parentIndicatorId}</span>
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-700 leading-normal">{l2.indicator.indicatorName}</h5>
                                      <p className="text-[10px] text-slate-400">Penerima Delegasi: <span className="font-extrabold text-indigo-600">{l2.agreement.assignedToName}</span></p>
                                    </div>
                                  </div>

                                  {/* Right values */}
                                  <div className="flex items-center flex-wrap gap-3 text-xs">
                                    <div className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">TARGET</span>
                                      <span className="font-extrabold text-slate-700 text-[11px]">{l2.indicator.target} {l2.indicator.unit}</span>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">REALISASI</span>
                                      <div className="flex items-center gap-1">
                                        <input 
                                          type="number"
                                          value={l2.indicator.achievement}
                                          onChange={(e) => handleUpdateAchievement(l2.agreement.id, l2Id, parseFloat(e.target.value) || 0)}
                                          className="w-11 bg-white border border-slate-200 rounded px-1 py-0 text-center font-bold text-slate-800 text-[10px] focus:outline-hidden"
                                        />
                                      </div>
                                    </div>

                                    <div className="text-center min-w-[40px]">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">CAPAIAN</span>
                                      <span className={`font-bold text-[11px] ${
                                        l2Score >= 100 ? 'text-emerald-600' : 'text-indigo-600'
                                      }`}>{l2Score}%</span>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-slate-150 pl-3">
                                      <button
                                        onClick={() => openDelegation(l2.indicator, l2.agreement)}
                                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-md uppercase tracking-wide transition-colors"
                                        title="Delegasikan target ini kepada Staf Pegawai pelaksana langsung"
                                      >
                                        <Send className="w-2.5 h-2.5" /> Delegasi Staf
                                      </button>
                                      <button
                                        onClick={() => handleDeleteIndicator(l2.agreement.id, l2Id)}
                                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-md"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                </div>

                                {/* Level 3 - Pegawai Individual Target */}
                                {isL2Expanded && (
                                  <div className="mt-2 space-y-2 pl-8 border-l border-dashed border-indigo-200">
                                    {l2.children.length === 0 ? (
                                      <div className="py-3 text-center text-slate-400 italic text-[10px] bg-white rounded-lg border border-slate-100">
                                        Belum ada delegasi ke staf pegawai pelaksana langsung.
                                      </div>
                                    ) : (
                                      l2.children.map((l3) => {
                                        const l3Id = l3.indicator.id;
                                        const l3TargetVal = parseFloat(l3.indicator.target) || 100;
                                        const l3Real = l3.indicator.achievement || 0;
                                        const l3Score = Math.min(120, Math.round((l3Real / l3TargetVal) * 100));

                                        return (
                                          <div key={l3Id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50 text-xs relative">
                                            
                                            {/* Visual cascade horizontal connector */}
                                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-px bg-indigo-100 border-dashed border-t" />

                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-1">
                                                <span className="px-1 py-0.2 bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase rounded">
                                                  LEVEL 3 • SASARAN PEGAWAI
                                                </span>
                                                <span className="text-[8px] text-slate-400 font-mono">Parent: {l3.indicator.parentIndicatorId}</span>
                                              </div>
                                              <h6 className="font-semibold text-slate-700">{l3.indicator.indicatorName}</h6>
                                              <p className="text-[10px] text-slate-400">Pegawai Pelaksana: <span className="font-extrabold text-emerald-600">{l3.agreement.assignedToName}</span></p>
                                            </div>

                                            {/* Level 3 right values */}
                                            <div className="flex items-center gap-3">
                                              <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">TARGET</span>
                                                <span className="font-bold text-slate-600 text-[10px]">{l3.indicator.target} {l3.indicator.unit}</span>
                                              </div>

                                              <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">REALISASI</span>
                                                <input 
                                                  type="number"
                                                  value={l3.indicator.achievement}
                                                  onChange={(e) => handleUpdateAchievement(l3.agreement.id, l3Id, parseFloat(e.target.value) || 0)}
                                                  className="w-10 bg-slate-50 border border-slate-200 rounded px-1 py-0 text-center font-bold text-slate-800 text-[9px] focus:outline-hidden"
                                                />
                                              </div>

                                              <div className="text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">CAPAIAN</span>
                                                <span className="font-black text-emerald-600 text-[10px]">{l3Score}%</span>
                                              </div>

                                              <button
                                                onClick={() => handleDeleteIndicator(l3.agreement.id, l3Id)}
                                                className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>

                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}

                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
        
        // Document Tab
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Document Picker sidebar */}
          <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-4 h-fit">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Navigasi Dokumen PK</h3>
              <p className="text-[10px] text-slate-400">Pilih pejabat atau staf pegawai pelaksana untuk melihat, mengedit sasaran, dan menandatangani dokumen e-PK resmi.</p>
            </div>

            <div className="space-y-3">
              
              {/* Level 1 Button */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Pimpinan Stasiun</span>
                <button
                  onClick={() => { setSelectedDocLevel('Kepala Stasiun'); setSelectedDocEmployeeId(''); }}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5 ${
                    selectedDocLevel === 'Kepala Stasiun' 
                      ? 'bg-purple-50 text-purple-900 border-purple-200 ring-1 ring-purple-100' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-extrabold">Kepala Stasiun Radio</p>
                    <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5 truncate">{identity.kepalaStasiunNama}</p>
                  </div>
                </button>
              </div>

              {/* Level 2 Buttons */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Para Ketua Tim / Kabid TU</span>
                <div className="space-y-1">
                  {level2Options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedDocLevel(opt.value); setSelectedDocEmployeeId(''); }}
                      className={`w-full text-left p-2.5 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-2 ${
                        selectedDocLevel === opt.value 
                          ? 'bg-blue-50 text-blue-900 border-blue-200 ring-1 ring-blue-100' 
                          : 'bg-white text-slate-600 border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <p className="truncate">{opt.value}</p>
                        <p className="text-[9px] text-slate-500 font-mono leading-none mt-0.5 truncate">
                          {opt.value === 'Kabid Tata Usaha' ? identity.kepalaBidangNama :
                           opt.value === 'Ketua Tim Siaran' ? identity.ketuaTimSiaranNama :
                           opt.value === 'Ketua Tim Pemberitaan' ? identity.ketuaTimPemberitaanNama :
                           opt.value === 'Ketua Tim Teknologi dan Media Baru' ? identity.ketuaTimTeknikNama :
                           opt.value === 'Ketua Tim Konten Media Baru' ? identity.ketuaTimKontenNama :
                           opt.value === 'Ketua Tim Layanan Pengembangan Usaha' ? identity.ketuaTimLayananNama : 'Belum Atur'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Level 3 Staf Pegawai */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Staf Pegawai (Capaian Kinerja)</span>
                {employees.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Belum ada data pegawai.</p>
                ) : (
                  <select
                    value={selectedDocEmployeeId}
                    onChange={(e) => { setSelectedDocLevel('Pegawai'); setSelectedDocEmployeeId(e.target.value); }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Staf Pegawai --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nama} ({emp.divisi})
                      </option>
                    ))}
                  </select>
                )}
              </div>

            </div>
          </div>

          {/* Document sheet container */}
          <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* Quick Action bar above document */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-extrabold text-slate-700">Status Dokumen:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  activeDocumentAgreement.status === 'Aktif' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {activeDocumentAgreement.status}
                </span>
              </div>

              <div className="flex gap-2">
                {activeDocumentAgreement.status === 'Draft' && (
                  <button
                    onClick={() => handleApproveDocument(activeDocumentAgreement.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl transition-colors uppercase tracking-wide shadow-xs"
                  >
                    Setujui & Aktifkan
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black rounded-xl transition-all uppercase tracking-wide flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak PK
                </button>
              </div>
            </div>

            {/* Print Area - Formal Legal Document style */}
            <div className="border border-slate-300 p-8 md:p-12 bg-white text-slate-900 shadow-inner rounded-xl space-y-6 font-serif max-w-2xl mx-auto printable-document">
              
              {/* Formal Letter Head (Kop Surat) */}
              <div className="text-center border-b-4 border-double border-slate-900 pb-4 relative space-y-1">
                <div className="absolute left-0 top-0 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs border border-slate-200 select-none">
                  LOGO
                </div>
                <h3 className="text-base font-black uppercase tracking-wide leading-tight">KEMENTERIAN KOMUNIKASI DAN INFORMATIKA</h3>
                <h4 className="text-sm font-black uppercase tracking-tight leading-tight">DIREKTORAT JENDERAL PENYIARAN</h4>
                <h2 className="text-md font-bold uppercase tracking-wider leading-none">{settings.namaInstansi.toUpperCase()}</h2>
                <p className="text-[9px] font-mono leading-none text-slate-500 not-italic">{settings.alamat} • Telp: {settings.noTelp}</p>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1 pt-2 font-serif">
                <h1 className="text-md font-black underline uppercase tracking-wider">PERJANJIAN KINERJA TAHUN {selectedYear}</h1>
                <p className="text-[10px] italic">Nomor: SPK/ST-RADIO/{selectedYear}/{activeDocumentAgreement.id.slice(-4).toUpperCase()}</p>
              </div>

              {/* Parties Intro Statement */}
              <div className="text-xs leading-relaxed space-y-3 font-serif">
                <p>Dalam rangka mewujudkan manajemen pemerintahan yang efektif, transparan, dan akuntabel serta berorientasi pada hasil, kami yang bertandatangan di bawah ini:</p>
                
                <div className="space-y-1.5 pl-4">
                  <div className="flex">
                    <span className="w-24 font-bold">Nama</span>
                    <span className="mr-2">:</span>
                    <span className="font-extrabold underline">{getSupervisorName(activeDocumentAgreement.level, activeDocumentAgreement.assignedToEmployeeId)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold">Jabatan</span>
                    <span className="mr-2">:</span>
                    <span>{getSupervisorLevel(activeDocumentAgreement.level)}</span>
                  </div>
                  <p className="italic text-[10px] text-slate-500">Selanjutnya disebut sebagai <span className="font-bold">PIHAK PERTAMA (Atasan Langsung)</span></p>
                </div>

                <div className="space-y-1.5 pl-4 pt-1">
                  <div className="flex">
                    <span className="w-24 font-bold">Nama</span>
                    <span className="mr-2">:</span>
                    <span className="font-extrabold underline">{activeDocumentAgreement.assignedToName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold">Jabatan</span>
                    <span className="mr-2">:</span>
                    <span>{activeDocumentAgreement.level}</span>
                  </div>
                  <p className="italic text-[10px] text-slate-500">Selanjutnya disebut sebagai <span className="font-bold">PIHAK KEDUA (Penerima Tugas)</span></p>
                </div>

                <p>PIHAK PERTAMA berjanji akan memberikan supervisi dan dukungan yang diperlukan. PIHAK KEDUA berjanji akan mewujudkan target kinerja yang ditetapkan dalam lampiran perjanjian ini.</p>
              </div>

              {/* Target Objectives Table */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider font-sans">Lampiran Sasaran & Indikator Kinerja Utama:</p>
                
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-[10px] font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 text-[9px] font-extrabold uppercase">
                        <th className="p-2 border-r border-slate-800 text-center w-8">No</th>
                        <th className="p-2 border-r border-slate-800">Sasaran / Indikator Kinerja Utama</th>
                        <th className="p-2 border-r border-slate-800 text-center w-20">Target</th>
                        <th className="p-2 text-center w-16">Bobot (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {activeDocumentAgreement.objectives.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 italic">Belum ada indikator sasaran yang terdaftar untuk dokumen ini.</td>
                        </tr>
                      ) : (
                        activeDocumentAgreement.objectives.map((obj, i) => (
                          <tr key={obj.id} className="hover:bg-slate-50/50">
                            <td className="p-2 border-r border-slate-800 text-center font-mono font-bold">{i + 1}</td>
                            <td className="p-2 border-r border-slate-800">
                              <p className="font-bold text-slate-800">{obj.indicatorName}</p>
                              {obj.parentIndicatorId && (
                                <span className="text-[8px] px-1 py-0.1 bg-indigo-50 text-indigo-600 rounded font-bold uppercase tracking-wider">Kaskade</span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-800 text-center font-extrabold">{obj.target} {obj.unit}</td>
                            <td className="p-2 text-center font-bold font-mono">{obj.weight}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dual Electronic Signatures Block */}
              <div className="pt-6 font-serif">
                <div className="grid grid-cols-2 gap-4 text-center text-xs">
                  
                  {/* Pihak Pertama (Atasan) */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold block">PIHAK PERTAMA</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold leading-none block mt-0.5">{getSupervisorLevel(activeDocumentAgreement.level)}</span>
                    
                    <div className="h-16 flex items-center justify-center my-2 border border-dashed border-slate-200 rounded-lg w-full bg-slate-50/50">
                      {activeDocumentAgreement.signaturePembuat ? (
                        <img src={activeDocumentAgreement.signaturePembuat} alt="Signature Pembuat" className="max-h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="p-2 w-full">
                          <SignaturePad
                            value=""
                            onChange={(dataUrl) => handleSignDocument(activeDocumentAgreement.id, 'pembuat', dataUrl)}
                            height={60}
                            label="Teken e-Signature Atasan"
                          />
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold underline block">{getSupervisorName(activeDocumentAgreement.level, activeDocumentAgreement.assignedToEmployeeId)}</span>
                    <span className="text-[9px] text-slate-400 font-mono">NIP. 197805122003111002</span>
                  </div>

                  {/* Pihak Kedua (Pegawai / Penerima) */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold block">PIHAK KEDUA</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold leading-none block mt-0.5">{activeDocumentAgreement.level}</span>
                    
                    <div className="h-16 flex items-center justify-center my-2 border border-dashed border-slate-200 rounded-lg w-full bg-slate-50/50">
                      {activeDocumentAgreement.signaturePenerima ? (
                        <img src={activeDocumentAgreement.signaturePenerima} alt="Signature Penerima" className="max-h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="p-2 w-full">
                          <SignaturePad
                            value=""
                            onChange={(dataUrl) => handleSignDocument(activeDocumentAgreement.id, 'penerima', dataUrl)}
                            height={60}
                            label="Teken e-Signature Pihak Kedua"
                          />
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold underline block">{activeDocumentAgreement.assignedToName}</span>
                    <span className="text-[9px] text-slate-400 font-mono">NIP. 198905222013111001</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Inline Quick Form to Edit Agreement Objectives directly on document view */}
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Kelola Indikator Dokumen Ini Secara Cepat
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Indikator Kinerja Utama (IKU)</label>
                  <input
                    type="text"
                    value={newIndicatorName}
                    onChange={(e) => setNewIndicatorName(e.target.value)}
                    placeholder="Contoh: Indeks Pemirsa Berita TV/Radio"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Target</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newIndicatorTarget}
                      onChange={(e) => setNewIndicatorTarget(e.target.value)}
                      placeholder="95"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-bold text-center focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={newIndicatorUnit}
                      onChange={(e) => setNewIndicatorUnit(e.target.value)}
                      placeholder="%"
                      className="w-12 bg-white border border-slate-200 rounded-lg px-1 py-1.5 text-xs text-slate-700 font-bold text-center focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Bobot</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newIndicatorWeight}
                      onChange={(e) => setNewIndicatorWeight(parseInt(e.target.value) || 25)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-bold text-center focus:outline-hidden"
                    />
                    <button
                      onClick={() => handleAddIndicator(activeDocumentAgreement.id)}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Delegation Modal Overlay */}
      {delegatingIndicator && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Delegasikan Sasaran (Cascading)</h3>
                  <p className="text-[10px] text-slate-400">Turunkan dan kaskadekan indikator kinerja ke level bawahan.</p>
                </div>
              </div>
              <button 
                onClick={() => setDelegatingIndicator(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source target summary card */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block">Indikator Kinerja Sumber (Atasan):</span>
              <p className="text-xs font-bold text-slate-800 leading-normal">{delegatingIndicator.indicator.indicatorName}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                <span>Target Atasan: <span className="font-bold text-slate-700">{delegatingIndicator.indicator.target} {delegatingIndicator.indicator.unit}</span></span>
                <span>•</span>
                <span>Didelegasikan oleh: <span className="font-bold text-slate-700">{delegatingIndicator.sourceAgreement.assignedToName}</span></span>
              </div>
            </div>

            {/* Delegation inputs */}
            <div className="space-y-4">
              
              {/* Select Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Level selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Level Jabatan Bawahan</label>
                  {delegatingIndicator.sourceAgreement.level === 'Kepala Stasiun' ? (
                    <select
                      value={delegateLevel}
                      onChange={(e) => {
                        setDelegateLevel(e.target.value);
                        setDelegateEmployeeId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                    >
                      {level2Options.map(o => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value="Pegawai Staf" 
                      disabled 
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-400"
                    />
                  )}
                </div>

                {/* Specific Employee selection (only active for Pegawai level) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Pejabat / Staf Pegawai Penerima</label>
                  {delegateLevel === 'Pegawai' || delegatingIndicator.sourceAgreement.level !== 'Kepala Stasiun' ? (
                    <select
                      value={delegateEmployeeId}
                      onChange={(e) => setDelegateEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="">-- Pilih Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nama} ({emp.divisi})</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={resolveLevelName(delegateLevel)}
                      disabled 
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500"
                    />
                  )}
                </div>

              </div>

              {/* Delegated target name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Indikator Hasil Delegasi (Sasaran Kinerja Baru)</label>
                <textarea
                  value={delegatedIndicatorName}
                  onChange={(e) => setDelegatedIndicatorName(e.target.value)}
                  placeholder="Deskripsikan kontribusi spesifik atau sub-target dari bawahan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400 h-16 resize-none"
                />
              </div>

              {/* Delegated target and unit */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Target Kinerja</label>
                  <input
                    type="text"
                    value={delegatedTarget}
                    onChange={(e) => setDelegatedTarget(e.target.value)}
                    placeholder="Contoh: 90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Satuan Ukur</label>
                  <input
                    type="text"
                    value={delegatedUnit}
                    onChange={(e) => setDelegatedUnit(e.target.value)}
                    placeholder="Contoh: Laporan / %"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Bobot (%)</label>
                  <input
                    type="number"
                    value={delegatedWeight}
                    onChange={(e) => setDelegatedWeight(parseInt(e.target.value) || 25)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

            </div>

            {/* Modal actions */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setDelegatingIndicator(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              
              <button
                onClick={submitDelegation}
                disabled={!delegatedIndicatorName || !delegatedTarget || (delegateLevel === 'Pegawai' && !delegateEmployeeId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Kirim Delegasi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
