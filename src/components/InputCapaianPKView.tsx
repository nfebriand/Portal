import React, { useState, useMemo } from 'react';
import { IndicatorTitleDisplay } from './IndicatorTitleDisplay';
import { 
  Employee, 
  PerformanceAgreement, 
  PerformanceIndicator, 
  InstitutionalIdentity, 
  AppSettings,
  NewsReport,
  CooperationContract,
  ReporterTarget
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
  UserCheck,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Users,
  CheckCircle2,
  X,
  HelpCircle
} from 'lucide-react';
import { syncNewsAchievements, getReportTypeCategory } from '../utils/syncNewsAchievements';
import { parseFlexibleDate } from '../utils/dateUtils';
import { isEligibleNewsIndicator } from '../utils/newsFilter';
import { 
  isCompetencyIndicator, 
  calculateMonthlyCompetencyCompliance, 
  syncCompetencyAchievements 
} from '../utils/syncCompetencyAchievements';

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
  newsReports?: NewsReport[];
  contracts?: CooperationContract[];
  reporterTargets?: ReporterTarget[];
  onUpdateAgreements: (updated: PerformanceAgreement[]) => void;
  onUpdateNewsReports?: (reports: NewsReport[]) => void;
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
  newsReports = [],
  contracts = [],
  reporterTargets = [],
  onUpdateAgreements,
  onUpdateNewsReports,
  onAddNotification
}: InputCapaianPKViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [syncReportData, setSyncReportData] = useState<{
    totalReports: number;
    validDatesCount: number;
    invalidDatesCount: number;
    categoryBreakdown: {
      online: number;
      lpu: number;
      radio: number;
      siaran: number;
      total: number;
    };
    matchedEmployeesCount: number;
    unmatchedEmployeesCount: number;
    messages: { type: 'success' | 'warning' | 'error' | 'info'; title: string; text: string }[];
  } | null>(null);

  const handleRefreshNewsCalculation = () => {
    setIsRefreshing(true);
    const reports = newsReports || [];
    const totalReports = reports.length;

    const isAdminUtama = currentUser.role === 'Superadmin' || currentUser.role === 'Kepala';
    const targetLevelToSync = isAdminUtama ? undefined : selectedLevel;
    const selectedLevelLabel = selectedLevel.replace('Ketua Tim ', '').replace('Kabid ', '');

    let validDatesCount = 0;
    let invalidDatesCount = 0;
    const catCounts = { online: 0, lpu: 0, radio: 0, siaran: 0, total: 0 };
    let matchedEmployeesCount = 0;
    let unmatchedEmployeesCount = 0;

    const messages: { type: 'success' | 'warning' | 'error' | 'info'; title: string; text: string }[] = [];

    if (totalReports === 0) {
      messages.push({
        type: 'error',
        title: 'Data Berita Kosong (0 Berita)',
        text: 'Tidak ada data berita terimpor yang ditemukan dalam sistem. Jika Anda telah mengunggah berkas Excel/JSON berita, pastikan proses impor telah dilakukan di menu "Pemberitaan & Media Baru" atau "Admin App".'
      });
    } else {
      reports.forEach(rep => {
        // Date parsing check
        const dateRaw = rep.publishDateTime || rep.date;
        if (dateRaw) {
          const parsed = parseFlexibleDate(dateRaw);
          if (parsed.isValid) {
            validDatesCount++;
          } else {
            invalidDatesCount++;
          }
        } else {
          invalidDatesCount++;
        }

        // Category breakdown
        const cat = getReportTypeCategory(rep.type);
        if (catCounts[cat] !== undefined) {
          catCounts[cat]++;
        }
        catCounts.total++;

        // Employee matching check
        let empId = rep.employeeId;
        if (!empId && (rep.reporterName || rep.writerName)) {
          const repName = (rep.reporterName || rep.writerName || '').toLowerCase().trim();
          const matched = employees.find(e => {
            const eName = e.nama.toLowerCase().trim();
            return eName === repName || eName.includes(repName) || repName.includes(eName);
          });
          if (matched) empId = matched.id;
        }

        if (empId) {
          matchedEmployeesCount++;
        } else {
          unmatchedEmployeesCount++;
        }
      });

      if (invalidDatesCount > 0) {
        messages.push({
          type: 'warning',
          title: `Penyesuaian Tanggal Berita (${invalidDatesCount} Berita)`,
          text: `Terdapat ${invalidDatesCount} berita dengan format tanggal tidak valid / tidak lengkap. Berita ini secara otomatis dimasukkan ke dalam perhitungan bulan berjalan saat ini.`
        });
      }

      if (unmatchedEmployeesCount > 0) {
        messages.push({
          type: 'info',
          title: `Reporter Belum Terhubung Pegawai (${unmatchedEmployeesCount} Berita)`,
          text: `Terdapat ${unmatchedEmployeesCount} berita yang nama penuliskannya tidak persis cocok dengan ID/nama pegawai. Berita ini tetap dihitung dan dimasukkan ke dalam total capaian stasiun/tim.`
        });
      }

      if (isAdminUtama) {
        messages.push({
          type: 'success',
          title: 'Hitung Ulang Berita Semua Bidang Selesai (Admin Utama)',
          text: `Sebanyak ${totalReports} data berita terimpor berhasil dihitung ulang dan disinkronkan ke seluruh level Perjanjian Kinerja untuk SEMUA bidang/divisi stasiun.`
        });
      } else {
        messages.push({
          type: 'success',
          title: `Hitung Ulang Berita Bidang ${selectedLevelLabel} Selesai`,
          text: `Sebanyak ${totalReports} data berita terimpor berhasil dihitung ulang dan disinkronkan khusus untuk Perjanjian Kinerja Bidang ${selectedLevelLabel} (${selectedLevel}).`
        });
      }

      // Synchronize news achievements into agreements for all levels including Kepala Stasiun
      let updatedAgs = syncNewsAchievements(reports, agreements, reporterTargets || [], employees);
      // Also synchronize competency achievements for all levels
      updatedAgs = syncCompetencyAchievements(employees, updatedAgs);
      onUpdateAgreements(updatedAgs);

      if (onAddNotification) {
        onAddNotification({
          title: isAdminUtama ? 'Perhitungan Ulang Berita Semua Bidang Selesai' : `Perhitungan Ulang Berita Bidang ${selectedLevelLabel} Selesai`,
          message: isAdminUtama
            ? `Berhasil menghitung ulang ${totalReports} berita untuk seluruh bidang/divisi stasiun.`
            : `Berhasil menghitung ulang berita khusus untuk Perjanjian Kinerja Bidang ${selectedLevelLabel}.`,
          type: 'info'
        });
      }
    }

    setSyncReportData({
      totalReports,
      validDatesCount,
      invalidDatesCount,
      categoryBreakdown: catCounts,
      matchedEmployeesCount,
      unmatchedEmployeesCount,
      messages
    });

    setIsRefreshing(false);
    setShowExplanationModal(true);
  };

  const handleRefreshSingleIndicator = (obj: PerformanceIndicator) => {
    if (!obj) return;
    setIsRefreshing(true);

    // If competency indicator, calculate from employee 40 JP training records
    if (isCompetencyIndicator(obj)) {
      const compResult = calculateMonthlyCompetencyCompliance(employees);
      const updatedAgs = syncCompetencyAchievements(employees, agreements);
      
      setLocalAchievements(prev => ({
        ...prev,
        [obj.id]: [...compResult.monthlyPercentages]
      }));

      onUpdateAgreements(updatedAgs);

      if (onAddNotification) {
        onAddNotification({
          title: 'Hitung Ulang Capaian Pelatihan 40 JP Selesai',
          message: `Berhasil menghitung ulang capaian pengembangan kompetensi dari ${compResult.totalEmployees} ASN. ${compResult.totalCompliant} pegawai telah mencapai target minimal 40 JP (${compResult.finalPercentage}%).`,
          type: 'success'
        });
      }

      setSuccessMessage(
        `Capaian bulanan untuk indikator "${obj.indicatorName}" berhasil dihitung ulang dari data pelatihan 40 JP (${compResult.totalCompliant}/${compResult.totalEmployees} ASN atau ${compResult.finalPercentage}%).`
      );
      setTimeout(() => setSuccessMessage(null), 4500);

      setIsRefreshing(false);
      return;
    }

    const isAdminUtama = currentUser.role === 'Superadmin' || currentUser.role === 'Kepala';
    const targetLevelToSync = isAdminUtama ? undefined : selectedLevel;

    // Run syncNewsAchievements to calculate latest news reports & rollup child achievements
    let updatedAgs = syncNewsAchievements(
      newsReports || [],
      agreements,
      reporterTargets || [],
      employees
    );

    // Find updated objective in target agreement
    const targetAg = updatedAgs.find(ag => ag.level === selectedLevel);
    const updatedObj = targetAg?.objectives.find(o => o.id === obj.id);

    if (updatedObj && Array.isArray(updatedObj.monthlyAchievements)) {
      setLocalAchievements(prev => ({
        ...prev,
        [obj.id]: [...updatedObj.monthlyAchievements]
      }));
    }

    onUpdateAgreements(updatedAgs);

    const isNews = isEligibleNewsIndicator(obj);
    if (onAddNotification) {
      onAddNotification({
        title: isNews ? 'Hitung Ulang Capaian Berita PK Selesai' : 'Hitung Ulang Capaian PK Selesai',
        message: isNews
          ? `Berhasil menghitung ulang realisasi berita terimpor untuk PK "${obj.indicatorName}". Capaian bulanan telah diperbarui.`
          : `Berhasil menghitung ulang capaian realisasi bulanan untuk PK "${obj.indicatorName}".`,
        type: 'success'
      });
    }

    setSuccessMessage(
      isNews
        ? `Capaian realisasi berita terimpor untuk PK "${obj.indicatorName}" telah berhasil dihitung ulang dan diperbarui.`
        : `Capaian realisasi bulanan untuk PK "${obj.indicatorName}" telah berhasil dihitung ulang.`
    );
    setTimeout(() => setSuccessMessage(null), 4000);

    setIsRefreshing(false);
  };
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

  // Compute 40 JP SDM competency compliance live data
  const competencyComplianceData = useMemo(() => {
    return calculateMonthlyCompetencyCompliance(employees);
  }, [employees]);

  // Temporary local state for draft edits to avoid updating database on every keystroke
  // Formatted as { [indicatorId]: number[] }
  const [localAchievements, setLocalAchievements] = useState<{ [key: string]: number[] }>({});
  const [localPeriodTypes, setLocalPeriodTypes] = useState<{ [key: string]: 'tahunan' | 'triwulanan' | 'semesteran' }>({});
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);

  // Find agreement for the selected level
  const activeAgreement = useMemo(() => {
    return agreements.find(ag => ag.level === selectedLevel);
  }, [agreements, selectedLevel]);

  // Initialize local achievements and period types from agreement objectives
  React.useEffect(() => {
    if (activeAgreement) {
      const initial: { [key: string]: number[] } = {};
      const initialPeriods: { [key: string]: 'tahunan' | 'triwulanan' | 'semesteran' } = {};
      activeAgreement.objectives.forEach(obj => {
        if (Array.isArray(obj.monthlyAchievements) && obj.monthlyAchievements.length === 12) {
          initial[obj.id] = [...obj.monthlyAchievements];
        } else {
          initial[obj.id] = Array(12).fill(obj.achievement / 12 || 0);
        }
        initialPeriods[obj.id] = obj.periodType || 'tahunan';
      });
      setLocalAchievements(initial);
      setLocalPeriodTypes(initialPeriods);
      if (activeAgreement.objectives.length > 0) {
        setActiveObjectiveId(activeAgreement.objectives[0].id);
      }
    } else {
      setLocalAchievements({});
      setLocalPeriodTypes({});
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
            
            // For news indicators, calculate the manual delta
            let manualAchievements = obj.manualAchievements;
            if (isEligibleNewsIndicator(obj)) {
              const originalTotal = obj.monthlyAchievements || Array(12).fill(0);
              const oldManual = obj.manualAchievements || Array(12).fill(0);
              const imported = originalTotal.map((t, idx) => t - (oldManual[idx] || 0));
              manualAchievements = currentAchievements.map((t, idx) => t - imported[idx]);
            }
            
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
              ...(manualAchievements ? { manualAchievements } : {}),
              periodType: localPeriodTypes[obj.id] || 'tahunan',
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
    const pType = localPeriodTypes[activeObjective.id] || activeObjective.periodType || 'tahunan';
    
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
    let percentage = 0;

    const trajectory = isUsingTrajectory ? (activeObjective.trajectory || []) : Array(12).fill(baseTargetVal / 12);

    if (pType === 'triwulanan') {
      const qScores: number[] = [];
      let totalReal = 0;
      for (let q = 0; q < 4; q++) {
        const startIndex = q * 3;
        const qTarget = isUsingTrajectory
          ? (type === 'constant'
            ? (trajectory[startIndex] + trajectory[startIndex+1] + trajectory[startIndex+2]) / 3
            : (trajectory[startIndex] + trajectory[startIndex+1] + trajectory[startIndex+2]))
          : (type === 'constant' ? baseTargetVal : baseTargetVal / 4);
        
        const qReal = type === 'constant'
          ? (achievements[startIndex] + achievements[startIndex+1] + achievements[startIndex+2]) / 3
          : (achievements[startIndex] + achievements[startIndex+1] + achievements[startIndex+2]);

        totalReal += (achievements[startIndex] + achievements[startIndex+1] + achievements[startIndex+2]);

        const qScore = qTarget > 0 ? (qReal / qTarget) * 100 : 0;
        qScores.push(Math.min(120, Math.max(0, qScore)));
      }
      computedAchievement = type === 'constant' ? totalReal / 12 : totalReal;
      targetVal = baseTargetVal;
      percentage = Math.round(qScores.reduce((sum, s) => sum + s, 0) / 4);
    } else if (pType === 'semesteran') {
      const sScores: number[] = [];
      let totalReal = 0;
      for (let s = 0; s < 2; s++) {
        const startIndex = s * 6;
        let sTarget = 0;
        let sReal = 0;
        for (let i = 0; i < 6; i++) {
          sTarget += isUsingTrajectory ? trajectory[startIndex + i] : (type === 'constant' ? baseTargetVal / 6 : baseTargetVal / 12);
          sReal += achievements[startIndex + i];
        }
        totalReal += sReal;
        if (type === 'constant') {
          sTarget = isUsingTrajectory ? sTarget / 6 : baseTargetVal;
          sReal = sReal / 6;
        } else if (!isUsingTrajectory) {
          sTarget = baseTargetVal / 2;
        }

        const sScore = sTarget > 0 ? (sReal / sTarget) * 100 : 0;
        sScores.push(Math.min(120, Math.max(0, sScore)));
      }
      computedAchievement = type === 'constant' ? totalReal / 12 : totalReal;
      targetVal = baseTargetVal;
      percentage = Math.round(sScores.reduce((sum, s) => sum + s, 0) / 2);
    } else {
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
      percentage = targetVal > 0 ? Math.round((computedAchievement / targetVal) * 100) : 0;
    }

    const clampedPercentage = Math.min(120, Math.max(0, percentage));

    return {
      type,
      isUsingTrajectory,
      targetVal,
      computedAchievement: Math.round(computedAchievement * 10) / 10,
      percentage: clampedPercentage,
      periodType: pType
    };
  }, [activeObjective, localAchievements, localPeriodTypes]);

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

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-end gap-3">
            <button
              type="button"
              onClick={handleRefreshNewsCalculation}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-50"
              title={(currentUser.role === 'Superadmin' || currentUser.role === 'Kepala') ? "Hitung ulang berita terimpor untuk seluruh bidang (Admin Utama)" : `Hitung ulang berita terimpor khusus bidang ${selectedLevel.replace('Ketua Tim ', '').replace('Kabid ', '')}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {(currentUser.role === 'Superadmin' || currentUser.role === 'Kepala')
                  ? 'Refresh & Hitung Ulang (Semua Bidang)'
                  : `Refresh & Hitung Ulang (${selectedLevel.replace('Ketua Tim ', '').replace('Kabid ', '')})`}
              </span>
            </button>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 space-y-1 w-full">
              <p className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-wider">Petugas Pengisi</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
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
                        <div className="flex flex-wrap gap-1 items-center justify-end">
                          {isCompetencyIndicator(obj) && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200">
                              ⚡ Auto 40 JP SDM
                            </span>
                          )}
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
                      </div>
                      <IndicatorTitleDisplay 
                        title={obj.indicatorName}
                        className={`text-xs font-bold leading-snug block truncate ${
                          isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                        }`}
                        subClassName="text-[10px] text-slate-500 font-medium block truncate mt-0.5"
                      />
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
                
                {/* 40 JP SDM Competency Auto-Sync Highlight Card */}
                {isCompetencyIndicator(activeObjective) && (
                  <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md space-y-4 border border-purple-400/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-400/30 text-purple-300">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-400/20">
                              ⚡ Terhubung Otomatis ke Modul Kepegawaian
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white mt-1">
                            Kepatuhan Pelatihan SDM Minimal 40 Jam Pelajaran (JP)
                          </h4>
                          <p className="text-xs text-purple-200 mt-0.5">
                            Capaian persentase per bulan otomatis dihitung dari jumlah pegawai yang mencapai milestone 40 JP pertama kali pada bulan tersebut.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRefreshSingleIndicator(activeObjective)}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Sinkronkan Ulang 40 JP</span>
                      </button>
                    </div>

                    {/* Quick Summary Metric Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <p className="text-[10px] text-purple-200 uppercase font-semibold">Total ASN</p>
                        <p className="text-base font-black text-white">{competencyComplianceData.totalEmployees} Orang</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <p className="text-[10px] text-purple-200 uppercase font-semibold">Mencapai ≥ 40 JP</p>
                        <p className="text-base font-black text-emerald-400">{competencyComplianceData.totalCompliant} Orang</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <p className="text-[10px] text-purple-200 uppercase font-semibold">Belum Memenuhi</p>
                        <p className="text-base font-black text-amber-300">
                          {competencyComplianceData.totalEmployees - competencyComplianceData.totalCompliant} Orang
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <p className="text-[10px] text-purple-200 uppercase font-semibold">Capaian Saat Ini</p>
                        <p className="text-base font-black text-purple-300">{competencyComplianceData.finalPercentage}%</p>
                      </div>
                    </div>

                    {/* Milestones list */}
                    {competencyComplianceData.milestones.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-[11px] font-bold text-purple-200 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ASN yang Telah Mencapai 40 JP Pertama Kali ({competencyComplianceData.milestones.length}):
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                          {competencyComplianceData.milestones.map((m, idx) => (
                            <div key={idx} className="bg-white/10 rounded-lg px-2.5 py-1 text-[11px] border border-white/10 flex items-center gap-1.5">
                              <span className="font-bold text-white">{m.employeeName}</span>
                              <span className="text-purple-300 font-mono text-[10px]">({m.division})</span>
                              <span className="text-emerald-300 font-semibold text-[10px]">✓ {m.tanggalTercapai40Jam}</span>
                              <span className="text-slate-300 text-[10px]">({m.totalHours} JP)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Indicator Header Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/60 rounded-md px-2.5 py-1">
                        INDIKATOR AKTIF
                      </span>
                      <IndicatorTitleDisplay 
                        title={activeObjective.indicatorName}
                        className="text-sm font-black text-slate-800 leading-snug block mt-2"
                        subClassName="text-xs text-slate-500 font-normal block mt-1"
                      />
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

                  {/* Pilihan Capaian SAKIP */}
                  <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Frekuensi Evaluasi Capaian PK</span>
                        <span className="text-indigo-600 font-mono font-black text-[9px] bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">BARU</span>
                      </p>
                      <p className="text-[11px] text-slate-400">Tentukan apakah capaian dihitung per semester, triwulan, atau akumulasi tahunan terhadap target tahunan.</p>
                    </div>
                    <div className="shrink-0">
                      <select
                        value={localPeriodTypes[activeObjective.id] || 'tahunan'}
                        onChange={(e) => {
                          const val = e.target.value as 'tahunan' | 'triwulanan' | 'semesteran';
                          setLocalPeriodTypes(prev => ({
                            ...prev,
                            [activeObjective.id]: val
                          }));
                        }}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="tahunan">Tahunan / Bulanan (Akumulasi)</option>
                        <option value="triwulanan">Triwulanan (Rata-rata 4 Triwulan)</option>
                        <option value="semesteran">Semesteran (Rata-rata 2 Semester)</option>
                      </select>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      Rincian Realisasi Capaian Bulanan
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRefreshSingleIndicator(activeObjective)}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-lg transition-all cursor-pointer border border-indigo-100/60 disabled:opacity-50"
                        title={`Hitung ulang capaian bulanan khusus untuk indikator: ${activeObjective.indicatorName}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>
                          {isCompetencyIndicator(activeObjective)
                            ? 'Hitung Ulang Capaian 40 JP SDM'
                            : isEligibleNewsIndicator(activeObjective)
                            ? 'Hitung Ulang Capaian Berita PK Ini'
                            : 'Hitung Ulang Capaian PK Ini'}
                        </span>
                      </button>
                      <span className="text-[10px] text-slate-400 italic font-medium">Satuan: {activeObjective.unit}</span>
                    </div>
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

      {/* Modal Penjelasan & Analisis Hitung Ulang Berita */}
      {showExplanationModal && syncReportData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 leading-tight">
                    Hasil Sinkronisasi & Analisis Berita Terimpor
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ringkasan proses penghitungan ulang data berita ke indikator Capaian PK
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Berita</p>
                <p className="text-lg font-black text-slate-800">{syncReportData.totalReports} <span className="text-xs font-semibold text-slate-500">Item</span></p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 space-y-1">
                <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Tanggal Valid</p>
                <p className="text-lg font-black text-emerald-800">{syncReportData.validDatesCount} <span className="text-xs font-semibold text-emerald-600">Berita</span></p>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 space-y-1">
                <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Penyesuaian Tgl</p>
                <p className="text-lg font-black text-amber-800">{syncReportData.invalidDatesCount} <span className="text-xs font-semibold text-amber-600">Berita</span></p>
              </div>
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 space-y-1">
                <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Match Pegawai</p>
                <p className="text-lg font-black text-indigo-800">{syncReportData.matchedEmployeesCount} <span className="text-xs font-semibold text-indigo-600">Reporter</span></p>
              </div>
            </div>

            {/* Rincian Kategori Berita */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                Rincian Menurut Jenis Berita Terimpor
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400">Berita Online / KBRN</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{syncReportData.categoryBreakdown.online}</p>
                </div>
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400">Berita Ringan LPU</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{syncReportData.categoryBreakdown.lpu}</p>
                </div>
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400">Berita Radio</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{syncReportData.categoryBreakdown.radio}</p>
                </div>
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400">Konten Siaran / Medsos</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{syncReportData.categoryBreakdown.siaran}</p>
                </div>
              </div>
            </div>

            {/* Explanations & Alerts */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                Status Perhitungan & Penjelasan Sistem
              </h4>

              <div className="space-y-2.5">
                {syncReportData.messages.map((msg, idx) => {
                  let badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-900';
                  let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
                  if (msg.type === 'warning') {
                    badgeBg = 'bg-amber-50 border-amber-200 text-amber-900';
                    icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
                  } else if (msg.type === 'error') {
                    badgeBg = 'bg-rose-50 border-rose-200 text-rose-900';
                    icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
                  } else if (msg.type === 'info') {
                    badgeBg = 'bg-sky-50 border-sky-200 text-sky-900';
                    icon = <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;
                  }

                  return (
                    <div key={idx} className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${badgeBg}`}>
                      {icon}
                      <div className="space-y-1">
                        <p className="font-extrabold">{msg.title}</p>
                        <p className="leading-relaxed opacity-90">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Tutup & Lihat Hasil Capaian
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
