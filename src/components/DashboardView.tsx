import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Employee, CriticalNotification, CooperationContract, PerformanceAgreement, ReporterTarget, NewsReport } from '../types';
import { 
  Users, 
  User, 
  Landmark, 
  GraduationCap, 
  TrendingUp, 
  AlertTriangle, 
  Bell, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  Layers,
  Handshake,
  DollarSign,
  Target,
  FileText,
  CheckCircle2,
  ChevronRight,
  Award,
  Share2,
  Globe,
  GitFork,
  ArrowLeft
} from 'lucide-react';

interface DashboardViewProps {
  employees: Employee[];
  notifications: CriticalNotification[];
  onAddNotification: (notification: CriticalNotification) => void;
  onReadNotification: (id: string) => void;
  contracts?: CooperationContract[];
  agreements?: PerformanceAgreement[];
  reporterTargets?: ReporterTarget[];
  newsReports?: NewsReport[];
}

type TrendMetric = 'rating' | 'efficiency' | 'listener';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface ObjectivePerformanceResult {
  targetVal: number;
  targetStr: string;
  achievement: number;
  percentage: number;
}

function calculateObjectivePerformance(
  obj: any,
  period: string,
  selectedMonthIndex: number
): ObjectivePerformanceResult {
  const isUsingTrajectory = Array.isArray(obj.trajectory) && obj.trajectory.length === 12;

  // 1. Get active months indices
  let activeMonths: number[] = [];
  switch (period) {
    case 'Semester 1':
      activeMonths = [0, 1, 2, 3, 4, 5];
      break;
    case 'Semester 2':
      activeMonths = [6, 7, 8, 9, 10, 11];
      break;
    case 'Triwulan 1':
      activeMonths = [0, 1, 2];
      break;
    case 'Triwulan 2':
      activeMonths = [3, 4, 5];
      break;
    case 'Triwulan 3':
      activeMonths = [6, 7, 8];
      break;
    case 'Triwulan 4':
      activeMonths = [9, 10, 11];
      break;
    case 'Bulanan':
      activeMonths = [selectedMonthIndex];
      break;
    case 'Tahunan':
    default:
      activeMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      break;
  }

  const numMatch = obj.target.match(/([\d\.,]+)/);
  const baseTargetVal = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : 100;
  const nonNumPart = obj.target.replace(/[\d\.,]+/g, '').trim();

  let targetVal = baseTargetVal;
  let achievement = obj.achievement;

  if (isUsingTrajectory) {
    const type = obj.trajectoryType || (obj.unit === '%' || obj.indicatorName.toLowerCase().includes('ikpa') || obj.indicatorName.toLowerCase().includes('nilai') ? 'constant' : 'cumulative');

    if (type === 'constant') {
      // Target is average of the active months
      const sumTargets = activeMonths.reduce((sum, idx) => sum + (obj.trajectory?.[idx] ?? 0), 0);
      targetVal = sumTargets / activeMonths.length;

      if (Array.isArray(obj.monthlyAchievements) && obj.monthlyAchievements.length === 12) {
        const sumAch = activeMonths.reduce((sum, idx) => sum + (obj.monthlyAchievements?.[idx] ?? 0), 0);
        achievement = sumAch / activeMonths.length;
      }
    } else {
      // Cumulative: Target is sum of active months
      targetVal = activeMonths.reduce((sum, idx) => sum + (obj.trajectory?.[idx] ?? 0), 0);

      if (Array.isArray(obj.monthlyAchievements) && obj.monthlyAchievements.length === 12) {
        achievement = activeMonths.reduce((sum, idx) => sum + (obj.monthlyAchievements?.[idx] ?? 0), 0);
      } else {
        // Fallback if no monthly achievements: scale proportionally to active months based on trajectory sum
        const totalTrajectoryTarget = obj.trajectory.reduce((sum, val) => sum + val, 0);
        if (totalTrajectoryTarget > 0) {
          const activeTrajectoryTarget = activeMonths.reduce((sum, idx) => sum + (obj.trajectory?.[idx] ?? 0), 0);
          const ratio = activeTrajectoryTarget / totalTrajectoryTarget;
          achievement = obj.achievement * ratio;
        } else {
          achievement = obj.achievement * (activeMonths.length / 12);
        }
      }
    }
  } else {
    // Non-trajectory logic
    let targetFactor = 1.0;
    let achievementFactor = 1.0;

    switch (period) {
      case 'Triwulan 1':
        targetFactor = 0.25;
        achievementFactor = 0.22;
        break;
      case 'Triwulan 2':
        targetFactor = 0.50;
        achievementFactor = 0.45;
        break;
      case 'Triwulan 3':
        targetFactor = 0.75;
        achievementFactor = 0.68;
        break;
      case 'Triwulan 4':
        targetFactor = 1.0;
        achievementFactor = 0.95;
        break;
      case 'Semester 1':
        targetFactor = 0.50;
        achievementFactor = 0.47;
        break;
      case 'Semester 2':
        targetFactor = 1.0;
        achievementFactor = 0.92;
        break;
      case 'Bulanan':
        const monthNum = selectedMonthIndex + 1;
        const isConstant = obj.unit === '%' || obj.indicatorName.toLowerCase().includes('ikpa') || obj.indicatorName.toLowerCase().includes('nilai');
        if (isConstant) {
          targetFactor = 1.0;
          achievementFactor = 1.0;
        } else {
          targetFactor = monthNum / 12;
          achievementFactor = (monthNum / 12) * 0.95;
        }
        break;
      case 'Tahunan':
      default:
        targetFactor = 1.0;
        achievementFactor = 1.0;
        break;
    }

    targetVal = baseTargetVal * targetFactor;
    achievement = obj.achievement * achievementFactor;

    // Fallback/direct monthly achievement if monthly achievements are supplied
    if (period === 'Bulanan' && Array.isArray(obj.monthlyAchievements) && obj.monthlyAchievements.length === 12) {
      achievement = obj.monthlyAchievements[selectedMonthIndex];
    }
  }

  const percentage = targetVal > 0 ? Math.round((achievement / targetVal) * 100) : 0;
  const clampedPercentage = Math.min(120, Math.max(0, percentage));

  const targetStr = nonNumPart
    ? `${targetVal.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${nonNumPart}`
    : `${targetVal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}`;

  return {
    targetVal,
    targetStr,
    achievement: Math.round(achievement * 10) / 10,
    percentage: clampedPercentage
  };
}

export default function DashboardView({
  employees,
  notifications,
  onAddNotification,
  onReadNotification,
  contracts = [],
  agreements = [],
  reporterTargets = [],
  newsReports = []
}: DashboardViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('rating');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('Semua');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('Semua');
  const [selectedKpiDivision, setSelectedKpiDivision] = useState<string>('Pemberitaan');
  const [selectedKpiPeriod, setSelectedKpiPeriod] = useState<string>('Triwulan 4');
  const [selectedKpiMonth, setSelectedKpiMonth] = useState<number>(new Date().getMonth());
  const [drillDownActive, setDrillDownActive] = useState<boolean>(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ month: string; value: number } | null>(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<string | null>(null);

  // 1. Data Processing with interactive filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchGender = selectedGenderFilter === 'Semua' || emp.jenisKelamin === selectedGenderFilter;
      const matchDivision = selectedDivisionFilter === 'Semua' || emp.divisi === selectedDivisionFilter;
      return matchGender && matchDivision;
    });
  }, [employees, selectedGenderFilter, selectedDivisionFilter]);

  // Gender Stats
  const genderStats = useMemo(() => {
    const male = filteredEmployees.filter(e => e.jenisKelamin === 'Laki-laki').length;
    const female = filteredEmployees.filter(e => e.jenisKelamin === 'Perempuan').length;
    const total = filteredEmployees.length || 1;
    return {
      male,
      female,
      malePct: Math.round((male / total) * 100),
      femalePct: Math.round((female / total) * 100),
    };
  }, [filteredEmployees]);

  // Division Stats
  const divisionStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Program Acara': 0,
      'Pemberitaan': 0,
      'Teknik': 0,
      'Tata Usaha / Umum': 0,
      'Layanan Publik': 0
    };
    
    filteredEmployees.forEach(e => {
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
  }, [filteredEmployees]);

  // Education Stats
  const educationStats = useMemo(() => {
    const counts: Record<string, number> = {
      'SMA': 0,
      'D3': 0,
      'S1': 0,
      'S2': 0,
      'S3': 0
    };

    filteredEmployees.forEach(e => {
      if (counts[e.jenjangPendidikan] !== undefined) {
        counts[e.jenjangPendidikan]++;
      }
    });

    return Object.entries(counts).map(([level, count]) => ({
      level,
      count
    }));
  }, [filteredEmployees]);

  // Trend Data for performance (Monthly static for radio station/company performance)
  const trendData = useMemo(() => {
    return {
      rating: [
        { month: 'Jan', value: 76 },
        { month: 'Feb', value: 78 },
        { month: 'Mar', value: 82 },
        { month: 'Apr', value: 80 },
        { month: 'Mei', value: 85 },
        { month: 'Jun', value: 89 },
      ],
      efficiency: [
        { month: 'Jan', value: 65 },
        { month: 'Feb', value: 70 },
        { month: 'Mar', value: 68 },
        { month: 'Apr', value: 75 },
        { month: 'Mei', value: 79 },
        { month: 'Jun', value: 84 },
      ],
      listener: [
        { month: 'Jan', value: 45 },
        { month: 'Feb', value: 48 },
        { month: 'Mar', value: 55 },
        { month: 'Apr', value: 52 },
        { month: 'Mei', value: 61 },
        { month: 'Jun', value: 67 },
      ]
    };
  }, []);

  // LPU Achievement Calculations
  const lpuStats = useMemo(() => {
    const totalContracts = contracts.length;
    
    // Find objective with id 'ind-11' or matching 'PNBP'
    let targetCapaian = 150; // default fallback in case agreement isn't loaded
    for (const ag of agreements) {
      const pnbpObj = ag.objectives.find(o => o.id === 'ind-11' || o.indicatorName.toLowerCase().includes('pnbp'));
      if (pnbpObj) {
        targetCapaian = parseFloat(pnbpObj.target) || 150;
        break;
      }
    }

    const totalRealisasi = contracts.reduce((sum, c) => sum + c.realizedPnbp, 0);
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
    const achievementPercentage = targetCapaian > 0 ? (totalRealisasi / targetCapaian) * 100 : 0;
    
    // Group contracts by type for contribution breakdown
    const contributionByType = contracts.reduce((acc, c) => {
      acc[c.cooperationType] = (acc[c.cooperationType] || 0) + c.realizedPnbp;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalContracts,
      targetCapaian,
      totalRealisasi,
      totalValue,
      achievementPercentage: Math.round(achievementPercentage * 10) / 10,
      contributionByType
    };
  }, [contracts, agreements]);

  // Capaian Kinerja Pemberitaan & Media Baru Calculations
  const newsStats = useMemo(() => {
    const totalReports = newsReports.length;
    const beritaRinganCount = newsReports.filter(r => r.type === 'Berita Ringan').length;
    const beritaRadioCount = newsReports.filter(r => r.type === 'Berita Radio').length;
    const beritaOnlineCount = newsReports.filter(r => r.type === 'Berita Online').length;
    
    // Average Daily Production
    const uniqueDates = new Set(newsReports.map(r => r.date));
    const daysCount = Math.max(1, uniqueDates.size);
    const avgDaily = Math.round((totalReports / daysCount) * 10) / 10;

    // Monthly achievement rate against combined targets of active reporters
    const totalMonthlyTarget = reporterTargets.reduce((sum, t) => sum + t.monthlyTarget, 0) || 1; // avoid divide by zero
    const monthlyPct = Math.round((totalReports / totalMonthlyTarget) * 1000) / 10;

    // Individual reporter progress
    const reporterProgress = reporterTargets.map(tgt => {
      const emp = employees.find(e => e.id === tgt.employeeId);
      const count = newsReports.filter(r => r.employeeId === tgt.employeeId).length;
      const pct = tgt.monthlyTarget > 0 ? Math.round((count / tgt.monthlyTarget) * 100) : 0;
      return {
        id: tgt.id,
        name: emp ? emp.nama : 'Reporter',
        count,
        target: tgt.monthlyTarget,
        percentage: pct
      };
    });

    return {
      totalReports,
      beritaRinganCount,
      beritaRadioCount,
      beritaOnlineCount,
      avgDaily,
      totalMonthlyTarget,
      monthlyPct,
      reporterProgress
    };
  }, [newsReports, reporterTargets, employees]);

  // Stats for TMB, KMB, Siaran, and Tata Usaha
  const divisionAgreementsStats = useMemo(() => {
    // TMB
    const tmbAg = agreements.find(ag => ag.id === 'pk-default-katim-teknik' || ag.level.includes('Teknologi dan Media Baru'));
    const tmbObjectives = tmbAg ? tmbAg.objectives : [];
    let tmbSum = 0;
    tmbObjectives.forEach(obj => {
      const targetVal = parseFloat(obj.target) || 100;
      tmbSum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
    });
    const tmbPct = tmbObjectives.length > 0 ? Math.round(tmbSum / tmbObjectives.length) : 0;

    // KMB
    const kmbAg = agreements.find(ag => ag.id === 'pk-default-katim-konten' || ag.level.includes('Konten Media Baru'));
    const kmbObjectives = kmbAg ? kmbAg.objectives : [];
    let kmbSum = 0;
    kmbObjectives.forEach(obj => {
      const targetVal = parseFloat(obj.target) || 100;
      kmbSum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
    });
    const kmbPct = kmbObjectives.length > 0 ? Math.round(kmbSum / kmbObjectives.length) : 0;

    // Siaran
    const siaranAg = agreements.find(ag => ag.id === 'pk-default-katim-siaran' || ag.level.includes('Siaran'));
    const siaranObjectives = siaranAg ? siaranAg.objectives : [];
    let siaranSum = 0;
    siaranObjectives.forEach(obj => {
      const targetVal = parseFloat(obj.target) || 100;
      siaranSum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
    });
    const siaranPct = siaranObjectives.length > 0 ? Math.round(siaranSum / siaranObjectives.length) : 0;

    // Tata Usaha / Umum
    const tuAg = agreements.find(ag => ag.id === 'pk-default-kabid-tu' || ag.level.includes('Tata Usaha') || ag.level.includes('TU'));
    const tuObjectives = tuAg ? tuAg.objectives : [];
    let tuSum = 0;
    tuObjectives.forEach(obj => {
      const targetVal = parseFloat(obj.target) || 100;
      tuSum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
    });
    const tuPct = tuObjectives.length > 0 ? Math.round(tuSum / tuObjectives.length) : 0;

    return {
      tmb: { name: 'Teknologi dan Media Baru (TMB)', PIC: 'Andi Wijaya, M.T.', objectives: tmbObjectives, percentage: tmbPct },
      kmb: { name: 'Konten Media Baru (KMB)', PIC: 'Siti Rahmawati, S.I.Kom.', objectives: kmbObjectives, percentage: kmbPct },
      siaran: { name: 'Siaran', PIC: 'Rina Kartika, S.Sos.', objectives: siaranObjectives, percentage: siaranPct },
      tu: { name: 'Tata Usaha / Umum', PIC: 'Ir. Hendra Saputra, M.T.', objectives: tuObjectives, percentage: tuPct }
    };
  }, [agreements]);

  // Dynamic active PK (Perjanjian Kinerja) mapping for the 6 divisions/sections
  const activeDivisionsData = useMemo(() => {
    const findActiveAg = (level: string) => {
      // First try to find one with status === 'Aktif'
      let ag = agreements.find(a => a.level === level && a.status === 'Aktif');
      if (!ag) {
        // Fallback to any agreement with this level
        ag = agreements.find(a => a.level === level);
      }
      return ag;
    };

    const pmbAg = findActiveAg('Ketua Tim Pemberitaan');
    const lpuAg = findActiveAg('Ketua Tim Layanan Pengembangan Usaha');
    const tmbAg = findActiveAg('Ketua Tim Teknologi dan Media Baru');
    const kmbAg = findActiveAg('Ketua Tim Konten Media Baru');
    const siaranAg = findActiveAg('Ketua Tim Siaran');
    const tuAg = findActiveAg('Kabid Tata Usaha');

    // Helper to calculate total percentage of an agreement's objectives
    const getAvgPercentage = (ag: PerformanceAgreement | undefined) => {
      if (!ag || !ag.objectives || ag.objectives.length === 0) return 0;
      let sum = 0;
      ag.objectives.forEach(obj => {
        const targetVal = parseFloat(obj.target) || 100;
        sum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
      });
      return Math.round(sum / ag.objectives.length);
    };

    return [
      {
        key: 'Pemberitaan',
        name: 'Pemberitaan',
        level: 'Ketua Tim Pemberitaan',
        agreement: pmbAg,
        pic: pmbAg?.assignedToName || 'Ketua Tim Pemberitaan',
        status: pmbAg?.status || 'Draft',
        percentage: getAvgPercentage(pmbAg),
        description: 'Produksi berita utama/daerah, akurasi pemberitaan, dan penyebaran konten berita.',
        colorClass: 'text-sky-500 font-bold',
        iconName: 'Pemberitaan'
      },
      {
        key: 'Layanan Pengembangan Usaha',
        name: 'Layanan Pengembangan Usaha (LPU)',
        level: 'Ketua Tim Layanan Pengembangan Usaha',
        agreement: lpuAg,
        pic: lpuAg?.assignedToName || 'Ketua Tim LPU',
        status: lpuAg?.status || 'Draft',
        percentage: getAvgPercentage(lpuAg),
        description: 'Optimalisasi PNBP, kemitraan strategis, sewa aset, dan jasa siaran iklan.',
        colorClass: 'text-indigo-500 font-bold',
        iconName: 'Layanan Pengembangan Usaha'
      },
      {
        key: 'Teknologi dan Media Baru',
        name: 'Teknologi & Media Baru (TMB)',
        level: 'Ketua Tim Teknologi dan Media Baru',
        agreement: tmbAg,
        pic: tmbAg?.assignedToName || 'Ketua Tim TMB',
        status: tmbAg?.status || 'Draft',
        percentage: getAvgPercentage(tmbAg),
        description: 'Keandalan pemancar, transmisi siaran, digitalisasi alat, dan streaming RRI Digital.',
        colorClass: 'text-emerald-500 font-bold',
        iconName: 'Teknologi dan Media Baru'
      },
      {
        key: 'Konten Media Baru',
        name: 'Konten Media Baru (KMB)',
        level: 'Ketua Tim Konten Media Baru',
        agreement: kmbAg,
        pic: kmbAg?.assignedToName || 'Ketua Tim KMB',
        status: kmbAg?.status || 'Draft',
        percentage: getAvgPercentage(kmbAg),
        description: 'Kreasi konten visual kreatif, pengelolaan media sosial, dan engagement publik.',
        colorClass: 'text-pink-500 font-bold',
        iconName: 'Konten Media Baru'
      },
      {
        key: 'Siaran',
        name: 'Siaran',
        level: 'Ketua Tim Siaran',
        agreement: siaranAg,
        pic: siaranAg?.assignedToName || 'Ketua Tim Siaran',
        status: siaranAg?.status || 'Draft',
        percentage: getAvgPercentage(siaranAg),
        description: 'Kualitas on-air, keragaman mata acara siaran, dan indeks kepuasan pendengar.',
        colorClass: 'text-amber-500 font-bold',
        iconName: 'Siaran'
      },
      {
        key: 'Tata Usaha / Umum',
        name: 'Tata Usaha / Umum',
        level: 'Kabid Tata Usaha',
        agreement: tuAg,
        pic: tuAg?.assignedToName || 'Kepala Bagian Tata Usaha',
        status: tuAg?.status || 'Draft',
        percentage: getAvgPercentage(tuAg),
        description: 'Pelayanan ketatausahaan, administrasi SDM, sarana prasarana, dan laporan keuangan.',
        colorClass: 'text-violet-500 font-bold',
        iconName: 'Tata Usaha / Umum'
      }
    ];
  }, [agreements]);

  // Find the selected Division Data
  const selectedDivData = useMemo(() => {
    return activeDivisionsData.find(d => d.key === selectedKpiDivision) || activeDivisionsData[0];
  }, [activeDivisionsData, selectedKpiDivision]);

  // Calculate dynamic adjusted percentages for all 6 divisions based on the selected period
  const adjustedDivisionsPercentages = useMemo(() => {
    const percentages: Record<string, number> = {};
    
    activeDivisionsData.forEach(div => {
      if (!div.agreement || !div.agreement.objectives || div.agreement.objectives.length === 0) {
        percentages[div.key] = 0;
        return;
      }
      
      let sum = 0;
      div.agreement.objectives.forEach(obj => {
        const result = calculateObjectivePerformance(obj, selectedKpiPeriod, selectedKpiMonth);
        sum += result.percentage;
      });
      
      percentages[div.key] = Math.round(sum / div.agreement.objectives.length);
    });
    
    return percentages;
  }, [activeDivisionsData, selectedKpiPeriod, selectedKpiMonth]);

  // Adjust objectives based on the selected period
  const adjustedObjectives = useMemo(() => {
    if (!selectedDivData || !selectedDivData.agreement) return [];
    return selectedDivData.agreement.objectives.map(obj => {
      const result = calculateObjectivePerformance(obj, selectedKpiPeriod, selectedKpiMonth);
      return {
        ...obj,
        target: result.targetStr,
        achievement: result.achievement,
        percentage: result.percentage
      };
    });
  }, [selectedDivData, selectedKpiPeriod, selectedKpiMonth]);

  // Average Achievement percentage for adjusted objectives
  const adjustedDivPercentage = useMemo(() => {
    if (adjustedObjectives.length === 0) return 0;
    const sum = adjustedObjectives.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / adjustedObjectives.length);
  }, [adjustedObjectives]);

  const triggerAlertSimulation = () => {
    const alertTypes = [
      {
        title: "Metrik Kritis: Kehadiran Divisi Teknik",
        message: "Kehadiran personel Divisi Teknik hari ini di bawah ambang batas minimum 85% untuk jaminan stabilitas siaran langsung.",
        type: "critical" as const,
        metricName: "Kehadiran Teknik",
        metricValue: "78%"
      },
      {
        title: "Pemberitahuan Sistem: Kapasitas Studio",
        message: "Overheat warning terdeteksi pada pemancar cadangan stasiun pemancar FM utama. Segera lakukan rotasi pemancar.",
        type: "warning" as const,
        metricName: "Suhu Pemancar FM",
        metricValue: "44°C"
      },
      {
        title: "Kinerja Penyiaran: Anggaran Terpangkas",
        message: "Alokasi anggaran operasional penyiaran luar ruangan terlampaui 12% untuk bulan berjalan. Butuh persetujuan darurat pimpinan.",
        type: "critical" as const,
        metricName: "Over-Budget Ops",
        metricValue: "+12%"
      }
    ];

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    const newNotification: CriticalNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title: randomAlert.title,
      message: randomAlert.message,
      type: randomAlert.type,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      metricName: randomAlert.metricName,
      metricValue: randomAlert.metricValue
    };

    onAddNotification(newNotification);
  };

  // Reset Filters
  const resetFilters = () => {
    setSelectedGenderFilter('Semua');
    setSelectedDivisionFilter('Semua');
  };

  const getGaugeColor = (key: string | undefined) => {
    if (key === 'Pemberitaan') return '#0ea5e9'; // Sky
    if (key === 'Layanan Pengembangan Usaha') return '#6366f1'; // Indigo
    if (key === 'Teknologi dan Media Baru') return '#10b981'; // Emerald
    if (key === 'Konten Media Baru') return '#ec4899'; // Pink
    if (key === 'Siaran') return '#f59e0b'; // Amber
    if (key === 'Tata Usaha / Umum') return '#8b5cf6'; // Violet
    return '#4f46e5';
  };

  const getDivisionCardStyles = (key: string | undefined) => {
    switch (key) {
      case 'Pemberitaan':
        return {
          bgColor: 'bg-sky-50/10 hover:bg-sky-50/20',
          borderColor: 'border-sky-200/80',
          hoverBorderColor: 'hover:border-sky-400',
          hoverRingColor: 'hover:ring-sky-500/10',
          accentColor: 'bg-sky-500',
          textColor: 'text-sky-600',
        };
      case 'Layanan Pengembangan Usaha':
        return {
          bgColor: 'bg-indigo-50/10 hover:bg-indigo-50/20',
          borderColor: 'border-indigo-200/80',
          hoverBorderColor: 'hover:border-indigo-400',
          hoverRingColor: 'hover:ring-indigo-500/10',
          accentColor: 'bg-indigo-500',
          textColor: 'text-indigo-600',
        };
      case 'Teknologi dan Media Baru':
        return {
          bgColor: 'bg-emerald-50/10 hover:bg-emerald-50/20',
          borderColor: 'border-emerald-200/80',
          hoverBorderColor: 'hover:border-emerald-400',
          hoverRingColor: 'hover:ring-emerald-500/10',
          accentColor: 'bg-emerald-500',
          textColor: 'text-emerald-600',
        };
      case 'Konten Media Baru':
        return {
          bgColor: 'bg-pink-50/10 hover:bg-pink-50/20',
          borderColor: 'border-pink-200/80',
          hoverBorderColor: 'hover:border-pink-400',
          hoverRingColor: 'hover:ring-pink-500/10',
          accentColor: 'bg-pink-500',
          textColor: 'text-pink-600',
        };
      case 'Siaran':
        return {
          bgColor: 'bg-amber-50/10 hover:bg-amber-50/20',
          borderColor: 'border-amber-200/80',
          hoverBorderColor: 'hover:border-amber-400',
          hoverRingColor: 'hover:ring-amber-500/10',
          accentColor: 'bg-amber-500',
          textColor: 'text-amber-600',
        };
      case 'Tata Usaha / Umum':
        return {
          bgColor: 'bg-violet-50/10 hover:bg-violet-50/20',
          borderColor: 'border-violet-200/80',
          hoverBorderColor: 'hover:border-violet-400',
          hoverRingColor: 'hover:ring-violet-500/10',
          accentColor: 'bg-violet-500',
          textColor: 'text-violet-600',
        };
      default:
        return {
          bgColor: 'bg-slate-50/10 hover:bg-slate-50/20',
          borderColor: 'border-slate-200/80',
          hoverBorderColor: 'hover:border-slate-400',
          hoverRingColor: 'hover:ring-slate-500/10',
          accentColor: 'bg-slate-500',
          textColor: 'text-slate-600',
        };
    }
  };

  const getDivisionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Pemberitaan': return <Globe className="w-5 h-5 text-sky-500" />;
      case 'Layanan Pengembangan Usaha': return <Handshake className="w-5 h-5 text-indigo-500" />;
      case 'Teknologi dan Media Baru': return <Layers className="w-5 h-5 text-emerald-500" />;
      case 'Konten Media Baru': return <Sparkles className="w-5 h-5 text-pink-500" />;
      case 'Siaran': return <Target className="w-5 h-5 text-amber-500" />;
      case 'Tata Usaha / Umum': return <Users className="w-5 h-5 text-violet-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* SECTION VISUALISASI CAPAIAN IKP PER DIVISI (HALF CIRCLE GAUGES) */}
      <div id="trend-pimpinan-section" className="bg-[#f0f4f8] p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-4">
        
        {/* Header Dashboard / Drill Down */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {drillDownActive && (
                <button
                  onClick={() => setDrillDownActive(false)}
                  className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded-lg text-slate-700 transition-colors border border-slate-300"
                  title="Kembali ke Dashboard 6 Bidang"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600 animate-pulse" />
                {!drillDownActive 
                  ? "Capaian Indikator Kinerja Program RRI Bandar Lampung"
                  : `Capaian Indikator Kinerja Program Divisi ${selectedDivData?.name || ''}`
                }
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            {drillDownActive && (
              <button
                onClick={() => setDrillDownActive(false)}
                className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-300 px-2.5 py-1 rounded-lg transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                Kembali
              </button>
            )}

            {/* Period Filter Control */}
            <div className="flex items-center gap-2">
              <div className="w-44">
                <select
                  value={selectedKpiPeriod}
                  onChange={(e) => setSelectedKpiPeriod(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-300/80 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <option value="Tahunan">Tahunan (Jan - Des)</option>
                  <option value="Semester 1">Semester 1 (Jan - Jun)</option>
                  <option value="Semester 2">Semester 2 (Jul - Des)</option>
                  <option value="Triwulan 1">Triwulan 1 (Jan - Mar)</option>
                  <option value="Triwulan 2">Triwulan 2 (Apr - Jun)</option>
                  <option value="Triwulan 3">Triwulan 3 (Jul - Sep)</option>
                  <option value="Triwulan 4">Triwulan 4 (Okt - Des)</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>

              {selectedKpiPeriod === 'Bulanan' && (
                <div className="w-36 animate-in fade-in slide-in-from-left-2 duration-150">
                  <select
                    value={selectedKpiMonth}
                    onChange={(e) => setSelectedKpiMonth(parseInt(e.target.value))}
                    className="w-full bg-[#f8fafc] border border-slate-300/80 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {INDONESIAN_MONTHS.map((month, idx) => (
                      <option key={idx} value={idx}>{month}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Router */}
        {!drillDownActive ? (
          /* 1. MAIN GRID: 6 Half Circle Gauge Grid (2 rows of 3 columns) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeDivisionsData.map((div) => {
              const percentage = adjustedDivisionsPercentages[div.key] || 0;
              const fillPercentage = Math.min(100, Math.max(0, percentage));
              const remaining = 100 - fillPercentage;
              const gaugeColor = getGaugeColor(div.key);

              const gaugeData = [
                { value: fillPercentage },
                { value: remaining }
              ];

              const styles = getDivisionCardStyles(div.key);

              return (
                <div
                  key={div.key}
                  onClick={() => {
                    setSelectedKpiDivision(div.key);
                    setDrillDownActive(true);
                  }}
                  className={`relative ${styles.bgColor} p-5 rounded-2xl border ${styles.borderColor} ${styles.hoverBorderColor} hover:ring-2 ${styles.hoverRingColor} shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col items-center justify-between space-y-4 select-none overflow-hidden pt-6`}
                >
                  {/* Elegant status line at the top of the card */}
                  <div className={`absolute top-0 left-0 right-0 h-[3.5px] ${styles.accentColor}`} />

                  {/* Top content */}
                  <div className="text-center w-full min-h-[36px] flex flex-col justify-center">
                    <span className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight leading-tight line-clamp-2">
                      {div.name}
                    </span>
                  </div>

                  {/* Elegant Gauge Half Circle - Enlarged for perfect readability */}
                  <div className="relative w-full h-44 flex items-center justify-center overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 12, left: 0, right: 0, bottom: 0 }}>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="95%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={68}
                          outerRadius={92}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill={gaugeColor} />
                          <Cell fill="#cbd5e1" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
                      <span className="text-3xl font-black text-slate-800 font-mono tracking-tight leading-none">
                        {percentage}%
                      </span>
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">Rerata Capaian</span>
                    </div>
                  </div>

                  {/* Stasiun division info indicator */}
                  <div className="w-full flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200/80 pt-2">
                    <span className="font-semibold">Lihat Rincian Indikator</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${styles.textColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 2. DRILL DOWN VIEW: Level 3 Capaian Kinerja (Detail Grafik Capaian) */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f8fafc] rounded-xl shadow-xs border border-slate-200 shrink-0">
                  {getDivisionIcon(selectedDivData?.iconName || '')}
                </div>
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block font-mono">
                    PENANGGUNG JAWAB: {selectedDivData?.pic}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {selectedDivData?.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                  selectedDivData?.status === 'Aktif' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : selectedDivData?.status === 'Evaluasi'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  PK: {selectedDivData?.status}
                </span>
                <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded">
                  Rerata: {adjustedDivPercentage}%
                </span>
              </div>
            </div>

            {/* Custom spacious metrics grid list containing high-fidelity half circle gauges */}
            <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  Daftar Ketercapaian Indikator (Level 3)
                </h4>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold font-mono px-2.5 py-1 rounded-md border border-indigo-100">
                  Periode: {selectedKpiPeriod === 'Bulanan' ? `Bulanan (${INDONESIAN_MONTHS[selectedKpiMonth]})` : selectedKpiPeriod}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adjustedObjectives.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-400 italic col-span-full bg-white rounded-2xl border border-dashed border-slate-200">
                    Belum ada target PK aktif untuk periode {selectedKpiPeriod === 'Bulanan' ? `Bulanan (${INDONESIAN_MONTHS[selectedKpiMonth]})` : selectedKpiPeriod}
                  </div>
                ) : (
                  adjustedObjectives.map((obj, idx) => {
                    const objPercentage = obj.percentage || 0;
                    const fillPct = Math.min(100, Math.max(0, objPercentage));
                    const remPct = 100 - fillPct;
                    const objGaugeData = [
                      { value: fillPct },
                      { value: remPct }
                    ];

                    const level3Palettes = [
                      {
                        gaugeColor: '#10b981', // Emerald
                        textColor: 'text-emerald-600',
                        accentColor: 'bg-emerald-500',
                        bgColor: 'bg-emerald-50/5 hover:bg-emerald-50/15',
                        borderColor: 'border-emerald-100/80',
                        hoverBorderColor: 'hover:border-emerald-400',
                      },
                      {
                        gaugeColor: '#0ea5e9', // Sky
                        textColor: 'text-sky-600',
                        accentColor: 'bg-sky-500',
                        bgColor: 'bg-sky-50/5 hover:bg-sky-50/15',
                        borderColor: 'border-sky-100/80',
                        hoverBorderColor: 'hover:border-sky-400',
                      },
                      {
                        gaugeColor: '#8b5cf6', // Violet
                        textColor: 'text-violet-600',
                        accentColor: 'bg-violet-500',
                        bgColor: 'bg-violet-50/5 hover:bg-violet-50/15',
                        borderColor: 'border-violet-100/80',
                        hoverBorderColor: 'hover:border-violet-400',
                      },
                      {
                        gaugeColor: '#f59e0b', // Amber
                        textColor: 'text-amber-600',
                        accentColor: 'bg-amber-500',
                        bgColor: 'bg-amber-50/5 hover:bg-amber-50/15',
                        borderColor: 'border-amber-100/80',
                        hoverBorderColor: 'hover:border-amber-400',
                      },
                      {
                        gaugeColor: '#ec4899', // Pink
                        textColor: 'text-pink-600',
                        accentColor: 'bg-pink-50/5 hover:bg-pink-50/15',
                        borderColor: 'border-pink-100/80',
                        hoverBorderColor: 'hover:border-pink-400',
                      },
                      {
                        gaugeColor: '#6366f1', // Indigo
                        textColor: 'text-indigo-600',
                        accentColor: 'bg-indigo-500',
                        bgColor: 'bg-indigo-50/5 hover:bg-indigo-50/15',
                        borderColor: 'border-indigo-100/80',
                        hoverBorderColor: 'hover:border-indigo-400',
                      },
                      {
                        gaugeColor: '#14b8a6', // Teal
                        textColor: 'text-teal-600',
                        accentColor: 'bg-teal-500',
                        bgColor: 'bg-teal-50/5 hover:bg-teal-50/15',
                        borderColor: 'border-teal-100/80',
                        hoverBorderColor: 'hover:border-teal-400',
                      },
                      {
                        gaugeColor: '#f97316', // Orange
                        textColor: 'text-orange-600',
                        accentColor: 'bg-orange-500',
                        bgColor: 'bg-orange-50/5 hover:bg-orange-50/15',
                        borderColor: 'border-orange-100/80',
                        hoverBorderColor: 'hover:border-orange-400',
                      },
                      {
                        gaugeColor: '#06b6d4', // Cyan
                        textColor: 'text-cyan-600',
                        accentColor: 'bg-cyan-500',
                        bgColor: 'bg-cyan-50/5 hover:bg-cyan-50/15',
                        borderColor: 'border-cyan-100/80',
                        hoverBorderColor: 'hover:border-cyan-400',
                      },
                      {
                        gaugeColor: '#d946ef', // Fuchsia
                        textColor: 'text-fuchsia-600',
                        accentColor: 'bg-fuchsia-500',
                        bgColor: 'bg-fuchsia-50/5 hover:bg-fuchsia-50/15',
                        borderColor: 'border-fuchsia-100/80',
                        hoverBorderColor: 'hover:border-fuchsia-400',
                      }
                    ];

                    const palette = level3Palettes[idx % level3Palettes.length];

                    return (
                      <div 
                        key={obj.id} 
                        className={`relative p-5 rounded-2xl border ${palette.borderColor} ${palette.bgColor} flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md ${palette.hoverBorderColor} transition-all duration-300 overflow-hidden pt-6`}
                      >
                        {/* Elegant status line at the top of the card */}
                        <div className={`absolute top-0 left-0 right-0 h-[3.5px] ${palette.accentColor}`} />

                        {/* Title block */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[8px] font-black text-slate-400 font-mono tracking-wider block">INDIKATOR SASARAN</span>
                          <span className="text-xs font-bold text-slate-800 leading-snug line-clamp-2" title={obj.indicatorName}>
                            {obj.indicatorName}
                          </span>
                        </div>

                        {/* Individual Half Circle Gauge instead of standard linear progress */}
                        <div className="relative w-full h-36 flex items-center justify-center overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
                              <Pie
                                data={objGaugeData}
                                cx="50%"
                                cy="95%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                <Cell fill={palette.gaugeColor} />
                                <Cell fill="#cbd5e1" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Gauge center percentage */}
                          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
                            <span className={`text-3xl font-black font-mono tracking-tight leading-none ${palette.textColor}`}>
                              {objPercentage}%
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">TERCAPAI</span>
                          </div>
                        </div>

                        {/* Metrics footer */}
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[10px]">
                          <div className="bg-[#f8fafc] p-2 rounded-lg border border-slate-200/50 min-w-0">
                            <span className="text-[8px] text-slate-400 block font-mono">TARGET</span>
                            <span className="font-extrabold text-slate-700 font-mono truncate block" title={obj.target}>{obj.target}</span>
                          </div>
                          <div className="bg-[#f8fafc] p-2 rounded-lg border border-slate-200/50 min-w-0">
                            <span className="text-[8px] text-slate-400 block font-mono">REALISASI</span>
                            <span className="font-extrabold text-slate-700 font-mono truncate block" title={`${obj.achievement} ${obj.unit}`}>{obj.achievement} {obj.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <button
                onClick={() => setDrillDownActive(false)}
                className="px-4 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Dashboard 6 Bidang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
