import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  GitFork
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
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ month: string; value: number } | null>(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<string | null>(null);

  // States for Chronological IKP Trends per Division
  const [activeTrendDivision, setActiveTrendDivision] = useState<string>('Pemberitaan');
  const [trendPeriodType, setTrendPeriodType] = useState<'triwulan' | 'semester'>('triwulan');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(3); // Default to Q4 (index 3)

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
    const newsCount = newsReports.filter(r => r.type === 'Berita').length;
    const socialCount = newsReports.filter(r => r.type === 'Konten Media Sosial').length;
    
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
      newsCount,
      socialCount,
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

  // Historical and real-time trend data generator for IKP per division per triwulan & semester
  const trendIkpData = useMemo(() => {
    // Dynamically retrieve real-time achievements from stats
    const realPmbNews = newsStats.totalReports || 18; 
    const realLpuPnbp = lpuStats.totalRealisasi || 120; 
    const realTmbKeandalan = divisionAgreementsStats.tmb.objectives.find(o => o.indicatorName.includes('Keandalan') || o.id === 'ind-9')?.achievement || 99.5;
    const realKmbKonten = divisionAgreementsStats.kmb.objectives.find(o => o.indicatorName.includes('Jumlah') || o.id === 'ind-10')?.achievement || 18;
    const realSiaranSkor = divisionAgreementsStats.siaran.objectives.find(o => o.indicatorName.includes('Kualitas') || o.id === 'ind-7')?.achievement || 86;
    const realTuLaporan = divisionAgreementsStats.tu.objectives.find(o => o.indicatorName.includes('Keandalan') || o.id === 'ind-5')?.achievement || 95;

    return {
      'Pemberitaan': [
        {
          id: 'pemb-ikp1',
          name: 'Akurasi & Ketepatan Siaran Berita',
          unit: '%',
          target: 100,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 95.5, Target: 100 },
            { period: 'Q2 2026', Realisasi: 97.2, Target: 100 },
            { period: 'Q3 2026', Realisasi: 99.0, Target: 100 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: 100, Target: 100 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 96.35, Target: 100 },
            { period: 'Semester 2 (Real-Time)', Realisasi: 100, Target: 100 }
          ]
        },
        {
          id: 'pemb-ikp2',
          name: 'Jumlah Produksi Berita Utama & Daerah',
          unit: 'Berita',
          target: 100,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 40, Target: 100 },
            { period: 'Q2 2026', Realisasi: 75, Target: 100 },
            { period: 'Q3 2026', Realisasi: 90, Target: 100 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: realPmbNews, Target: 100 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 57.5, Target: 100 },
            { period: 'Semester 2 (Real-Time)', Realisasi: realPmbNews, Target: 100 }
          ]
        }
      ],
      'Layanan Pengembangan Usaha': [
        {
          id: 'lpu-ikp1',
          name: 'Capaian PNBP Kerjasama & Iklan',
          unit: 'Jt Rp',
          target: lpuStats.targetCapaian || 150,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 35, Target: lpuStats.targetCapaian || 150 },
            { period: 'Q2 2026', Realisasi: 70, Target: lpuStats.targetCapaian || 150 },
            { period: 'Q3 2026', Realisasi: 105, Target: lpuStats.targetCapaian || 150 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: realLpuPnbp, Target: lpuStats.targetCapaian || 150 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 52.5, Target: lpuStats.targetCapaian || 150 },
            { period: 'Semester 2 (Real-Time)', Realisasi: realLpuPnbp, Target: lpuStats.targetCapaian || 150 }
          ]
        },
        {
          id: 'lpu-ikp2',
          name: 'Jumlah Kemitraan Usaha Aktif',
          unit: 'Mitra',
          target: 12,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 4, Target: 12 },
            { period: 'Q2 2026', Realisasi: 7, Target: 12 },
            { period: 'Q3 2026', Realisasi: 10, Target: 12 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: lpuStats.totalContracts || 11, Target: 12 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 5.5, Target: 12 },
            { period: 'Semester 2 (Real-Time)', Realisasi: lpuStats.totalContracts || 11, Target: 12 }
          ]
        }
      ],
      'Teknologi dan Media Baru': [
        {
          id: 'tmb-ikp1',
          name: 'Keandalan Streaming App & Pemancar Radio',
          unit: '%',
          target: 100,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 98.8, Target: 100 },
            { period: 'Q2 2026', Realisasi: 99.2, Target: 100 },
            { period: 'Q3 2026', Realisasi: 99.5, Target: 100 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: realTmbKeandalan, Target: 100 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 99.0, Target: 100 },
            { period: 'Semester 2 (Real-Time)', Realisasi: realTmbKeandalan, Target: 100 }
          ]
        },
        {
          id: 'tmb-ikp2',
          name: 'Peralatan Siaran Ter-Digitalisasi',
          unit: '%',
          target: 100,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 65, Target: 100 },
            { period: 'Q2 2026', Realisasi: 78, Target: 100 },
            { period: 'Q3 2026', Realisasi: 88, Target: 100 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: 95, Target: 100 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 71.5, Target: 100 },
            { period: 'Semester 2 (Real-Time)', Realisasi: 95, Target: 100 }
          ]
        }
      ],
      'Konten Media Baru': [
        {
          id: 'kmb-ikp1',
          name: 'Jumlah Konten Visual Interaktif Bulanan',
          unit: 'Konten',
          target: 20,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 12, Target: 20 },
            { period: 'Q2 2026', Realisasi: 16, Target: 20 },
            { period: 'Q3 2026', Realisasi: 18, Target: 20 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: realKmbKonten, Target: 20 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 14, Target: 20 },
            { period: 'Semester 2 (Real-Time)', Realisasi: realKmbKonten, Target: 20 }
          ]
        },
        {
          id: 'kmb-ikp2',
          name: 'Tingkat Engagement Media Sosial',
          unit: '%',
          target: 5.0,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 3.2, Target: 5.0 },
            { period: 'Q2 2026', Realisasi: 3.9, Target: 5.0 },
            { period: 'Q3 2026', Realisasi: 4.4, Target: 5.0 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: 4.8, Target: 5.0 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 3.55, Target: 5.0 },
            { period: 'Semester 2 (Real-Time)', Realisasi: 4.6, Target: 5.0 }
          ]
        }
      ],
      'Siaran': [
        {
          id: 'siar-ikp1',
          name: 'Kualitas Konten On-Air Program RRI',
          unit: 'Skor',
          target: 88,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 80, Target: 88 },
            { period: 'Q2 2026', Realisasi: 83, Target: 88 },
            { period: 'Q3 2026', Realisasi: 85, Target: 88 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: realSiaranSkor, Target: 88 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 81.5, Target: 88 },
            { period: 'Semester 2 (Real-Time)', Realisasi: realSiaranSkor, Target: 88 }
          ]
        },
        {
          id: 'siar-ikp2',
          name: 'Indeks Kepuasan Pendengar Layanan Publik',
          unit: 'Skor',
          target: 90,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 82, Target: 90 },
            { period: 'Q2 2026', Realisasi: 84, Target: 90 },
            { period: 'Q3 2026', Realisasi: 87, Target: 90 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: 89, Target: 90 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 83, Target: 90 },
            { period: 'Semester 2 (Real-Time)', Realisasi: 88, Target: 90 }
          ]
        }
      ],
      'Tata Usaha / Umum': [
        {
          id: 'tu-ikp1',
          name: 'Keandalan Laporan Administrasi & Keuangan',
          unit: '%',
          target: 100,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 90, Target: 100 },
            { period: 'Q2 2026', Realisasi: 94, Target: 100 },
            { period: 'Q3 2026', Realisasi: 97, Target: 100 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: realTuLaporan, Target: 100 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 92, Target: 100 },
            { period: 'Semester 2 (Real-Time)', Realisasi: realTuLaporan, Target: 100 }
          ]
        },
        {
          id: 'tu-ikp2',
          name: 'Ketersediaan Logistik & Prasarana Siaran',
          unit: '%',
          target: 98,
          triwulan: [
            { period: 'Q1 2026', Realisasi: 92, Target: 98 },
            { period: 'Q2 2026', Realisasi: 95, Target: 98 },
            { period: 'Q3 2026', Realisasi: 96, Target: 98 },
            { period: 'Q4 2026 (Real-Time)', Realisasi: 98, Target: 98 }
          ],
          semester: [
            { period: 'Semester 1', Realisasi: 93.5, Target: 98 },
            { period: 'Semester 2 (Real-Time)', Realisasi: 97, Target: 98 }
          ]
        }
      ]
    };
  }, [newsStats, lpuStats, divisionAgreementsStats]);

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

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Notification Warning Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Dashboard Real-Time
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ikhtisar Kinerja Eksekutif</h1>
          <p className="text-sm text-slate-500">Mendukung pengambilan keputusan pimpinan secara taktis dan terarah.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Alert Trigger */}
          <button
            onClick={triggerAlertSimulation}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all border border-rose-100 shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            Kirim Notifikasi Kritis
          </button>
        </div>
      </div>

      {/* Two Column Layout: Left (Pemberitaan), Right (LPU) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Capaian Kinerja Pemberitaan & Media Baru */}
        <div className="bg-gradient-to-br from-rose-50/60 via-white to-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-rose-500" />
                  Capaian Kinerja Pemberitaan
                </h2>
                <p className="text-[11px] text-slate-500">
                  Realisasi produksi berita harian, konten media sosial kreatif, dan kontribusi reporter.
                </p>
              </div>
              <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-100 shrink-0">
                Pemberitaan & Media Baru
              </span>
            </div>

            {/* Stats Row inside left column */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Total Produksi</span>
                <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">{newsStats.totalReports} Konten</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Komposisi</span>
                <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">{newsStats.newsCount} Berita • {newsStats.socialCount} Medsos</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Rerata Harian</span>
                <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">{newsStats.avgDaily} Rilis</p>
              </div>
            </div>

            {/* Progress Radial Gauge & Quick Explanation */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="100" height="100" className="transform -rotate-90">
                  {(() => {
                    const radius = 38;
                    const circumference = 2 * Math.PI * radius;
                    const progressStroke = (Math.min(120, newsStats.monthlyPct) / 100) * circumference;
                    return (
                      <>
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f43f5e" strokeWidth="10" strokeDasharray={`${progressStroke} ${circumference}`} strokeLinecap="round" className="transition-all duration-500" />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-slate-800 font-mono">{newsStats.monthlyPct}%</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Capaian</span>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700">Rasio Kontribusi Sasaran</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Telah terbit <strong className="text-rose-600 font-mono">{newsStats.totalReports} konten</strong> dari target bulanan gabungan stasiun sebesar <strong className="text-slate-700 font-mono">{newsStats.totalMonthlyTarget} konten</strong>.
                </p>
              </div>
            </div>

            {/* Reporter Progress Section */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-700">Realisasi & Kontribusi per Reporter</h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {newsStats.reporterProgress.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 italic">Belum ada target reporter terdaftar</div>
                ) : (
                  newsStats.reporterProgress.map((rep) => (
                    <div key={rep.id} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-600">{rep.name}</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {rep.count} / {rep.target} <span className="text-[10px] text-slate-400 font-normal">({rep.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, rep.percentage)}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kontribusi publikasi mengalir langsung ke Sasaran Strategis level 1</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Capaian LPU */}
        <div className="bg-gradient-to-br from-indigo-50/60 via-white to-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-indigo-600" />
                  Capaian Kinerja LPU
                </h2>
                <p className="text-[11px] text-slate-500">
                  Analisis realisasi Pendapatan Negara Bukan Pajak (PNBP) Layanan Pengembangan Usaha.
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                Pengembangan Usaha (LPU)
              </span>
            </div>

            {/* Stats Row inside right column */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Realisasi PNBP</span>
                <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">Rp {lpuStats.totalRealisasi} Jt</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Kontrak Mitra</span>
                <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">{lpuStats.totalContracts} Mitra</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Sisa Target</span>
                <p className="text-xs font-bold text-indigo-600 font-mono mt-0.5 truncate">
                  {lpuStats.targetCapaian > lpuStats.totalRealisasi ? `Rp ${lpuStats.targetCapaian - lpuStats.totalRealisasi} Jt` : 'Tercapai! 🎉'}
                </p>
              </div>
            </div>

            {/* Progress Radial Gauge & Quick Explanation */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="100" height="100" className="transform -rotate-90">
                  {(() => {
                    const radius = 38;
                    const circumference = 2 * Math.PI * radius;
                    const progressStroke = (Math.min(120, lpuStats.achievementPercentage) / 100) * circumference;
                    return (
                      <>
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#4f46e5" strokeWidth="10" strokeDasharray={`${progressStroke} ${circumference}`} strokeLinecap="round" className="transition-all duration-500" />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-slate-800 font-mono">{lpuStats.achievementPercentage}%</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Tercapai</span>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700">Rasio PNBP Tahun 2026</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tercapai <strong className="text-indigo-600 font-mono">Rp {lpuStats.totalRealisasi} Jt</strong> dari target APBN stasiun sebesar <strong className="text-slate-700 font-mono">Rp {lpuStats.targetCapaian} Jt</strong>.
                </p>
              </div>
            </div>

            {/* Contribution by Type */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-700">Kontribusi Pendapatan LPU</h4>
              <div className="space-y-2.5">
                {['Iklan/Siar Layanan', 'Sewa Lahan/Menara', 'Sponsorship Acara'].map((type) => {
                  const amount = lpuStats.contributionByType[type] || 0;
                  const percentage = lpuStats.totalRealisasi > 0 ? Math.round((amount / lpuStats.totalRealisasi) * 100) : 0;
                  let barColor = 'bg-indigo-600';
                  if (type === 'Sewa Lahan/Menara') barColor = 'bg-sky-500';
                  if (type === 'Sponsorship Acara') barColor = 'bg-emerald-500';
                  
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-600">{type}</span>
                        <span className="font-bold text-slate-800 font-mono">
                          Rp {amount} Jt <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Target PNBP disinkronisasikan berkala dengan laporan KPPN</span>
          </div>
        </div>

      </div>

      {/* Capaian Bidang Operasional Lainnya: TMB, KMB, Siaran, Tata Usaha */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            Capaian Kinerja Bidang Operasional Lainnya
          </h2>
          <p className="text-xs text-slate-500">
            Realisasi dan status pencapaian target berdasarkan Perjanjian Kerja (PK) yang didelegasikan pada masing-masing bidang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card TMB */}
          <div className="bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    Teknologi dan Media Baru (TMB)
                  </h3>
                  <span className="text-[10px] text-slate-400 block font-medium">PIC: {divisionAgreementsStats.tmb.PIC}</span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md font-mono shrink-0">
                  {divisionAgreementsStats.tmb.percentage}% Capaian
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${divisionAgreementsStats.tmb.percentage}%` }} />
              </div>

              <div className="space-y-2.5 pt-1">
                {divisionAgreementsStats.tmb.objectives.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">Belum ada target kinerja aktif</div>
                ) : (
                  divisionAgreementsStats.tmb.objectives.map((obj) => {
                    const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                    return (
                      <div key={obj.id} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start text-[11px] gap-2">
                          <span className="font-semibold text-slate-600 leading-snug">{obj.indicatorName}</span>
                          <span className="font-extrabold text-slate-800 font-mono whitespace-nowrap">
                            {obj.achievement}{obj.unit} / {obj.target}{obj.unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Realisasi</span>
                          <span className="font-bold text-emerald-600 font-mono">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100/60 pt-2 shrink-0">
              Sinergi keandalan transmisi, pemancar FM, dan infrastruktur streaming.
            </div>
          </div>

          {/* Card KMB */}
          <div className="bg-gradient-to-br from-pink-50/60 via-white to-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full" />
                    Konten Media Baru (KMB)
                  </h3>
                  <span className="text-[10px] text-slate-400 block font-medium">PIC: {divisionAgreementsStats.kmb.PIC}</span>
                </div>
                <span className="bg-pink-50 text-pink-700 text-xs font-bold px-2 py-1 rounded-md font-mono shrink-0">
                  {divisionAgreementsStats.kmb.percentage}% Capaian
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${divisionAgreementsStats.kmb.percentage}%` }} />
              </div>

              <div className="space-y-2.5 pt-1">
                {divisionAgreementsStats.kmb.objectives.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">Belum ada target kinerja aktif</div>
                ) : (
                  divisionAgreementsStats.kmb.objectives.map((obj) => {
                    const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                    return (
                      <div key={obj.id} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start text-[11px] gap-2">
                          <span className="font-semibold text-slate-600 leading-snug">{obj.indicatorName}</span>
                          <span className="font-extrabold text-slate-800 font-mono whitespace-nowrap">
                            {obj.achievement}{obj.unit} / {obj.target}{obj.unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Realisasi</span>
                          <span className="font-bold text-pink-600 font-mono">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100/60 pt-2 shrink-0">
              Produksi konten infografis, video kreatif, dan interaksi publik multi-platform.
            </div>
          </div>

          {/* Card Siaran */}
          <div className="bg-gradient-to-br from-sky-50/60 via-white to-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
                    Siaran
                  </h3>
                  <span className="text-[10px] text-slate-400 block font-medium">PIC: {divisionAgreementsStats.siaran.PIC}</span>
                </div>
                <span className="bg-sky-50 text-sky-700 text-xs font-bold px-2 py-1 rounded-md font-mono shrink-0">
                  {divisionAgreementsStats.siaran.percentage}% Capaian
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${divisionAgreementsStats.siaran.percentage}%` }} />
              </div>

              <div className="space-y-2.5 pt-1">
                {divisionAgreementsStats.siaran.objectives.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">Belum ada target kinerja aktif</div>
                ) : (
                  divisionAgreementsStats.siaran.objectives.map((obj) => {
                    const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                    return (
                      <div key={obj.id} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start text-[11px] gap-2">
                          <span className="font-semibold text-slate-600 leading-snug">{obj.indicatorName}</span>
                          <span className="font-extrabold text-slate-800 font-mono whitespace-nowrap">
                            {obj.achievement}{obj.unit} / {obj.target}{obj.unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Realisasi</span>
                          <span className="font-bold text-sky-600 font-mono">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100/60 pt-2 shrink-0">
              Pemantauan mutu on-air, penyusunan rundown, dan pengawasan regulasi penyiaran stasiun.
            </div>
          </div>

          {/* Card Tata Usaha */}
          <div className="bg-gradient-to-br from-purple-50/60 via-white to-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                    Tata Usaha / Umum
                  </h3>
                  <span className="text-[10px] text-slate-400 block font-medium">PIC: {divisionAgreementsStats.tu.PIC}</span>
                </div>
                <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded-md font-mono shrink-0">
                  {divisionAgreementsStats.tu.percentage}% Capaian
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${divisionAgreementsStats.tu.percentage}%` }} />
              </div>

              <div className="space-y-2.5 pt-1">
                {divisionAgreementsStats.tu.objectives.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">Belum ada target kinerja aktif</div>
                ) : (
                  divisionAgreementsStats.tu.objectives.slice(0, 3).map((obj) => {
                    const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                    return (
                      <div key={obj.id} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start text-[11px] gap-2">
                          <span className="font-semibold text-slate-600 leading-snug">{obj.indicatorName}</span>
                          <span className="font-extrabold text-slate-800 font-mono whitespace-nowrap">
                            {obj.achievement}{obj.unit} / {obj.target}{obj.unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Realisasi</span>
                          <span className="font-bold text-purple-600 font-mono">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100/60 pt-2 shrink-0">
              Pelayanan ketatausahaan, fasilitasi logistik umum, dan pertanggungjawaban anggaran DIPA.
            </div>
          </div>

        </div>
      </div>



      {/* SECTION VISUALISASI CAPAIAN IKP PER DIVISI (HALF CIRCLE GAUGES) */}
      <div id="trend-pimpinan-section" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600 animate-pulse" />
              Capaian Indikator Kinerja Program (IKP) per Divisi/Bagian
            </h2>
            <p className="text-xs text-slate-500">
              Persentase ketercapaian target IKP per bidang kerja. Pilih jenis periode dan kuartal untuk membandingkan performa.
            </p>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Period Type Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setTrendPeriodType('triwulan');
                  setSelectedPeriodIndex(3); // Default to Q4 (Real-Time)
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trendPeriodType === 'triwulan'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Triwulan
              </button>
              <button
                onClick={() => {
                  setTrendPeriodType('semester');
                  setSelectedPeriodIndex(1); // Default to S2 (Real-Time)
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trendPeriodType === 'semester'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semester
              </button>
            </div>

            {/* Individual Period Segment Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
              {(trendPeriodType === 'triwulan' 
                ? [
                    { label: 'Q1', index: 0 },
                    { label: 'Q2', index: 1 },
                    { label: 'Q3', index: 2 },
                    { label: 'Q4 (Real)', index: 3 }
                  ]
                : [
                    { label: 'S1', index: 0 },
                    { label: 'S2 (Real)', index: 1 }
                  ]
              ).map((p) => {
                const isActive = selectedPeriodIndex === p.index;
                return (
                  <button
                    key={p.label}
                    onClick={() => setSelectedPeriodIndex(p.index)}
                    className={`px-2.5 py-1.5 text-xs font-black rounded-lg transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Period Banner */}
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-slate-500">Menampilkan Data Capaian:</span>
            <span className="font-extrabold text-slate-800">
              {trendPeriodType === 'triwulan' 
                ? `Triwulan ${selectedPeriodIndex + 1 === 4 ? 'IV (Real-Time)' : selectedPeriodIndex + 1}`
                : `Semester ${selectedPeriodIndex + 1 === 2 ? 'II (Real-Time)' : selectedPeriodIndex + 1}`
              }
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">STATUS: AKTIF</span>
        </div>

        {/* Division Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(trendIkpData).map(([divisionName, ikps]: [string, any]) => {
            const getDivisionIcon = (divName: string) => {
              switch (divName) {
                case 'Pemberitaan': return <Globe className="w-4 h-4 text-sky-500" />;
                case 'Layanan Pengembangan Usaha': return <Handshake className="w-4 h-4 text-indigo-500" />;
                case 'Teknologi dan Media Baru': return <Layers className="w-4 h-4 text-emerald-500" />;
                case 'Konten Media Baru': return <Sparkles className="w-4 h-4 text-pink-500" />;
                case 'Siaran': return <Target className="w-4 h-4 text-amber-500" />;
                case 'Tata Usaha / Umum': return <Users className="w-4 h-4 text-violet-500" />;
                default: return <FileText className="w-4 h-4 text-slate-500" />;
              }
            };

            return (
              <div 
                key={divisionName} 
                className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
              >
                {/* Division Header */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {getDivisionIcon(divisionName)}
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {divisionName === 'Pemberitaan' ? 'Pemberitaan & Media Baru' : divisionName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                    {divisionName === 'Pemberitaan' && 'Produksi dan penyebaran berita utama & daerah serta akurasi siaran berita.'}
                    {divisionName === 'Layanan Pengembangan Usaha' && 'Optimalisasi PNBP, sewa aset, sponsorship, dan kemitraan aktif.'}
                    {divisionName === 'Teknologi dan Media Baru' && 'Keandalan pemancar radio, streaming aplikasi RRI Digital, dan digitalisasi.'}
                    {divisionName === 'Konten Media Baru' && 'Kreasi konten visual interaktif dan optimasi engagement media sosial.'}
                    {divisionName === 'Siaran' && 'Kualitas konten on-air program siaran RRI dan kepuasan pendengar.'}
                    {divisionName === 'Tata Usaha / Umum' && 'Fasilitasi logistik umum, tata kelola keuangan, administrasi, dan pelaporan.'}
                  </p>
                </div>

                {/* Gauges Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  {ikps.map((ikp: any) => {
                    const periodData = trendPeriodType === 'triwulan' ? ikp.triwulan : ikp.semester;
                    const activePoint = periodData[Math.min(selectedPeriodIndex, periodData.length - 1)] || periodData[periodData.length - 1];
                    const realisasiVal = activePoint?.Realisasi || 0;
                    const targetVal = activePoint?.Target || ikp.target || 100;

                    const percentage = targetVal > 0 ? Math.round((realisasiVal / targetVal) * 100) : 0;
                    const fillPercentage = Math.min(100, Math.max(0, percentage));
                    const remaining = 100 - fillPercentage;

                    // Let's set the gauge colors dynamically
                    let gaugeColor = '#10b981'; // Emerald for excellent (>= 90%)
                    if (percentage < 50) {
                      gaugeColor = '#f43f5e'; // Rose for critical (< 50%)
                    } else if (percentage < 90) {
                      gaugeColor = '#f59e0b'; // Amber for warning (50% - 89%)
                    }

                    const gaugeData = [
                      { value: fillPercentage },
                      { value: remaining }
                    ];

                    return (
                      <div key={ikp.id} className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-between space-y-2.5">
                        <div className="text-center w-full min-h-[34px] flex flex-col justify-center">
                          <span className="text-[10px] font-extrabold text-slate-600 line-clamp-2 leading-tight">
                            {ikp.name}
                          </span>
                        </div>

                        {/* Recharts Half Circle */}
                        <div className="relative w-full h-20 flex items-center justify-center overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
                              <Pie
                                data={gaugeData}
                                cx="50%"
                                cy="95%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={34}
                                outerRadius={48}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                <Cell fill={gaugeColor} />
                                <Cell fill="#e2e8f0" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Absolute labels inside the gauge */}
                          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
                            <span className="text-sm font-black text-slate-800 font-mono tracking-tight leading-none">
                              {percentage}%
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Capaian</span>
                          </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-1 text-center border-t border-slate-150 pt-2 text-[10px]">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Realisasi</span>
                            <span className="font-extrabold text-indigo-600 font-mono truncate">
                              {realisasiVal} <span className="text-[8px] font-medium text-slate-500 font-sans">{ikp.unit}</span>
                            </span>
                          </div>
                          <div className="flex flex-col border-l border-slate-150 min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Target</span>
                            <span className="font-extrabold text-slate-700 font-mono truncate">
                              {targetVal} <span className="text-[8px] font-medium text-slate-500 font-sans">{ikp.unit}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Main Stats Charts Grid (Gender, Division, Education) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gender Distribution Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-sky-500" />
              Rasio Gender Pegawai
            </h3>
            <p className="text-xs text-slate-400">Distribusi gender pegawai berdasarkan data terpilih.</p>
          </div>

          <div className="relative py-6 flex items-center justify-center">
            {filteredEmployees.length === 0 ? (
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
                     `${filteredEmployees.length}`}
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
            Pimpinan dapat melacak rasio kekuatan sdm operasional.
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

      {/* Critical Warnings Alert notifications panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
              <Bell className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Peringatan Metrik Kritis Kepegawaian</h3>
              <p className="text-[11px] text-slate-500">Notifikasi push langsung untuk mitigasi risiko cepat.</p>
            </div>
          </div>
          <span className="bg-rose-100 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">
            {notifications.filter(n => !n.isRead).length} Belum Dibaca
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Tidak ada peringatan metrik kritis terdeteksi saat ini. Sistem berjalan stabil.
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 md:p-5 flex gap-4 transition-colors ${
                  notif.isRead ? 'bg-white opacity-70' : 'bg-rose-50/20'
                }`}
              >
                <div className={`p-2 rounded-xl h-fit ${
                  notif.type === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {notif.title}
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  
                  {notif.metricName && (
                    <div className="flex gap-2 items-center pt-1.5">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {notif.metricName}
                      </span>
                      <span className="text-xs font-bold text-rose-600 font-mono">
                        {notif.metricValue}
                      </span>
                    </div>
                  )}
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => onReadNotification(notif.id)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 transition-all h-fit self-center"
                  >
                    Tandai Dibaca
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
