import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  PerformanceAgreement, 
  PerformanceIndicator, 
  InstitutionalIdentity, 
  AppSettings 
} from '../types';
import { 
  Check, 
  Save, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface InputCapaianPKViewProps {
  currentUser: { 
    id: string; 
    name: string; 
    role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; 
    division?: string; 
    photo?: string; 
  };
  employees: Employee[];
  agreements: PerformanceAgreement[];
  identity: InstitutionalIdentity;
  settings: AppSettings;
  onUpdateAgreements: (updated: PerformanceAgreement[]) => void;
  onAddNotification?: (notif: any) => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function InputCapaianPKView({
  currentUser,
  employees,
  agreements,
  identity,
  settings,
  onUpdateAgreements,
  onAddNotification
}: InputCapaianPKViewProps) {
  // Determine division-level options
  const level2Options = useMemo(() => [
    { value: 'Kabid Tata Usaha', label: `Kepala Bagian Tata Usaha (${identity.kepalaBidangNama || 'Belum Diatur'})`, division: 'Tata Usaha / Umum' },
    { value: 'Ketua Tim Siaran', label: `Ketua Tim Siaran (${identity.ketuaTimSiaranNama || 'Belum Diatur'})`, division: 'Siaran' },
    { value: 'Ketua Tim Pemberitaan', label: `Ketua Tim Pemberitaan (${identity.ketuaTimPemberitaanNama || 'Belum Diatur'})`, division: 'Pemberitaan' },
    { value: 'Ketua Tim Teknologi dan Media Baru', label: `Ketua Tim Teknologi dan Media Baru (${identity.ketuaTimTeknikNama || 'Belum Diatur'})`, division: 'Teknologi dan Media Baru' },
    { value: 'Ketua Tim Konten Media Baru', label: `Ketua Tim Konten Media Baru (${identity.ketuaTimKontenNama || 'Belum Diatur'})`, division: 'Konten Media Baru' },
    { value: 'Ketua Tim Layanan Pengembangan Usaha', label: `Ketua Tim Layanan Pengembangan Usaha (${identity.ketuaTimLayananNama || 'Belum Diatur'})`, division: 'Layanan Pengembangan Usaha' }
  ], [identity]);

  // Determine user's active level based on division
  const defaultLevel = useMemo(() => {
    if (currentUser.role === 'Superadmin' || currentUser.role === 'Kepala') {
      return 'Ketua Tim Pemberitaan'; // Default for admin view
    }
    
    // Match based on division
    const div = currentUser.division || '';
    const matched = level2Options.find(opt => 
      opt.division.toLowerCase().includes(div.toLowerCase()) || 
      div.toLowerCase().includes(opt.division.toLowerCase()) ||
      (div.toLowerCase().includes('teknik') && opt.value.toLowerCase().includes('teknologi'))
    );
    
    return matched ? matched.value : 'Ketua Tim Pemberitaan';
  }, [currentUser, level2Options]);

  const [selectedLevel, setSelectedLevel] = useState<string>(defaultLevel);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Temporary local state for draft edits to avoid updating database on every keystroke
  // Formatted as { [indicatorId]: number[] }
  const [localAchievements, setLocalAchievements] = useState<{ [key: string]: number[] }>({});
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);

  // Find agreement for the selected level
  const activeAgreement = useMemo(() => {
    return agreements.find(ag => ag.level === selectedLevel);
  }, [agreements, selectedLevel]);

  // Initialize local achievements from agreement objectives
  React.useEffect(() => {
    if (activeAgreement) {
      const initial: { [key: string]: number[] } = {};
      activeAgreement.objectives.forEach(obj => {
        if (Array.isArray(obj.monthlyAchievements) && obj.monthlyAchievements.length === 12) {
          initial[obj.id] = [...obj.monthlyAchievements];
        } else {
          initial[obj.id] = Array(12).fill(obj.achievement / 12 || 0);
        }
      });
      setLocalAchievements(initial);
      if (activeAgreement.objectives.length > 0) {
        setActiveObjectiveId(activeAgreement.objectives[0].id);
      }
    } else {
      setLocalAchievements({});
      setActiveObjectiveId(null);
    }
  }, [activeAgreement]);

  // Handle local change of achievements
  const handleLocalChange = (objId: string, monthIdx: number, valStr: string) => {
    // allow empty string or numeric
    const parsed = valStr === '' ? 0 : parseFloat(valStr);
    const cleanVal = isNaN(parsed) ? 0 : parsed;

    setLocalAchievements(prev => {
      const current = prev[objId] ? [...prev[objId]] : Array(12).fill(0);
      current[monthIdx] = cleanVal;
      return {
        ...prev,
        [objId]: current
      };
    });
  };

  // Helper to copy target trajectory values directly into monthly achievements
  const handleCopyTargetTrajectory = (obj: PerformanceIndicator) => {
    if (Array.isArray(obj.trajectory) && obj.trajectory.length === 12) {
      setLocalAchievements(prev => ({
        ...prev,
        [obj.id]: [...(obj.trajectory || [])]
      }));
    }
  };

  // Helper to save all local achievements back to agreements
  const handleSaveAll = () => {
    if (!activeAgreement) return;

    const updatedAgreements = agreements.map(ag => {
      if (ag.id === activeAgreement.id) {
        return {
          ...ag,
          objectives: ag.objectives.map(obj => {
            const currentAchievements = localAchievements[obj.id] || Array(12).fill(0);
            
            // Recalculate annual value
            const type = obj.trajectoryType || (
              obj.unit === '%' || 
              obj.indicatorName.toLowerCase().includes('ikpa') || 
              obj.indicatorName.toLowerCase().includes('nilai') 
                ? 'constant' 
                : 'cumulative'
            );
            
            let annualAchievement = 0;
            if (type === 'constant') {
              annualAchievement = currentAchievements.reduce((sum, v) => sum + v, 0) / 12;
            } else {
              annualAchievement = currentAchievements.reduce((sum, v) => sum + v, 0);
            }

            return {
              ...obj,
              monthlyAchievements: currentAchievements,
              achievement: Math.round(annualAchievement * 10) / 10
            };
          })
        };
      }
      return ag;
    });

    onUpdateAgreements(updatedAgreements);

    // Add success notification
    if (onAddNotification) {
      onAddNotification({
        title: "Capaian PK Diperbarui",
        message: `Ketua Tim ${selectedLevel} baru saja memperbarui capaian kinerja bulanan secara mandiri.`,
        type: "info"
      });
    }

    setSuccessMessage("Berhasil menyimpan perubahan capaian bulanan ke dalam sistem database!");
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Dynamic calculations for selected objective
  const activeObjective = useMemo(() => {
    if (!activeAgreement || !activeObjectiveId) return null;
    return activeAgreement.objectives.find(o => o.id === activeObjectiveId) || null;
  }, [activeAgreement, activeObjectiveId]);

  const activeCalculations = useMemo(() => {
    if (!activeObjective) return null;
    const achievements = localAchievements[activeObjective.id] || Array(12).fill(0);
    
    const type = activeObjective.trajectoryType || (
      activeObjective.unit === '%' || 
      activeObjective.indicatorName.toLowerCase().includes('ikpa') || 
      activeObjective.indicatorName.toLowerCase().includes('nilai') 
        ? 'constant' 
        : 'cumulative'
    );

    const isUsingTrajectory = Array.isArray(activeObjective.trajectory) && activeObjective.trajectory.length === 12;

    const numMatch = activeObjective.target.match(/([\d\.,]+)/);
    const baseTargetVal = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : 100;

    let computedAchievement = 0;
    let targetVal = baseTargetVal;

    if (isUsingTrajectory) {
      if (type === 'constant') {
        targetVal = (activeObjective.trajectory || []).reduce((sum, val) => sum + val, 0) / 12;
        computedAchievement = achievements.reduce((sum, v) => sum + v, 0) / 12;
      } else {
        targetVal = (activeObjective.trajectory || []).reduce((sum, val) => sum + val, 0);
        computedAchievement = achievements.reduce((sum, v) => sum + v, 0);
      }
    } else {
      targetVal = baseTargetVal;
      if (type === 'constant') {
        computedAchievement = achievements.reduce((sum, v) => sum + v, 0) / 12;
      } else {
        computedAchievement = achievements.reduce((sum, v) => sum + v, 0);
      }
    }

    const percentage = targetVal > 0 ? Math.round((computedAchievement / targetVal) * 100) : 0;
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    return {
      type,
      isUsingTrajectory,
      targetVal,
      computedAchievement: Math.round(computedAchievement * 10) / 10,
      percentage: clampedPercentage
    };
  }, [activeObjective, localAchievements]);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <TrendingUp className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sistem Input Mandiri
            </div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              Input Capaian PK Bulanan
            </h1>
            <p className="text-xs text-indigo-100 max-w-xl leading-relaxed">
              Daftarkan dan perbarui realisasi kinerja bulanan indikator Perjanjian Kinerja (PK) Level 2 secara mandiri. Hasil input akan langsung terintegrasi ke dashboard pimpinan.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-1.5">
            <p className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-wider">Petugas Pengisi</p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{currentUser.name}</p>
                <p className="text-[9px] font-semibold text-indigo-300 font-mono mt-0.5">
                  {currentUser.role === 'Superadmin' ? 'SUPERADMIN ACCESS' : `DIVISI ${currentUser.division || 'OPERASIONAL'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Division Level - Visible to Admin & Kepala, locked or auto-selected for division heads */}
      {(currentUser.role === 'Superadmin' || currentUser.role === 'Kepala') ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Pilih Sasaran Perjanjian Kinerja Level 2</h3>
          </div>
          <p className="text-[11px] text-slate-400">Sebagai administrator/kepala stasiun, Anda memiliki izin istimewa untuk mengedit capaian bulanan semua divisi.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {level2Options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedLevel(opt.value)}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedLevel === opt.value
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-slate-800 leading-snug">{opt.value}</div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">{opt.label.replace(opt.value + ' ', '')}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider leading-none">Dokumen Terkait Anda</p>
              <h4 className="text-xs font-bold text-indigo-900 mt-1">{selectedLevel}</h4>
              <p className="text-[10px] text-indigo-600 mt-0.5">Sistem membatasi input ke wilayah wewenang divisi ({currentUser.division}) Anda.</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> STATUS: DOKUMEN AKTIF
            </span>
          </div>
        </div>
      )}

      {/* Save Success Alert banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {!activeAgreement ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Perjanjian Kinerja Level 2 Belum Aktif</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Sasaran level {selectedLevel} belum didaftarkan atau belum diaktifkan oleh Kepala Stasiun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Indicator Navigation List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-1">
              Daftar Indikator Kinerja ({activeAgreement.objectives.length})
            </h3>
            
            <div className="space-y-2">
              {activeAgreement.objectives.map((obj) => {
                const isActive = activeObjectiveId === obj.id;
                const isTrajectory = Array.isArray(obj.trajectory) && obj.trajectory.length === 12;
                const tType = obj.trajectoryType || (
                  obj.unit === '%' || 
                  obj.indicatorName.toLowerCase().includes('ikpa') || 
                  obj.indicatorName.toLowerCase().includes('nilai') 
                    ? 'constant' 
                    : 'cumulative'
                );

                return (
                  <button
                    key={obj.id}
                    onClick={() => setActiveObjectiveId(obj.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                      isActive 
                        ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-extrabold text-slate-400">BOBOT: {obj.weight}%</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${
                          isTrajectory 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                            : 'bg-sky-50 text-sky-700 border border-sky-100'
                        }`}>
                          {isTrajectory 
                            ? `Trajectory (${tType === 'constant' ? 'Konstan' : 'Kumulatif'})` 
                            : 'Proporsional'
                          }
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold leading-snug truncate ${
                        isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                      }`} title={obj.indicatorName}>
                        {obj.indicatorName}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400">
                        Target: <span className="text-slate-600 font-extrabold">{obj.target} {obj.unit}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Monthly Entry Grid for Selected Indicator */}
          <div className="lg:col-span-8">
            {activeObjective && activeCalculations ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                
                {/* Selected Indicator Header Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/60 rounded-md px-2.5 py-1">
                        INDIKATOR AKTIF
                      </span>
                      <h3 className="text-sm font-black text-slate-800 leading-snug mt-2">
                        {activeObjective.indicatorName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Bobot</span>
                      <span className="text-lg font-black text-slate-700">{activeObjective.weight}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/60">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Target Tahunan</p>
                      <p className="text-xs font-extrabold text-slate-700">{activeObjective.target} {activeObjective.unit}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Logika Perhitungan</p>
                      <p className="text-xs font-extrabold text-slate-700 uppercase">
                        {activeCalculations.isUsingTrajectory 
                          ? `TRAJECTORY (${activeCalculations.type === 'constant' ? 'Konstan' : 'Kumulatif'})` 
                          : 'NON-TRAJECTORY (Proporsional)'
                        }
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Status Trajectory</p>
                      <p className="text-xs font-semibold text-slate-600">
                        {activeCalculations.isUsingTrajectory 
                          ? '✓ Target bulanan terkonfigurasi' 
                          : '✗ Tidak ada proyeksi khusus'
                        }
                      </p>
                    </div>
                  </div>

                  {activeCalculations.isUsingTrajectory && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyTargetTrajectory(activeObjective)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Salin Proyeksi Target Bulanan ke Capaian
                      </button>
                    </div>
                  )}
                </div>

                {/* Main 12-Month Grid Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      Rincian Realisasi Capaian Bulanan
                    </h4>
                    <span className="text-[10px] text-slate-400 italic font-medium">Input dalam satuan: {activeObjective.unit}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {INDONESIAN_MONTHS.map((month, idx) => {
                      const currentVal = (localAchievements[activeObjective.id] || Array(12).fill(0))[idx];
                      const targetProj = activeCalculations.isUsingTrajectory && Array.isArray(activeObjective.trajectory)
                        ? activeObjective.trajectory[idx]
                        : null;

                      return (
                        <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                              {month}
                            </label>
                            {targetProj !== null && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-100/50">
                                Proyeksi: {targetProj}
                              </span>
                            )}
                          </div>
                          
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              value={currentVal === 0 && !localAchievements[activeObjective.id] ? '' : currentVal}
                              onChange={(e) => handleLocalChange(activeObjective.id, idx, e.target.value)}
                              placeholder="0.0"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden text-right pr-8"
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 font-mono">
                              {activeObjective.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time calculated annual preview footer card */}
                <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      Estimasi Hasil Akhir Kumulatif
                    </div>
                    <p className="text-xs text-slate-500">
                      Target Kumulatif: <span className="font-extrabold text-slate-700">{activeCalculations.targetVal.toLocaleString('id-ID')} {activeObjective.unit}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Realisasi Kumulatif: <span className="font-extrabold text-slate-700">{activeCalculations.computedAchievement.toLocaleString('id-ID')} {activeObjective.unit}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Persentase Capaian</p>
                      <p className={`text-xl font-black mt-0.5 ${
                        activeCalculations.percentage >= 90
                          ? 'text-emerald-600'
                          : activeCalculations.percentage >= 70
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}>
                        {activeCalculations.percentage}%
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAll}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Capaian
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic text-xs">
                Silakan pilih indikator di sebelah kiri untuk mulai menginput realisasi bulanan.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
