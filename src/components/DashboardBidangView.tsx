import React from 'react';
import { IndicatorTitleDisplay } from './IndicatorTitleDisplay';
import { getGaugeColorByPercentage } from "../utils/colors";
import { getInitials, getAvatarColor } from "../utils/roleHelper";
import { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Employee, PerformanceAgreement, CooperationContract, ReporterTarget, NewsReport, InstitutionalIdentity, AppSettings } from '../types';
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
  Sparkles,
  Download,
  Printer,
  Filter,
  ListFilter,
  Building2,
  Users,
  RotateCcw,
  FolderKanban,
  Check,
  Info
} from 'lucide-react';
import NewsDetailModal from './NewsDetailModal';
import QuickReportModal from './QuickReportModal';
import { filterNewsForIndicator, isEligibleNewsIndicator } from '../utils/newsFilter';
import StatistikKepatuhanPelatihanBidang from './kepegawaian/StatistikKepatuhanPelatihanBidang';

export interface SubTeamInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  keywords: string[];
}

export const DIVISIONS_LIST = [
  'Tata Usaha / Umum',
  'Siaran',
  'Pemberitaan',
  'Teknologi dan Media Baru',
  'Konten Media Baru',
  'Layanan Pengembangan Usaha'
] as const;

export const DIVISION_SUBTEAMS: Record<string, SubTeamInfo[]> = {
  'Tata Usaha / Umum': [
    {
      id: 'tu-sdm',
      name: 'Sub-Tim Kepegawaian & SDM',
      shortName: 'Kepegawaian',
      description: 'Pengelolaan ASN, SKP, disiplin, dan administrasi kepegawaian',
      keywords: ['kepegawaian', 'sdm', 'asn', 'skp', 'diklat', 'disiplin', 'kompetensi']
    },
    {
      id: 'tu-keuangan',
      name: 'Sub-Tim Keuangan & Perbendaharaan',
      shortName: 'Keuangan',
      description: 'Realisasi anggaran DIPA, LPJ, penggajian, dan perbendaharaan',
      keywords: ['anggaran', 'keuangan', 'dipa', 'penyerapan', 'lpj', 'perbendaharaan', 'sp2d']
    },
    {
      id: 'tu-bmn',
      name: 'Sub-Tim BMN & Rumah Tangga',
      shortName: 'BMN & RT',
      description: 'Inventarisasi aset negara, sarana prasarana, dan operasional kantor',
      keywords: ['bmn', 'aset', 'gedung', 'sarana', 'prasarana', 'rumah tangga', 'pemeliharaan']
    },
    {
      id: 'tu-sakip',
      name: 'Sub-Tim Tata Laksana, Hukum & SAKIP',
      shortName: 'SAKIP & Hukum',
      description: 'Akuntabilitas kinerja, SPIP, reformasi birokrasi, dan kepatuhan regulasi',
      keywords: ['sakip', 'lkjip', 'hukum', 'tata laksana', 'spip', 'rb', 'evaluasi', 'kepatuhan']
    }
  ],
  'Siaran': [
    {
      id: 'siaran-pro1',
      name: 'Sub-Tim Programa 1 (Kanal Informasi & Solusi)',
      shortName: 'Programa 1',
      description: 'Kanal informasi umum, dialog interaktif daerah, edukasi publik, dan religi',
      keywords: ['pro 1', 'pro1', 'programa 1', 'dialog', 'informasi', 'solusi', 'siaran umum']
    },
    {
      id: 'siaran-pro2',
      name: 'Sub-Tim Programa 2 (Kanal Suara Kreativitas)',
      shortName: 'Programa 2',
      description: 'Kanal musik, hiburan kaum muda, komunitas kreatif, dan edukasi remaja',
      keywords: ['pro 2', 'pro2', 'programa 2', 'kreativitas', 'musik', 'muda', 'hiburan', 'komunitas']
    },
    {
      id: 'siaran-pro4',
      name: 'Sub-Tim Programa 4 (Kanal Kebudayaan & Tradisi)',
      shortName: 'Programa 4',
      description: 'Pelestarian seni budaya Lampung, bahasa daerah, dan siaran tradisi nusantara',
      keywords: ['pro 4', 'pro4', 'programa 4', 'budaya', 'tradisi', 'seni', 'lampung', 'kearifan lokal']
    },
    {
      id: 'siaran-produksi',
      name: 'Sub-Tim Produksi Acara & Siaran Khusus',
      shortName: 'Produksi Acara',
      description: 'Feature radio, sandiwara audio, siaran langsung luar studio (OB Van), dan acara khusus',
      keywords: ['produksi', 'feature', 'sandiwara', 'khusus', 'ob van', 'siaran luar', 'paket']
    }
  ],
  'Pemberitaan': [
    {
      id: 'berita-liputan',
      name: 'Sub-Tim Liputan & Reportase Daerah',
      shortName: 'Liputan Lapangan',
      description: 'Wartawan/reporter investigasi, breaking news, dan liputan peristiwa daerah Lampung',
      keywords: ['liputan', 'reporter', 'wartawan', 'lapangan', 'investigasi', 'daerah', 'peristiwa']
    },
    {
      id: 'berita-redaksi',
      name: 'Sub-Tim Redaksi & Gatekeeping Berita',
      shortName: 'Redaksi & Editing',
      description: 'Penyuntingan naskah warta, editing audio, pengecekan fakta, dan kurasi berita',
      keywords: ['redaksi', 'gatekeeping', 'editing', 'naskah', 'akurasi', 'fakta', 'editor']
    },
    {
      id: 'berita-kbrn',
      name: 'Sub-Tim KBRN Online & Multiplatform Siber',
      shortName: 'KBRN Online',
      description: 'Portal berita daring rri.co.id / KBRN daerah Lampung dan distribusi digital',
      keywords: ['kbrn', 'online', 'portal', 'siber', 'web', 'rri.co.id', 'artikel', 'rilis']
    },
    {
      id: 'berita-buletin',
      name: 'Sub-Tim Buletin & Siaran Warta RRI',
      shortName: 'Buletin Warta',
      description: 'Warta Berita Lampung, Berita Pagi/Siang/Malam, dan Flash News siaran radio',
      keywords: ['buletin', 'warta', 'berita', 'siaran', 'flash news', 'siar', 'pemilu']
    }
  ],
  'Teknologi dan Media Baru': [
    {
      id: 'tmb-pemancar',
      name: 'Sub-Tim Pemancar & Transmisi MW/FM',
      shortName: 'Transmisi Pemancar',
      description: 'Pemeliharaan stasiun pemancar radio (Pahoman, Way Kanan), antena, dan daya pancar RF',
      keywords: ['pemancar', 'transmisi', 'fm', 'mw', 'rf', 'antena', 'power', 'on-air', 'coverage']
    },
    {
      id: 'tmb-it-studio',
      name: 'Sub-Tim IT, Studio Digital & Audio Jaringan',
      shortName: 'IT & Studio',
      description: 'Infrastruktur komputer, routing audio digital, automation system, LAN, dan server',
      keywords: ['it', 'studio', 'digital', 'audio', 'jaringan', 'server', 'komputer', 'automation']
    },
    {
      id: 'tmb-streaming',
      name: 'Sub-Tim Distribusi Streaming & Infrastruktur OTT',
      shortName: 'Streaming & OTT',
      description: 'Infrastruktur live audio/video streaming, backup server, dan interkoneksi internet',
      keywords: ['streaming', 'ott', 'distribusi', 'internet', 'bandwidth', 'koneksi', 'relay', 'infrastruktur']
    }
  ],
  'Konten Media Baru': [
    {
      id: 'kmb-video',
      name: 'Sub-Tim Produksi Video & Podcast Visual',
      shortName: 'Video & Podcast',
      description: 'Live streaming studio visual, video podcast YouTube RRI, dan program audio-visual',
      keywords: ['video', 'podcast', 'youtube', 'visual', 'live stream', 'kamera', 'editing video']
    },
    {
      id: 'kmb-medsos',
      name: 'Sub-Tim Media Sosial & Grafis Multiplatform',
      shortName: 'Medsos & Grafis',
      description: 'Konten Instagram, TikTok, Facebook, infografis berita, dan poster program',
      keywords: ['medsos', 'sosial', 'instagram', 'tiktok', 'facebook', 'grafis', 'desain', 'infografis']
    },
    {
      id: 'kmb-multiplatform',
      name: 'Sub-Tim RRI Digital App & Interaktivitas',
      shortName: 'Aplikasi RRI Digital',
      description: 'Optimalisasi tayangan aplikasi RRI Digital, engagement pendengar, dan analitik',
      keywords: ['rri digital', 'aplikasi', 'multiplatform', 'engagement', 'interaktivitas', 'analitik']
    }
  ],
  'Layanan Pengembangan Usaha': [
    {
      id: 'lpu-mitra',
      name: 'Sub-Tim Kemitraan & Kerjasama Strategis',
      shortName: 'Kemitraan & MoU',
      description: 'Inisiasi kerjasama dengan Pemda, BUMN, swasta, asosiasi, dan universitas',
      keywords: ['kemitraan', 'kerjasama', 'mou', 'pks', 'mitra', 'pemda', 'bumn', 'instansi']
    },
    {
      id: 'lpu-iklan',
      name: 'Sub-Tim Layanan Siaran Iklan, PSA & PNBP',
      shortName: 'Iklan & PNBP',
      description: 'Pengelolaan siaran iklan, spot layanan masyarakat, ad-libs, dan optimalisasi target PNBP',
      keywords: ['iklan', 'psa', 'pnbp', 'ad-libs', 'spot', 'sponsor', 'penerimaan', 'tarif']
    },
    {
      id: 'lpu-event',
      name: 'Sub-Tim Event Organizer Off-Air & Komersial',
      shortName: 'Event & Komersial',
      description: 'Penyelenggaraan event off-air, festival musik/budaya, sewa auditorium, dan studio komersial',
      keywords: ['event', 'off-air', 'auditorium', 'sewa', 'komersial', 'festival', 'lomba', 'show']
    }
  ]
};

interface DashboardBidangViewProps {
  currentUser: { id: string; name: string; role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; division?: string; photo?: string };
  employees: Employee[];
  agreements: PerformanceAgreement[];
  contracts?: CooperationContract[];
  reporterTargets?: ReporterTarget[];
  newsReports?: NewsReport[];
  onUpdateAgreements?: (agreements: PerformanceAgreement[]) => void;
  onAddNotification?: (notification: any) => void;
  identity?: InstitutionalIdentity;
  settings?: AppSettings;
}

export default function DashboardBidangView({
  currentUser,
  employees,
  agreements,
  contracts = [],
  reporterTargets = [],
  newsReports = [],
  onUpdateAgreements,
  onAddNotification,
  identity = {
    kepalaStasiunNama: 'Drs. H. Rozani, M.Si.',
    kepalaStasiunTtd: '',
    kepalaBidangNama: '',
    kepalaBidangTtd: '',
    ketuaTimSiaranNama: '',
    ketuaTimSiaranTtd: '',
    ketuaTimPemberitaanNama: '',
    ketuaTimPemberitaanTtd: '',
    ketuaTimTeknikNama: '',
    ketuaTimTeknikTtd: '',
    ketuaTimKontenNama: '',
    ketuaTimKontenTtd: '',
    ketuaTimLayananNama: '',
    ketuaTimLayananTtd: ''
  },
  settings = {
    namaInstansi: 'LPP RRI Stasiun Penyiaran Bandar Lampung',
    alamat: 'Jl. Gatot Subroto No. 26, Pahoman, Bandar Lampung',
    noTelp: '(0721) 252111'
  }
}: DashboardBidangViewProps) {
  
  const [activeTab, setActiveTab] = useState<'summary' | 'delegation' | 'pelatihan40jam'>('summary');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
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
          
          indicators.push({ ...obj, _pct: pct, division: ag.level, employeeName: ag.assignedToName });
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

  // Selected Division State - defaults to currentUser.division if valid, or 'Tata Usaha / Umum'
  const [selectedDivision, setSelectedDivision] = useState<string>(() => {
    if (currentUser.division && currentUser.division !== 'Pimpinan' && currentUser.division !== 'Umum') {
      return currentUser.division;
    }
    return 'Tata Usaha / Umum';
  });

  // Selected Sub-Team filter ('all' or specific sub-team ID)
  const [selectedSubTeam, setSelectedSubTeam] = useState<string>('all');

  // Selected Staff filter ('all' or employee ID)
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

  const activeDivision = selectedDivision;

  // Handler for changing division with cascade reset
  const handleDivisionChange = (newDivision: string) => {
    setSelectedDivision(newDivision);
    setSelectedSubTeam('all');
    setSelectedStaffFilter('all');
  };

  // Find current active employee details
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === currentUser.id);
  }, [employees, currentUser]);

  // Ketua Tim / Penanggung Jawab Bidang
  const ketuaTimBidangName = useMemo(() => {
    const d = activeDivision.toLowerCase();
    if (d.includes('tata usaha')) return identity.kepalaBidangNama || 'Ir. Hendra Saputra, M.T.';
    if (d.includes('siaran')) return identity.ketuaTimSiaranNama || 'Rina Kartika, S.Sos.';
    if (d.includes('pemberitaan')) return identity.ketuaTimPemberitaanNama || 'Drs. Heru Prasetyo, M.Si.';
    if (d.includes('teknologi')) return identity.ketuaTimTeknikNama || 'Ir. Andi Wijaya, M.T.';
    if (d.includes('konten')) return identity.ketuaTimKontenNama || 'Siti Rahmawati, S.I.Kom.';
    if (d.includes('layanan')) return identity.ketuaTimLayananNama || 'Rizky Syahputra, A.Md.';
    return 'Penanggung Jawab Bidang';
  }, [activeDivision, identity]);

  // Sub-teams of active division
  const currentSubTeams = useMemo(() => {
    return DIVISION_SUBTEAMS[activeDivision] || [];
  }, [activeDivision]);

  const activeSubTeamInfo = useMemo(() => {
    if (selectedSubTeam === 'all') return null;
    return currentSubTeams.find(st => st.id === selectedSubTeam) || null;
  }, [selectedSubTeam, currentSubTeams]);

  // Find all agreements relevant to this division
  // 1. Their own agreement (assignedToEmployeeId === currentEmployee.id)
  // 2. Their Ketua Tim / Kabid agreement for this division
  const divisionAgreements = useMemo(() => {
    return agreements.filter(ag => {
      // Direct assignment if currentUser matches
      if (ag.assignedToEmployeeId === currentUser.id && currentUser.division === activeDivision) return true;
      
      // Ketua Tim of their division
      const divisionKey = activeDivision.toLowerCase();
      const levelKey = (ag.level || '').toLowerCase();
      
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
  const { ownObjectives, teamObjectives, teamAgreement } = useMemo(() => {
    const own = divisionAgreements.find(ag => ag.assignedToEmployeeId === currentUser.id);
    const team = divisionAgreements.find(ag => ag.level !== 'Pegawai');
    
    return {
      ownObjectives: own ? own.objectives : [],
      teamObjectives: team ? team.objectives : [],
      teamAgreement: team
    };
  }, [divisionAgreements, currentUser]);

  // Filtered team objectives by sub-team
  const filteredTeamObjectives = useMemo(() => {
    if (selectedSubTeam === 'all') {
      return teamObjectives;
    }
    const subTeam = currentSubTeams.find(st => st.id === selectedSubTeam);
    if (!subTeam) return teamObjectives;

    const matched = teamObjectives.filter(obj => {
      const name = (obj.indicatorName || '').toLowerCase();
      const code = (obj.id || '').toLowerCase();
      return subTeam.keywords.some(kw => name.includes(kw) || code.includes(kw));
    });

    return matched.length > 0 ? matched : teamObjectives;
  }, [teamObjectives, selectedSubTeam, currentSubTeams]);

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
    const targetObjList = filteredTeamObjectives.length > 0 ? filteredTeamObjectives : teamObjectives;
    targetObjList.forEach(obj => {
      const tgt = parseFloat(obj.target) || 100;
      const progress = tgt > 0 ? (obj.achievement / tgt) * 100 : 0;
      teamPctTotal += Math.min(120, progress);
    });
    const teamAverageProgress = targetObjList.length > 0 ? Math.round(teamPctTotal / targetObjList.length) : 0;

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
  }, [ownObjectives, teamObjectives, filteredTeamObjectives, newsReports, currentUser, contracts]);

  // Find Level 2 Agreement for this division (e.g. Siaran, Pemberitaan, etc.)
  const level2Agreement = useMemo(() => {
    const divKey = activeDivision.toLowerCase();
    return agreements.find(ag => {
      const lvlKey = (ag.level || '').toLowerCase();
      if (divKey.includes('pemberitaan') && lvlKey.includes('pemberitaan')) return true;
      if (divKey.includes('konten') && lvlKey.includes('konten')) return true;
      if (divKey.includes('teknologi') && lvlKey.includes('teknologi')) return true;
      if (divKey.includes('layanan') && lvlKey.includes('layanan')) return true;
      if (divKey.includes('siaran') && lvlKey.includes('siaran')) return true;
      if (divKey.includes('tata usaha') && (lvlKey.includes('tata usaha') || lvlKey.includes('kabid'))) return true;
      return false;
    });
  }, [agreements, activeDivision]);

  // Staff/subordinates of this active division
  const divisionStaff = useMemo(() => {
    return employees.filter(e => {
      if (e.role === 'Ketua Bidang') return false;
      const empDiv = (e.divisi || '').toLowerCase();
      const actDiv = activeDivision.toLowerCase();
      return empDiv.includes(actDiv) || actDiv.includes(empDiv);
    });
  }, [employees, activeDivision]);

  // Filtered staff list for display
  const displayedStaff = useMemo(() => {
    if (selectedStaffFilter === 'all') {
      return divisionStaff;
    }
    return divisionStaff.filter(e => e.id === selectedStaffFilter);
  }, [divisionStaff, selectedStaffFilter]);

  // Find all level 3 (Pegawai) agreements of this division
  const divisionPegawaiAgreements = useMemo(() => {
    return agreements.filter(ag => {
      if (ag.level !== 'Pegawai' || !ag.assignedToEmployeeId) return false;
      const emp = employees.find(e => e.id === ag.assignedToEmployeeId);
      if (!emp) return false;
      const empDiv = (emp.divisi || '').toLowerCase();
      const actDiv = activeDivision.toLowerCase();
      return empDiv.includes(actDiv) || actDiv.includes(empDiv);
    });
  }, [agreements, employees, activeDivision]);

  // Filtered level 3 agreements
  const displayedPegawaiAgreements = useMemo(() => {
    if (selectedStaffFilter === 'all') {
      return divisionPegawaiAgreements;
    }
    return divisionPegawaiAgreements.filter(ag => ag.assignedToEmployeeId === selectedStaffFilter);
  }, [divisionPegawaiAgreements, selectedStaffFilter]);

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
              {(() => {
                const pal = getAvatarColor(currentUser.name);
                return (
                  <div className={`w-16 h-16 rounded-2xl ${pal.bg} ${pal.text} ${pal.border} border-2 font-black text-xl flex items-center justify-center shadow-lg font-mono tracking-wider shrink-0`}>
                    {getInitials(currentUser.name)}
                  </div>
                );
              })()}
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

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex flex-col md:items-end gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block md:text-right">Dashboard Bidang Aktif</span>
              <span className="text-sm font-extrabold text-indigo-400 mt-0.5 tracking-wide block md:text-right">
                {activeDivision.toUpperCase()}
              </span>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block md:text-right">Tahun Anggaran 2026</span>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Cetak atau Export Laporan Kinerja Bidang & Seluruh Satker ke PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Laporan / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER PANEL: DIVISI, SUB-TIM & STAF PELAKSANA */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Top Header of Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Filter & Analisis Performa Bidang & Sub-Tim
              </h3>
              <p className="text-xs text-slate-500">
                Pilih divisi, sub-tim operasional, atau staf pelaksana untuk navigasi performa
              </p>
            </div>
          </div>

          {/* Quick reset / action buttons */}
          <div className="flex items-center gap-2">
            {(selectedDivision !== (currentUser.division || 'Tata Usaha / Umum') || selectedSubTeam !== 'all' || selectedStaffFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDivision(currentUser.division || 'Tata Usaha / Umum');
                  setSelectedSubTeam('all');
                  setSelectedStaffFilter('all');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Kembalikan ke divisi default pengguna"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Select Dropdowns in a Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Dropdown Divisi / Bidang */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              1. Divisi / Bidang Utama
            </label>
            <div className="relative">
              <select
                id="filter-division-select"
                value={selectedDivision}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                {DIVISIONS_LIST.map((div) => (
                  <option key={div} value={div}>
                    {div} {currentUser.division === div ? '(Divisi Saya)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Dropdown Sub-Tim / Fungsi Kerja */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
              2. Sub-Tim / Fungsi Kerja
            </label>
            <div className="relative">
              <select
                id="filter-subteam-select"
                value={selectedSubTeam}
                onChange={(e) => setSelectedSubTeam(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Semua Sub-Tim ({activeDivision})</option>
                {currentSubTeams.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Dropdown Staf Pelaksana */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              3. Staf / Pegawai Pelaksana
            </label>
            <div className="relative">
              <select
                id="filter-staff-select"
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Semua Staf ({divisionStaff.length} Pegawai)</option>
                {divisionStaff.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.nip || 'ASN'}) {emp.jabatan ? `• ${emp.jabatan}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Sub-Team Chips */}
        {currentSubTeams.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold font-mono uppercase text-slate-400">Pilih Cepat Sub-Tim:</div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                type="button"
                onClick={() => setSelectedSubTeam('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSubTeam === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua Sub-Tim
              </button>
              {currentSubTeams.map((st) => {
                const isActive = selectedSubTeam === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedSubTeam(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{st.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Context Banner */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
            <span className="flex items-center gap-1 text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Bidang: <strong className="text-indigo-700 ml-0.5">{activeDivision}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-700">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Penanggung Jawab: <span className="font-semibold ml-0.5">{ketuaTimBidangName}</span>
            </span>
            {activeSubTeamInfo && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  <FolderKanban className="w-3 h-3" />
                  {activeSubTeamInfo.name}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>{filteredTeamObjectives.length} Sasaran IKP</span>
            <span>•</span>
            <span>{displayedStaff.length} Staf Pelaksana</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
          onClick={() => setActiveTab('pelatihan40jam')}
          className={`px-5 py-2.5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pelatihan40jam'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-600" />
          Kepatuhan Pelatihan 40 Jam SDM
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
              {filteredTeamObjectives.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400 italic col-span-full bg-white rounded-2xl border border-dashed border-slate-200">
                  {selectedSubTeam !== 'all' 
                    ? `Tidak ada indikator yang cocok dengan sub-tim "${activeSubTeamInfo?.name || selectedSubTeam}" di ${activeDivision}`
                    : `Belum ada Perjanjian Kinerja Tingkat Bidang (${activeDivision})`}
                </div>
              ) : (
                filteredTeamObjectives.map((obj, idx) => {
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
                        <IndicatorTitleDisplay 
                          title={obj.indicatorName}
                          className="text-xs md:text-sm font-bold text-slate-800 leading-snug block"
                          subClassName="text-[10px] text-slate-500 font-normal block mt-0.5"
                        />
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

          {/* KHUSUS BIDANG TATA USAHA / UMUM: STATISTIK PENCAPAIAN KEPATUHAN 40 JAM PELATIHAN SDM */}
          {activeDivision === 'Tata Usaha / Umum' && (
            <div className="space-y-4">
              <StatistikKepatuhanPelatihanBidang 
                employees={employees} 
                selectedDivision="Tata Usaha / Umum"
              />
            </div>
          )}

          {/* TABEL & PERFORMA STAF PELAKSANA BIDANG */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Performa & Capaian Kinerja Staf ({activeDivision})
                </h3>
                <p className="text-xs text-slate-500">
                  Menampilkan {displayedStaff.length} dari {divisionStaff.length} staf pelaksana • Integrasi Sasaran Level 3
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">
                  Total PK Pegawai: {divisionPegawaiAgreements.length} Sasaran
                </span>
              </div>
            </div>

            {displayedStaff.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Tidak ada staf yang sesuai dengan filter yang dipilih.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {displayedStaff.map((staff) => {
                  const staffAgreements = divisionPegawaiAgreements.filter(a => a.employeeId === staff.id);
                  const totalIndicators = staffAgreements.length;
                  
                  // Calculate average staff progress
                  let avgStaffPct = 0;
                  if (totalIndicators > 0) {
                    const totalPct = staffAgreements.reduce((acc, a) => {
                      const t = parseFloat(a.target) || 1;
                      const ach = a.achievement || 0;
                      return acc + Math.min(100, Math.round((ach / t) * 100));
                    }, 0);
                    avgStaffPct = Math.round(totalPct / totalIndicators);
                  }

                  return (
                    <div
                      key={staff.id}
                      className="bg-slate-50 hover:bg-white p-4.5 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all space-y-3.5"
                    >
                      {/* Top row: Staff Info & Overall Progress */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {staff.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">{staff.nama}</span>
                              <span className="text-[10px] font-mono bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-semibold">
                                NIP: {staff.nip || 'ASN'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {staff.jabatan || 'Pelaksana Kinerja'} • <span className="text-indigo-600 font-semibold">{staff.division}</span>
                            </p>
                          </div>
                        </div>

                        {/* Overall Progress Badge */}
                        <div className="flex items-center gap-4 shrink-0 sm:self-center">
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Rata-rata Capaian</span>
                            <span className={`text-base font-black font-mono ${
                              avgStaffPct >= 90 ? 'text-emerald-600' :
                              avgStaffPct >= 60 ? 'text-indigo-600' :
                              avgStaffPct > 0 ? 'text-amber-600' : 'text-slate-400'
                            }`}>
                              {totalIndicators > 0 ? `${avgStaffPct}%` : 'Belum Ada PK'}
                            </span>
                          </div>

                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                avgStaffPct >= 90 ? 'bg-emerald-500' :
                                avgStaffPct >= 60 ? 'bg-indigo-600' :
                                avgStaffPct > 0 ? 'bg-amber-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(100, avgStaffPct)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Level 3 Cascaded Indicators for this staff */}
                      {staffAgreements.length > 0 ? (
                        <div className="pt-2 border-t border-slate-200/60 space-y-2">
                          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                            Daftar Sasaran Kerja yang Didelegasikan (Level 3):
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {staffAgreements.map((sa) => {
                              const t = parseFloat(sa.target) || 1;
                              const pct = t > 0 ? Math.min(100, Math.round(((sa.achievement || 0) / t) * 100)) : 0;
                              return (
                                <div
                                  key={sa.id}
                                  className="bg-white p-3 rounded-xl border border-slate-200/70 text-xs space-y-1.5 flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex justify-between items-start gap-2">
                                      <p className="font-semibold text-slate-800 leading-snug line-clamp-2" title={sa.indicatorName}>
                                        {sa.indicatorName}
                                      </p>
                                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                                        {sa.weight}%
                                      </span>
                                    </div>
                                    {sa.cascadedFrom && (
                                      <p className="text-[9px] text-indigo-600 mt-1 truncate">
                                        Induk Level 2: {sa.cascadedFrom.indicatorName}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-500">
                                      Real: <strong className="text-slate-800">{sa.achievement}</strong> / {sa.target} {sa.unit}
                                    </span>
                                    <span className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded ${
                                      pct >= 100 ? 'bg-emerald-50 text-emerald-700' :
                                      pct >= 50 ? 'bg-indigo-50 text-indigo-700' :
                                      'bg-amber-50 text-amber-700'
                                    }`}>
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                          <span>Belum ada sasaran IKU Level 3 yang didelegasikan ke pegawai ini.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('delegation');
                              setDelegateEmployeeId(staff.id);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Delegasikan Tugas
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB DELEGASI TUGAS */}
      {activeTab === 'delegation' && (
        <div className="space-y-6">
          {/* Header Card for Delegation */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-900/50 px-2.5 py-1 rounded-md border border-indigo-700/50">
                Pendelegasian Sasaran Kinerja
              </span>
              <h2 className="text-lg md:text-xl font-black tracking-tight">
                Menu Pendelegasian Tugas Level 2 &rarr; Level 3 ({activeDivision})
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Pimpinan dan Ketua Tim dapat menurunkan indikator perjanjian kinerja bidang ke staf pelaksana sesuai fungsi dan kompetensinya.
              </p>
            </div>

            <div className="bg-indigo-950/80 p-3.5 rounded-2xl border border-indigo-800 text-center shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Sasaran Bidang</span>
              <span className="text-xl font-black text-indigo-300 font-mono">{teamObjectives.length} Sasaran</span>
            </div>
          </div>

          {/* Section 1: Sasaran Level 2 yang siap didelegasikan */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-indigo-600" />
                  1. Pilih Sasaran Level 2 untuk Didelegasikan
                </h3>
                <p className="text-xs text-slate-500">Klik tombol "Delegasikan ke Staf" pada indikator yang ingin diturunkan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {teamObjectives.map((obj, idx) => {
                const existingCascaded = divisionPegawaiAgreements.filter(
                  a => a.cascadedFrom?.agreementId === divisionAgreements[0]?.id && a.cascadedFrom?.indicatorIndex === idx
                );

                return (
                  <div
                    key={obj.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-500 font-bold bg-slate-200/70 px-2 py-0.5 rounded">
                          Sasaran #{idx + 1} • Bobot {obj.weight}%
                        </span>
                        <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          Target: {obj.target} {obj.unit}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {obj.indicatorName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {existingCascaded.length} Staf Didelegasikan
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const parentAgreement = divisionAgreements[0];
                          if (parentAgreement) {
                            setDelegatingIndicator({
                              agreement: parentAgreement,
                              indicator: obj,
                              indicatorIndex: idx
                            });
                            setDelegatedIndicatorName(`Pelaksanaan ${obj.indicatorName}`);
                            setDelegatedTarget(obj.target);
                            setDelegatedUnit(obj.unit);
                            setDelegatedWeight(obj.weight);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Delegasikan ke Staf</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Daftar Seluruh Indikator Level 3 yang Telah Didelegasikan */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  2. Rekap Seluruh Pendelegasian Sasaran (Level 3 Staf)
                </h3>
                <p className="text-xs text-slate-500">Daftar perjanjian kinerja staf yang telah didelegasikan di divisi {activeDivision}</p>
              </div>
            </div>

            {divisionPegawaiAgreements.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <GitFork className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Belum ada tugas yang didelegasikan ke staf di divisi ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase font-mono border-b border-slate-200">
                      <th className="px-4 py-3">Staf Pelaksana</th>
                      <th className="px-4 py-3">Nama Sasaran (Level 3)</th>
                      <th className="px-4 py-3">Induk Sasaran (Level 2)</th>
                      <th className="px-4 py-3 text-center">Bobot</th>
                      <th className="px-4 py-3 text-right">Target & Realisasi</th>
                      <th className="px-4 py-3 text-right">Capaian (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {divisionPegawaiAgreements.map((ag) => {
                      const t = parseFloat(ag.target) || 1;
                      const pct = t > 0 ? Math.min(100, Math.round(((ag.achievement || 0) / t) * 100)) : 0;
                      return (
                        <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{ag.employeeName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">NIP: {ag.employeeNip || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800 whitespace-normal max-w-xs block leading-snug">
                              {ag.indicatorName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-indigo-600 whitespace-normal max-w-[200px] block text-[11px] leading-snug">
                              {ag.cascadedFrom?.indicatorName || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                            {ag.weight}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="font-bold text-slate-800">{ag.achievement}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-slate-600">{ag.target} {ag.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              pct >= 100 ? 'bg-emerald-100 text-emerald-800' :
                              pct >= 50 ? 'bg-indigo-100 text-indigo-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB PELATIHAN 40 JAM SDM (6 BIDANG) */}
      {activeTab === 'pelatihan40jam' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <StatistikKepatuhanPelatihanBidang 
            employees={employees}
            selectedDivision={activeDivision === 'Tata Usaha / Umum' ? undefined : activeDivision}
          />
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

      {/* Quick Report & PDF Export Modal */}
      <QuickReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        agreements={agreements}
        identity={identity}
        settings={settings}
        defaultYear={2026}
      />

    </div>
  );
}
