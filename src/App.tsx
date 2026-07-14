import { useState, useEffect } from 'react';
import { Employee, AppSettings, InstitutionalIdentity, CriticalNotification, PerformanceAgreement, CooperationContract, ReporterTarget, NewsReport } from './types';
import DashboardView from './components/DashboardView';
import EmployeeAdminView from './components/EmployeeAdminView';
import AppAdminView from './components/AppAdminView';
import PerformanceAgreementView from './components/PerformanceAgreementView';
import CooperationPnbpView from './components/CooperationPnbpView';
import PemberitaanMediaBaruView from './components/PemberitaanMediaBaruView';
import LoginView from './components/LoginView';
import DashboardBidangView from './components/DashboardBidangView';
import DashboardTmbView from './components/DashboardTmbView';
import InputCapaianPKView from './components/InputCapaianPKView';
import { 
  fetchCollection, 
  fetchDocument, 
  saveDocument, 
  saveCollectionList, 
  deleteDocument,
  isSystemSeeded,
  markSystemSeeded
} from './lib/firebaseSync';
import { 
  Radio, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Menu, 
  X, 
  ShieldCheck, 
  Info,
  Volume2,
  GitFork,
  Handshake,
  Share2,
  Cpu,
  Calendar
} from 'lucide-react';

// Reusable clean SVG vector signature data-urls for preloaded employees
const MOCK_TTD_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='60'><path d='M15,35 Q35,5 45,35 T90,15 T135,45' fill='none' stroke='%231e293b' stroke-width='3' stroke-linecap='round'/></svg>";
const MOCK_TTD_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='60'><path d='M20,40 Q50,15 70,35 T110,25 T130,45' fill='none' stroke='%231e293b' stroke-width='3' stroke-linecap='round'/></svg>";
const MOCK_TTD_3 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='60'><path d='M10,20 C35,10 65,55 85,25 C105,-5 125,50 140,30' fill='none' stroke='%231e293b' stroke-width='3' stroke-linecap='round'/></svg>";
const MOCK_TTD_4 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='60'><path d='M25,25 Q55,45 85,15 T115,35 T135,25' fill='none' stroke='%231e293b' stroke-width='3' stroke-linecap='round'/></svg>";
const MOCK_TTD_5 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='60'><path d='M15,45 Q45,15 75,45 T105,15 T135,45' fill='none' stroke='%231e293b' stroke-width='3' stroke-linecap='round'/></svg>";

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    nik: '3171011503750002',
    nip: '197503151998031001',
    nama: 'Heru Prasetyo',
    gelarDepan: 'Drs.',
    gelarBelakang: 'M.Si.',
    jenjangPendidikan: 'S2',
    divisi: 'Pemberitaan',
    jenisKelamin: 'Laki-laki',
    alamat: 'Jl. Kramat Raya No. 12, Senen, Jakarta Pusat',
    noHp: '08119876543',
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces',
    ttdElektronik: MOCK_TTD_1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-2',
    nik: '3273104508920001',
    nip: '199208052015042003',
    nama: 'Siti Rahmawati',
    gelarDepan: '',
    gelarBelakang: 'S.I.Kom.',
    jenjangPendidikan: 'S1',
    divisi: 'Konten Media Baru',
    jenisKelamin: 'Perempuan',
    alamat: 'Jl. Dago Asri No. 45, Coblong, Bandung',
    noHp: '08129876541',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
    ttdElektronik: MOCK_TTD_2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-3',
    nik: '3174092211830005',
    nip: '198311222008121002',
    nama: 'Andi Wijaya',
    gelarDepan: 'Ir.',
    gelarBelakang: 'M.T.',
    jenjangPendidikan: 'S2',
    divisi: 'Teknologi dan Media Baru',
    jenisKelamin: 'Laki-laki',
    alamat: 'Jl. Radio Dalam Raya No. 102, Kebayoran Baru, Jakarta Selatan',
    noHp: '08139876542',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces',
    ttdElektronik: MOCK_TTD_3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-4',
    nik: '3173055204890003',
    nip: '198904122012012004',
    nama: 'Dewi Lestari',
    gelarDepan: '',
    gelarBelakang: 'S.E.',
    jenjangPendidikan: 'S1',
    divisi: 'Tata Usaha / Umum',
    jenisKelamin: 'Perempuan',
    alamat: 'Jl. Palmerah Barat No. 88, Kebon Jeruk, Jakarta Barat',
    noHp: '08159876544',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
    ttdElektronik: MOCK_TTD_4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-5',
    nik: '3578021010900004',
    nip: '199010102013031002',
    nama: 'Rizky Syahputra',
    gelarDepan: '',
    gelarBelakang: 'A.Md.',
    jenjangPendidikan: 'D3',
    divisi: 'Layanan Pengembangan Usaha',
    jenisKelamin: 'Laki-laki',
    alamat: 'Jl. Dharmahusada Indah No. 15, Gubeng, Surabaya',
    noHp: '08179876545',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
    ttdElektronik: MOCK_TTD_5,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_SETTINGS: AppSettings = {
  namaInstansi: "RRI Bandar Lampung",
  alamat: "Jl. Gatot Subroto No. 26, Pahoman, Kec. Enggal, Kota Bandar Lampung, Lampung",
  noTelp: "(0721) 482436"
};

const INITIAL_IDENTITY: InstitutionalIdentity = {
  kepalaStasiunNama: "Drs. H. Mulyadi Kusuma, M.M.",
  kepalaStasiunTtd: MOCK_TTD_1,
  kepalaStasiunPassword: "kepala",
  kepalaBidangNama: "Ir. Hendra Saputra, M.T.",
  kepalaBidangTtd: MOCK_TTD_2,
  ketuaTimSiaranNama: "Rina Kartika, S.Sos.",
  ketuaTimSiaranTtd: MOCK_TTD_3,
  ketuaTimPemberitaanNama: "Fahri Hamzah, M.I.Kom.",
  ketuaTimPemberitaanTtd: MOCK_TTD_4,
  ketuaTimTeknikNama: "Andi Wijaya, M.T.",
  ketuaTimTeknikTtd: MOCK_TTD_5,
  ketuaTimKontenNama: "Siti Rahmawati, S.I.Kom.",
  ketuaTimKontenTtd: MOCK_TTD_2,
  ketuaTimLayananNama: "Budi Santoso, S.E., M.M.",
  ketuaTimLayananTtd: MOCK_TTD_3
};

const INITIAL_NOTIFICATIONS: CriticalNotification[] = [
  {
    id: 'notif-1',
    title: "Sistem Siaran: Pemancar Utama FM",
    message: "Fluktuasi modulasi daya terdeteksi pada pemancar utama FM 102.5 MHz. Kinerja diturunkan sementara ke pemancar cadangan.",
    type: "warning",
    timestamp: "10:15",
    isRead: false,
    metricName: "Modulasi Gelombang",
    metricValue: "92% (Normal 100%)"
  }
];

const INITIAL_AGREEMENTS: PerformanceAgreement[] = [
  {
    id: "pk-default-kepala-stasiun",
    year: 2026,
    level: "Kepala Stasiun",
    assignedToName: "Drs. H. Mulyadi Kusuma, M.M.",
    objectives: [
      {
        id: "ind-1",
        indicatorName: "Indeks Kepuasan Layanan Publik Radio",
        target: "90",
        unit: "Skor",
        weight: 30,
        achievement: 85
      },
      {
        id: "ind-2",
        indicatorName: "Persentase Digitalisasi Studio & Media Baru",
        target: "100",
        unit: "%",
        weight: 30,
        achievement: 75
      },
      {
        id: "ind-3",
        indicatorName: "Efisiensi Penyerapan Anggaran DIPA Stasiun",
        target: "97",
        unit: "%",
        weight: 20,
        achievement: 90
      },
      {
        id: "ind-4",
        indicatorName: "Akurasi & Ketepatan Siaran Berita Pemilu Daerah",
        target: "100",
        unit: "%",
        weight: 20,
        achievement: 100
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-kabid-tu",
    year: 2026,
    level: "Kabid Tata Usaha",
    assignedToName: "Ir. Hendra Saputra, M.T.",
    objectives: [
      {
        id: "ind-5",
        indicatorName: "Tingkat Keandalan Laporan Administrasi & Keuangan",
        target: "100",
        unit: "%",
        weight: 50,
        achievement: 95,
        parentIndicatorId: "ind-3"
      },
      {
        id: "ind-6",
        indicatorName: "Ketersediaan Logistik & Prasarana Penyiaran",
        target: "98",
        unit: "%",
        weight: 50,
        achievement: 98,
        parentIndicatorId: "ind-3"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-katim-siaran",
    year: 2026,
    level: "Ketua Tim Siaran",
    assignedToName: "Rina Kartika, S.Sos.",
    objectives: [
      {
        id: "ind-7",
        indicatorName: "Kualitas Konten On-Air Program RRI Bandar Lampung",
        target: "88",
        unit: "Skor",
        weight: 100,
        achievement: 86,
        parentIndicatorId: "ind-1"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-katim-pemberitaan",
    year: 2026,
    level: "Ketua Tim Pemberitaan",
    assignedToName: "Fahri Hamzah, M.I.Kom.",
    objectives: [
      {
        id: "ind-8",
        indicatorName: "Ketepatan Jam Tayang Buletin Berita Utama",
        target: "99.5",
        unit: "%",
        weight: 50,
        achievement: 99.2,
        parentIndicatorId: "ind-4"
      },
      {
        id: "ind-14",
        indicatorName: "Jumlah Produksi Berita Utama & Daerah",
        target: "100",
        unit: "Berita",
        weight: 50,
        achievement: 0,
        parentIndicatorId: "ind-4"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-katim-teknik",
    year: 2026,
    level: "Ketua Tim Teknologi dan Media Baru",
    assignedToName: "Andi Wijaya, M.T.",
    objectives: [
      {
        id: "ind-9",
        indicatorName: "Keandalan Streaming App & Pemancar Radio",
        target: "99.9",
        unit: "%",
        weight: 100,
        achievement: 99.5,
        parentIndicatorId: "ind-2"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-katim-konten",
    year: 2026,
    level: "Ketua Tim Konten Media Baru",
    assignedToName: "Siti Rahmawati, S.I.Kom.",
    objectives: [
      {
        id: "ind-10",
        indicatorName: "Jumlah Konten Visual Interaktif Bulanan",
        target: "20",
        unit: "Konten",
        weight: 100,
        achievement: 18,
        parentIndicatorId: "ind-2"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-katim-layanan",
    year: 2026,
    level: "Ketua Tim Layanan Pengembangan Usaha",
    assignedToName: "Budi Santoso, S.E., M.M.",
    objectives: [
      {
        id: "ind-11",
        indicatorName: "Capaian PNBP dari Iklan & Kerjasama",
        target: "150",
        unit: "Juta Rupiah",
        weight: 100,
        achievement: 120,
        parentIndicatorId: "ind-1"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-pegawai-dewi",
    year: 2026,
    level: "Pegawai",
    assignedToEmployeeId: "emp-4",
    assignedToName: "Dewi Lestari, S.E.",
    objectives: [
      {
        id: "ind-12",
        indicatorName: "Rekonsiliasi Transaksi Anggaran Bulanan",
        target: "12",
        unit: "Laporan",
        weight: 100,
        achievement: 6,
        parentIndicatorId: "ind-5"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-pegawai-heru",
    year: 2026,
    level: "Pegawai",
    assignedToEmployeeId: "emp-1",
    assignedToName: "Heru Prasetyo, M.Si.",
    objectives: [
      {
        id: "ind-13-1",
        indicatorName: "Produksi Jumlah Berita Ringan",
        target: "20",
        unit: "Berita",
        weight: 30,
        achievement: 0,
        parentIndicatorId: "ind-14"
      },
      {
        id: "ind-13-2",
        indicatorName: "Produksi Berita Radio",
        target: "30",
        unit: "Berita",
        weight: 35,
        achievement: 0,
        parentIndicatorId: "ind-14"
      },
      {
        id: "ind-13-3",
        indicatorName: "Produksi Berita Online",
        target: "50",
        unit: "Berita",
        weight: 35,
        achievement: 0,
        parentIndicatorId: "ind-14"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  },
  {
    id: "pk-default-pegawai-siti",
    year: 2026,
    level: "Pegawai",
    assignedToEmployeeId: "emp-2",
    assignedToName: "Siti Rahmawati, S.I.Kom.",
    objectives: [
      {
        id: "ind-15",
        indicatorName: "Produksi Konten Media Sosial Kreatif",
        target: "20",
        unit: "Konten",
        weight: 100,
        achievement: 0,
        parentIndicatorId: "ind-10"
      }
    ],
    status: "Aktif",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CONTRACTS: CooperationContract[] = [
  {
    id: "ctr-default-1",
    partnerName: "BPBD Sulawesi Utara",
    contractNo: "KTR/LPU/2026/001",
    activityName: "Siar Informasi Kebencanaan Terpadu (Iklan)",
    cooperationType: "Iklan/Siar Layanan",
    value: 45,
    realizedPnbp: 45,
    paymentStatus: "Lunas",
    startDate: "2026-01-10",
    endDate: "2026-12-31",
    notes: "Pembayaran lunas termin pertama.",
    linkedIndicatorId: "ind-11"
  },
  {
    id: "ctr-default-2",
    partnerName: "PT Telekomunikasi Selular (Telkomsel)",
    contractNo: "KTR/LPU/2026/002",
    activityName: "Sewa Space Lahan & Menara Pemancar RRI",
    cooperationType: "Sewa Lahan/Menara",
    value: 80,
    realizedPnbp: 40,
    paymentStatus: "Selesai Sebagian",
    startDate: "2026-02-01",
    endDate: "2027-01-31",
    notes: "Pembayaran termin 1 selesai, termin 2 jatuh tempo November 2026.",
    linkedIndicatorId: "ind-11"
  },
  {
    id: "ctr-default-3",
    partnerName: "Bank SulutGo",
    contractNo: "KTR/LPU/2026/003",
    activityName: "Sponsorship Program Dialog Interaktif Bisnis & UMKM",
    cooperationType: "Sponsorship Acara",
    value: 25,
    realizedPnbp: 25,
    paymentStatus: "Lunas",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    notes: "Sponsor penuh program on-air RRI.",
    linkedIndicatorId: "ind-11"
  },
  {
    id: "ctr-default-4",
    partnerName: "Dinas Pariwisata Daerah",
    contractNo: "KTR/LPU/2026/004",
    activityName: "Siar Spot Promosi Wisata Likupang",
    cooperationType: "Iklan/Siar Layanan",
    value: 20,
    realizedPnbp: 10,
    paymentStatus: "Selesai Sebagian",
    startDate: "2026-04-15",
    endDate: "2026-10-15",
    notes: "Sewa slot iklan program pariwisata.",
    linkedIndicatorId: "ind-11"
  }
];

const INITIAL_REPORTER_TARGETS: ReporterTarget[] = [
  {
    id: 'tgt-1',
    employeeId: 'emp-1',
    dailyTarget: 2,
    monthlyTarget: 50,
    linkedIndicatorId: 'ind-13-3',
    year: 2026
  },
  {
    id: 'tgt-2',
    employeeId: 'emp-2',
    dailyTarget: 1,
    monthlyTarget: 20,
    linkedIndicatorId: 'ind-15',
    year: 2026
  }
];

const INITIAL_NEWS_REPORTS: NewsReport[] = [
  {
    id: 'rep-1',
    employeeId: 'emp-1',
    title: 'Liputan Khusus: Kesiapan Logistik Pilkada Serentak Sulawesi Utara',
    url: 'https://swaranews.id/politik/kesiapan-logistik-pilkada-sulut',
    type: 'Berita Online',
    date: '2026-06-20'
  },
  {
    id: 'rep-2',
    employeeId: 'emp-1',
    title: 'RRI Bandar Lampung Gelar Dialog Interaktif Sinergi Keamanan Daerah Menjelang Pemilu',
    url: 'https://rri.go.id/bandarlampung/siaran/dialog-interaktif-sinergi-keamanan',
    type: 'Berita Radio',
    date: '2026-06-21'
  },
  {
    id: 'rep-3',
    employeeId: 'emp-1',
    title: 'Update Harga Bahan Pokok di Pasar Tradisional Manado Pascalebaran',
    url: 'https://rri.go.id/bandarlampung/ekonomi/update-harga-bahan-pokok',
    type: 'Berita Ringan',
    date: '2026-06-22'
  },
  {
    id: 'rep-4',
    employeeId: 'emp-2',
    title: 'Edukasi Pemilih Pemula: Suara Kita untuk Masa Depan Bangsa (IG Reels)',
    url: 'https://instagram.com/p/C_rri_bdl_pemula',
    type: 'Berita Online',
    date: '2026-06-18'
  },
  {
    id: 'rep-5',
    employeeId: 'emp-2',
    title: 'Behind the Scenes: Siaran Subuh RRI Bandar Lampung Digital (TikTok)',
    url: 'https://tiktok.com/@rribandarlampung/video/7384918204',
    type: 'Berita Online',
    date: '2026-06-19'
  }
];

const recalculateCascade = (
  currentAgs: PerformanceAgreement[], 
  currentContracts: CooperationContract[],
  currentNewsReports: NewsReport[] = [],
  currentReporterTargets: ReporterTarget[] = []
) => {
  // 1. Calculate total PNBP for linked indicator 'ind-11'
  const totalPnbpForInd11 = currentContracts
    .filter(c => c.linkedIndicatorId === 'ind-11')
    .reduce((sum, c) => sum + c.realizedPnbp, 0);

  // 2. Map through agreements to update the LPU PNBP objective (ind-11)
  let updated = currentAgs.map(ag => {
    const objectives = ag.objectives.map(obj => {
      if (obj.id === 'ind-11' || obj.indicatorName.toLowerCase().includes('pnbp')) {
        return { ...obj, achievement: totalPnbpForInd11 };
      }
      return obj;
    });
    return { ...ag, objectives };
  });

  // 2b. Calculate news report counts and update their linked indicator achievements (Level 3 - Pegawai)
  if (currentNewsReports.length > 0) {
    updated = updated.map(ag => {
      if (ag.level === 'Pegawai' && ag.assignedToEmployeeId) {
        const empId = ag.assignedToEmployeeId;
        const empReports = currentNewsReports.filter(r => r.employeeId === empId);

        const objectives = ag.objectives.map(obj => {
          const nameLower = obj.indicatorName.toLowerCase();
          
          if (nameLower.includes('ringan')) {
            const count = empReports.filter(r => r.type === 'Berita Ringan').length;
            return { ...obj, achievement: count };
          } else if (nameLower.includes('radio') || nameLower.includes('siaran')) {
            const count = empReports.filter(r => r.type === 'Berita Radio').length;
            return { ...obj, achievement: count };
          } else if (nameLower.includes('online') || nameLower.includes('media baru') || nameLower.includes('medsos') || nameLower.includes('sosial media') || nameLower.includes('harian') || nameLower.includes('publikasi') || nameLower.includes('konten')) {
            const count = empReports.filter(r => r.type === 'Berita Online').length;
            return { ...obj, achievement: count };
          } else {
            // Fallback to general matched targets if defined
            const empTargets = currentReporterTargets.filter(t => t.employeeId === empId);
            const matchedTarget = empTargets.find(t => t.linkedIndicatorId === obj.id);
            if (matchedTarget) {
              const count = empReports.length;
              return { ...obj, achievement: count };
            }
          }
          return obj;
        });
        return { ...ag, objectives };
      }
      return ag;
    });
  }

  // 2c. Roll up Level 3 (Pegawai) to Level 2 (Ketua Tim / Kabid) objectives dynamically
  updated = updated.map(ag => {
    if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
      const objectives = ag.objectives.map(l2Obj => {
        const l3Objectives: { achievement: number; target: number; unit: string }[] = [];
        updated.forEach(otherAg => {
          if (otherAg.level === 'Pegawai') {
            otherAg.objectives.forEach(obj => {
              if (obj.parentIndicatorId === l2Obj.id) {
                const tgtVal = parseFloat(obj.target) || 100;
                l3Objectives.push({ achievement: obj.achievement || 0, target: tgtVal, unit: obj.unit });
              }
            });
          }
        });

        if (l3Objectives.length > 0) {
          const isAbsolute = ['berita', 'konten', 'laporan', 'dokumen', 'video'].some(u => l2Obj.unit.toLowerCase().includes(u));
          
          if (isAbsolute) {
            const sumAchievement = l3Objectives.reduce((sum, child) => sum + child.achievement, 0);
            return { ...l2Obj, achievement: sumAchievement };
          } else {
            const totalProgress = l3Objectives.reduce((sum, child) => {
              const progress = child.target > 0 ? (child.achievement / child.target) * 100 : 0;
              return sum + Math.min(120, progress);
            }, 0);
            const avgProgress = totalProgress / l3Objectives.length;
            const l2TargetVal = parseFloat(l2Obj.target) || 100;
            const newAchievement = Math.round((avgProgress / 100) * l2TargetVal * 10) / 10;
            return { ...l2Obj, achievement: newAchievement };
          }
        }
        return l2Obj;
      });
      return { ...ag, objectives };
    }
    return ag;
  });

  // 3. Roll up Level 2 to Level 1 (Kepala Stasiun objectives)
  updated = updated.map(ag => {
    if (ag.level === 'Kepala Stasiun') {
      const objectives = ag.objectives.map(rootObj => {
        const l2Objectives: { achievement: number; target: number }[] = [];
        updated.forEach(otherAg => {
          if (otherAg.level !== 'Kepala Stasiun' && otherAg.level !== 'Pegawai') {
            otherAg.objectives.forEach(obj => {
              if (obj.parentIndicatorId === rootObj.id) {
                const tgtVal = parseFloat(obj.target) || 100;
                l2Objectives.push({ achievement: obj.achievement || 0, target: tgtVal });
              }
            });
          }
        });

        if (l2Objectives.length > 0) {
          const totalProgress = l2Objectives.reduce((sum, child) => {
            const progress = (child.achievement / child.target) * 100;
            return sum + Math.min(120, progress);
          }, 0);
          const avgProgress = totalProgress / l2Objectives.length;
          
          const rootTargetVal = parseFloat(rootObj.target) || 100;
          const newAchievement = Math.round((avgProgress / 100) * rootTargetVal * 10) / 10;
          return { ...rootObj, achievement: newAchievement };
        }
        return rootObj;
      });
      return { ...ag, objectives };
    }
    return ag;
  });

  return updated;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kepegawaian' | 'aplikasi' | 'pk' | 'lpu' | 'pemberitaan' | 'tmb' | 'input-capaian-pk'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [identity, setIdentity] = useState<InstitutionalIdentity>(INITIAL_IDENTITY);
  const [notifications, setNotifications] = useState<CriticalNotification[]>([]);
  const [agreements, setAgreements] = useState<PerformanceAgreement[]>([]);
  const [contracts, setContracts] = useState<CooperationContract[]>([]);
  const [reporterTargets, setReporterTargets] = useState<ReporterTarget[]>([]);
  const [newsReports, setNewsReports] = useState<NewsReport[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin';
    division?: string;
    photo?: string;
  } | null>(() => {
    const saved = localStorage.getItem('swara_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user: { id: string; name: string; role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; division?: string; photo?: string }) => {
    setCurrentUser(user);
    localStorage.setItem('swara_current_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('swara_current_user');
  };

  // Load from Firestore on initialization
  useEffect(() => {
    async function loadData() {
      try {
        const seeded = await isSystemSeeded();
        
        let fireEmployees: Employee[];
        let fireSettings: AppSettings;
        let fireIdentity: InstitutionalIdentity;
        let fireNotifications: CriticalNotification[];
        let fireContracts: CooperationContract[];
        let fireTargets: ReporterTarget[];
        let fireReports: NewsReport[];
        let fireAgreements: PerformanceAgreement[];

        if (!seeded) {
          // First time database initialization: seed empty arrays for dynamic entities
          fireEmployees = [];
          fireSettings = INITIAL_SETTINGS;
          fireIdentity = INITIAL_IDENTITY;
          fireNotifications = [];
          fireContracts = [];
          fireTargets = [];
          fireReports = [];
          fireAgreements = [];

          await saveCollectionList('employees', []);
          await saveDocument('settings', 'current', INITIAL_SETTINGS);
          await saveDocument('identity', 'current', INITIAL_IDENTITY);
          await saveCollectionList('notifications', []);
          await saveCollectionList('contracts', []);
          await saveCollectionList('reporterTargets', []);
          await saveCollectionList('newsReports', []);
          await saveCollectionList('agreements', []);
          
          await markSystemSeeded();
        } else {
          // Database is already seeded. Fetch current state. If a collection is emptied
          // by the user, keep it empty instead of falling back to default dummy data.
          fireEmployees = await fetchCollection<Employee>('employees', []);
          fireSettings = await fetchDocument<AppSettings>('settings', 'current', INITIAL_SETTINGS);
          fireIdentity = await fetchDocument<InstitutionalIdentity>('identity', 'current', INITIAL_IDENTITY);
          fireNotifications = await fetchCollection<CriticalNotification>('notifications', []);
          fireContracts = await fetchCollection<CooperationContract>('contracts', []);
          fireTargets = await fetchCollection<ReporterTarget>('reporterTargets', []);
          fireReports = await fetchCollection<NewsReport>('newsReports', []);
          fireAgreements = await fetchCollection<PerformanceAgreement>('agreements', []);
        }

        // Perform initial cascade check
        const initialCascaded = recalculateCascade(fireAgreements, fireContracts, fireReports, fireTargets);

        // Migrate employee division field values if needed
        const migratedEmployees = fireEmployees.map((emp) => {
          if ((emp.divisi as any) === 'Program Acara') emp.divisi = 'Konten Media Baru';
          if ((emp.divisi as any) === 'Teknik') emp.divisi = 'Teknologi dan Media Baru';
          if ((emp.divisi as any) === 'Layanan Publik') emp.divisi = 'Layanan Pengembangan Usaha';
          return emp;
        });

        setEmployees(migratedEmployees);
        setSettings(fireSettings);
        setIdentity(fireIdentity);
        setNotifications(fireNotifications);
        setContracts(fireContracts);
        setReporterTargets(fireTargets);
        setNewsReports(fireReports);
        setAgreements(initialCascaded);

        // Mirror locally for instant loading and reliability
        localStorage.setItem('e_station_employees', JSON.stringify(migratedEmployees));
        localStorage.setItem('e_station_settings', JSON.stringify(fireSettings));
        localStorage.setItem('e_station_identity', JSON.stringify(fireIdentity));
        localStorage.setItem('e_station_notifications', JSON.stringify(fireNotifications));
        localStorage.setItem('e_station_contracts', JSON.stringify(fireContracts));
        localStorage.setItem('e_station_reporter_targets', JSON.stringify(fireTargets));
        localStorage.setItem('e_station_news_reports', JSON.stringify(fireReports));
        localStorage.setItem('e_station_agreements', JSON.stringify(initialCascaded));

      } catch (err) {
        console.error("Critical error during cloud sync:", err);
      } finally {
        setIsSyncing(false);
      }
    }
    loadData();
  }, []);

  // Sync helpers
  const handleUpdateEmployees = async (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem('e_station_employees', JSON.stringify(newEmployees));
    await saveCollectionList('employees', newEmployees);
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('e_station_settings', JSON.stringify(newSettings));
    await saveDocument('settings', 'current', newSettings);
  };

  const handleUpdateIdentity = async (newIdentity: InstitutionalIdentity) => {
    setIdentity(newIdentity);
    localStorage.setItem('e_station_identity', JSON.stringify(newIdentity));
    await saveDocument('identity', 'current', newIdentity);

    // Synchronize active session if logged in as Kepala
    if (currentUser && currentUser.role === 'Kepala') {
      const updatedUser = { ...currentUser, name: newIdentity.kepalaStasiunNama };
      setCurrentUser(updatedUser);
      localStorage.setItem('swara_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleResetToProductionMode = async () => {
    if (!window.confirm("PENTING: Apakah Anda yakin ingin menghapus seluruh data dummy (pegawai, perjanjian kinerja, berita, kontrak LPU, target, dan notifikasi) dan masuk ke Mode Produksi bersih?\n\nSemua data dummy bawaan akan dihapus permanen dari Firestore database agar Anda dapat mulai mengisi data riil.")) {
      return;
    }

    try {
      // 1. Mark system as seeded (so it won't re-seed with dummy data on refresh)
      await markSystemSeeded();

      // 2. Clear all collections in firestore by saving empty lists
      await saveCollectionList('employees', []);
      await saveCollectionList('notifications', []);
      await saveCollectionList('contracts', []);
      await saveCollectionList('reporterTargets', []);
      await saveCollectionList('newsReports', []);
      await saveCollectionList('agreements', []);

      // 3. Clear local react state
      setEmployees([]);
      setNotifications([]);
      setContracts([]);
      setReporterTargets([]);
      setNewsReports([]);
      setAgreements([]);

      // Clear local storage backups
      localStorage.removeItem('e_station_employees');
      localStorage.removeItem('e_station_notifications');
      localStorage.removeItem('e_station_contracts');
      localStorage.removeItem('e_station_reporter_targets');
      localStorage.removeItem('e_station_news_reports');
      localStorage.removeItem('e_station_agreements');

      // 4. Force log out to login screen since employees list is now empty
      setCurrentUser(null);
      localStorage.removeItem('swara_current_user');

      alert("Portal berhasil dikosongkan dan dialihkan ke Mode Produksi bersih!\n\nSemua data dummy telah dihapus. Silakan gunakan akun Superadmin (Username: 1871102702910001, Password: orange@dan) untuk masuk dan mulai mendaftarkan data pegawai riil.");
    } catch (error) {
      console.error("Gagal berpindah ke mode produksi:", error);
      alert("Terjadi kesalahan saat mengosongkan database.");
    }
  };

  const handleExportDatabase = () => {
    try {
      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          employees,
          settings,
          identity,
          notifications,
          contracts,
          reporterTargets,
          newsReports,
          agreements,
          systemSeeded: true
        }
      };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const timestampStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      link.href = url;
      link.download = `portal_komando_backup_${timestampStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengekspor database:", error);
      alert("Gagal melakukan ekspor database.");
    }
  };

  const handleImportDatabase = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed || parsed.version !== 1 || !parsed.data) {
        alert("Format file cadangan tidak valid. Pastikan Anda mengunggah file cadangan .json yang benar.");
        return false;
      }
      
      const { data } = parsed;
      
      if (
        !Array.isArray(data.employees) ||
        !data.settings ||
        !data.identity ||
        !Array.isArray(data.notifications) ||
        !Array.isArray(data.contracts) ||
        !Array.isArray(data.reporterTargets) ||
        !Array.isArray(data.newsReports) ||
        !Array.isArray(data.agreements)
      ) {
        alert("File cadangan tidak memiliki struktur data yang lengkap.");
        return false;
      }

      const confirmRestore = window.confirm(
        "PENTING: Tindakan ini akan menimpa seluruh data saat ini di database Firestore dengan data dari file cadangan. Apakah Anda yakin ingin melanjutkan?"
      );
      if (!confirmRestore) return false;

      // Begin importing. Write to Firestore first:
      await saveCollectionList('employees', data.employees);
      await saveDocument('settings', 'current', data.settings);
      await saveDocument('identity', 'current', data.identity);
      await saveCollectionList('notifications', data.notifications);
      await saveCollectionList('contracts', data.contracts);
      await saveCollectionList('reporterTargets', data.reporterTargets);
      await saveCollectionList('newsReports', data.newsReports);
      await saveCollectionList('agreements', data.agreements);
      
      if (data.systemSeeded) {
        await markSystemSeeded();
      }

      // Update local state:
      setEmployees(data.employees);
      setSettings(data.settings);
      setIdentity(data.identity);
      setNotifications(data.notifications);
      setContracts(data.contracts);
      setReporterTargets(data.reporterTargets);
      setNewsReports(data.newsReports);
      setAgreements(data.agreements);

      // Save to localStorage backups
      localStorage.setItem('e_station_employees', JSON.stringify(data.employees));
      localStorage.setItem('e_station_settings', JSON.stringify(data.settings));
      localStorage.setItem('e_station_identity', JSON.stringify(data.identity));
      localStorage.setItem('e_station_notifications', JSON.stringify(data.notifications));
      localStorage.setItem('e_station_contracts', JSON.stringify(data.contracts));
      localStorage.setItem('e_station_reporter_targets', JSON.stringify(data.reporterTargets));
      localStorage.setItem('e_station_news_reports', JSON.stringify(data.newsReports));
      localStorage.setItem('e_station_agreements', JSON.stringify(data.agreements));

      // Check current session user
      const currentLoggedIn = localStorage.getItem('swara_current_user');
      if (currentLoggedIn) {
        const userObj = JSON.parse(currentLoggedIn);
        const userStillExists = data.employees.some((emp: any) => emp.nip === userObj.id || emp.id === userObj.id);
        const isSuperadmin = userObj.id === '1871102702910001';
        if (!userStillExists && !isSuperadmin) {
          setCurrentUser(null);
          localStorage.removeItem('swara_current_user');
          alert("Data berhasil dipulihkan! Sesi Anda telah berakhir karena akun Anda tidak ditemukan di dalam data yang baru diimpor.");
          return true;
        }
      }

      alert("Data berhasil dipulihkan dari file cadangan!");
      return true;
    } catch (error) {
      console.error("Gagal mengimpor database:", error);
      alert("Gagal membaca atau memproses file cadangan. Pastikan format file JSON valid.");
      return false;
    }
  };

  const handleUpdateNotifications = async (newNotifs: CriticalNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('e_station_notifications', JSON.stringify(newNotifs));
    await saveCollectionList('notifications', newNotifs);
  };

  const handleUpdateAgreements = async (newAgs: PerformanceAgreement[]) => {
    const cascaded = recalculateCascade(newAgs, contracts, newsReports, reporterTargets);
    setAgreements(cascaded);
    localStorage.setItem('e_station_agreements', JSON.stringify(cascaded));
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdateContracts = async (newContracts: CooperationContract[]) => {
    setContracts(newContracts);
    localStorage.setItem('e_station_contracts', JSON.stringify(newContracts));
    
    // Auto cascade PNBP totals up to the agreements
    const cascaded = recalculateCascade(agreements, newContracts, newsReports, reporterTargets);
    setAgreements(cascaded);
    localStorage.setItem('e_station_agreements', JSON.stringify(cascaded));

    await saveCollectionList('contracts', newContracts);
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdateReporterTargets = async (newTargets: ReporterTarget[]) => {
    setReporterTargets(newTargets);
    localStorage.setItem('e_station_reporter_targets', JSON.stringify(newTargets));
    
    const cascaded = recalculateCascade(agreements, contracts, newsReports, newTargets);
    setAgreements(cascaded);
    localStorage.setItem('e_station_agreements', JSON.stringify(cascaded));

    await saveCollectionList('reporterTargets', newTargets);
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdateNewsReports = async (newReports: NewsReport[]) => {
    setNewsReports(newReports);
    localStorage.setItem('e_station_news_reports', JSON.stringify(newReports));
    
    const cascaded = recalculateCascade(agreements, contracts, newReports, reporterTargets);
    setAgreements(cascaded);
    localStorage.setItem('e_station_agreements', JSON.stringify(cascaded));

    await saveCollectionList('newsReports', newReports);
    await saveCollectionList('agreements', cascaded);
  };

  // CRUD Operations for Employees
  const addEmployee = (emp: Employee) => {
    const updated = [emp, ...employees];
    handleUpdateEmployees(updated);
  };

  const updateEmployee = (emp: Employee) => {
    const updated = employees.map(e => e.id === emp.id ? emp : e);
    handleUpdateEmployees(updated);
  };

  const deleteEmployee = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pegawai ini?")) {
      const updated = employees.filter(e => e.id !== id);
      setEmployees(updated);
      localStorage.setItem('e_station_employees', JSON.stringify(updated));
      await deleteDocument('employees', id);
    }
  };

  // Notification actions
  const addNotification = (notif: CriticalNotification) => {
    const updated = [notif, ...notifications];
    handleUpdateNotifications(updated);
    
    // Play subtle digital sound for notification alert
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1); // high chirp
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // AudioContext failed or blocked by policy
    }
  };

  const readNotification = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    handleUpdateNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-sm text-center space-y-6 z-10 select-none">
          <div className="flex justify-center">
            <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-full border border-indigo-500/20 relative animate-pulse">
              <Radio className="w-10 h-10 animate-bounce" />
              <span className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-ping" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 font-mono animate-pulse">Sinkronisasi Cloud</h2>
            <h1 className="text-lg font-extrabold text-white">Menghubungkan Portal Komando...</h1>
            <p className="text-xs text-slate-400">Sedang mengamankan data dan memperbarui jaringan operasional aktif.</p>
          </div>
          <div className="flex justify-center items-center gap-2 text-[10px] font-bold text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            <span>KONEKSI TERSERTIFIKASI AMAN</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        employees={employees}
        onLogin={handleLogin}
        namaInstansi={identity.namaInstansi || settings.namaInstansi}
        kepalaStasiunPassword={identity.kepalaStasiunPassword || 'kepala'}
        kepalaStasiunNama={identity.kepalaStasiunNama}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans antialiased">
      
      {/* Navigation Sidebar - Desktop */}
      <aside className={`${isSidebarCollapsed ? 'hidden' : 'hidden md:flex'} flex-col w-64 bg-slate-900 text-white shrink-0 shadow-lg select-none`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-slate-300">Portal Komando</h1>
            <p className="text-[10px] font-bold text-indigo-400 font-mono tracking-tight">RRI BANDAR LAMPUNG</p>
          </div>
        </div>

        {/* User Profile Widget in Sidebar */}
        <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-950/20 flex items-center gap-3">
          {currentUser.photo ? (
            <img 
              src={currentUser.photo} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-600/20 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs border border-indigo-500/30">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
            <p className="text-[9px] font-bold text-indigo-400 tracking-wider font-mono uppercase truncate mt-0.5">
              {currentUser.role === 'Superadmin' 
                ? 'SUPERADMIN' 
                : currentUser.role === 'Ketua Bidang'
                ? `KABID - ${currentUser.division}`
                : currentUser.role === 'Kepala' 
                ? 'KEPALA STASIUN' 
                : `STAFF - ${currentUser.division || ''}`}
            </p>
          </div>
        </div>

        {/* Navigation Tabs List */}
        <nav className="flex-1 p-4 space-y-1.5 pt-4 flex flex-col">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {currentUser.role === 'Kepala' ? 'Capaian Indikator Kinerja Program' : 'Dashboard Bidang'}
          </button>

          {/* Administrasi Kepegawaian (Kepala or Tata Usaha) */}
          {currentUser.role !== 'Kepala' && (currentUser.role === 'Kepala' || currentUser.division === 'Tata Usaha / Umum') && (
            <button
              onClick={() => setActiveTab('kepegawaian')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'kepegawaian' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Administrasi Kepegawaian
            </button>
          )}

          {/* Perjanjian Kinerja (Kepala only) */}
          {currentUser.role === 'Kepala' && (
            <button
              onClick={() => setActiveTab('pk')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'pk' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitFork className="w-4 h-4" />
              Perjanjian Kinerja (PK)
            </button>
          )}

          {/* Input Capaian PK (Superadmin, Kepala, or Ketua Bidang) */}
          {(currentUser.role === 'Superadmin' || currentUser.role === 'Kepala' || currentUser.role === 'Ketua Bidang') && (
            <button
              onClick={() => setActiveTab('input-capaian-pk')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'input-capaian-pk' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Input Capaian PK
            </button>
          )}

          {/* Kerjasama & PNBP (LPU) (Kepala or Layanan Pengembangan Usaha) */}
          {currentUser.role !== 'Kepala' && (currentUser.role === 'Kepala' || currentUser.division === 'Layanan Pengembangan Usaha') && (
            <button
              onClick={() => setActiveTab('lpu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'lpu' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Handshake className="w-4 h-4" />
              Kerjasama & PNBP (LPU)
            </button>
          )}

          {/* Pemberitaan & Media Baru (Accessible to all roles and divisions) */}
          <button
            onClick={() => setActiveTab('pemberitaan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'pemberitaan' 
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Pemberitaan
          </button>

          {/* Dashboard TMB */}
          {currentUser.role !== 'Kepala' && (currentUser.role === 'Kepala' || currentUser.role === 'Superadmin' || currentUser.division === 'Teknik' || currentUser.division === 'Teknologi & Media Baru') && (
            <button
              onClick={() => setActiveTab('tmb')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'tmb' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Dashboard TMB
            </button>
          )}

          {/* Administrasi Aplikasi (Superadmin Only) */}
          {currentUser.role === 'Superadmin' && (
            <button
              onClick={() => setActiveTab('aplikasi')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'aplikasi' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              Administrasi Aplikasi
            </button>
          )}

          <div className="flex-1" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-dashed border-rose-900/30 shrink-0"
          >
            <X className="w-4 h-4 text-rose-500" />
            Keluar Aplikasi
          </button>
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE EXECUTIVE PORTAL
          </div>
          <p className="truncate">{settings.namaInstansi}</p>
          <p>© 2026 PORTAL KOMANDO RRI</p>
        </div>
      </aside>

      {/* Navigation Bar - Mobile */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Portal Komando</h1>
            <p className="text-[8px] font-bold text-indigo-400 font-mono">RRI BANDAR LAMPUNG</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 text-white p-4 space-y-2 select-none shadow-inner z-50">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {currentUser.role === 'Kepala' ? 'Capaian Indikator Kinerja Program' : 'Dashboard Bidang'}
          </button>

          {currentUser.role !== 'Kepala' && (currentUser.role === 'Kepala' || currentUser.division === 'Tata Usaha / Umum') && (
            <button
              onClick={() => { setActiveTab('kepegawaian'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'kepegawaian' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Administrasi Kepegawaian
            </button>
          )}

          {/* Perjanjian Kinerja (PK) */}
          {currentUser.role === 'Kepala' && (
            <button
              onClick={() => { setActiveTab('pk'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'pk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <GitFork className="w-4 h-4" />
              Perjanjian Kinerja (PK)
            </button>
          )}

          {/* Input Capaian PK (Superadmin, Kepala, or Ketua Bidang) */}
          {(currentUser.role === 'Superadmin' || currentUser.role === 'Kepala' || currentUser.role === 'Ketua Bidang') && (
            <button
              onClick={() => { setActiveTab('input-capaian-pk'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'input-capaian-pk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Input Capaian PK
            </button>
          )}

          {currentUser.role !== 'Kepala' && (currentUser.role === 'Kepala' || currentUser.division === 'Layanan Pengembangan Usaha') && (
            <button
              onClick={() => { setActiveTab('lpu'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'lpu' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Handshake className="w-4 h-4" />
              Kerjasama & PNBP (LPU)
            </button>
          )}

          {/* Pemberitaan & Media Baru (Accessible to all roles and divisions) */}
          <button
            onClick={() => { setActiveTab('pemberitaan'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'pemberitaan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Pemberitaan
          </button>

          {/* Dashboard TMB */}
          {currentUser.role !== 'Kepala' && (currentUser.role === 'Kepala' || currentUser.role === 'Superadmin' || currentUser.division === 'Teknik' || currentUser.division === 'Teknologi & Media Baru') && (
            <button
              onClick={() => { setActiveTab('tmb'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'tmb' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Dashboard TMB
            </button>
          )}

          {/* Administrasi Aplikasi (Superadmin Only) */}
          {currentUser.role === 'Superadmin' && (
            <button
              onClick={() => { setActiveTab('aplikasi'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'aplikasi' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              Administrasi Aplikasi
            </button>
          )}

          <button
            onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-rose-400 hover:bg-rose-950/40"
          >
            <X className="w-4 h-4 text-rose-500" />
            Keluar Aplikasi
          </button>
        </div>
      )}

      {/* Primary Application Workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Top Header (Desktop only) */}
        <header className="hidden md:flex justify-between items-center px-8 py-4 bg-white border-b border-slate-100 select-none">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-600 border border-slate-200 flex items-center gap-2 transition-colors"
              title={isSidebarCollapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
            >
              <Menu className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-extrabold text-slate-700">MENU</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                {settings.namaInstansi.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content Workspace with clean padding */}
        <div className="flex-1 p-4 md:p-4 overflow-y-auto">
          {activeTab === 'dashboard' && (
            currentUser.role === 'Kepala' ? (
              <DashboardView
                employees={employees}
                notifications={notifications}
                onAddNotification={addNotification}
                onReadNotification={readNotification}
                contracts={contracts}
                agreements={agreements}
                reporterTargets={reporterTargets}
                newsReports={newsReports}
              />
            ) : (
              <DashboardBidangView
                currentUser={currentUser}
                employees={employees}
                agreements={agreements}
                contracts={contracts}
                reporterTargets={reporterTargets}
                newsReports={newsReports}
                onUpdateAgreements={handleUpdateAgreements}
                onAddNotification={addNotification}
              />
            )
          )}

          {activeTab === 'kepegawaian' && (
            <EmployeeAdminView
              employees={employees}
              onAddEmployee={addEmployee}
              onUpdateEmployee={updateEmployee}
              onDeleteEmployee={deleteEmployee}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'aplikasi' && (
            <AppAdminView
              settings={settings}
              identity={identity}
              onUpdateSettings={handleUpdateSettings}
              onUpdateIdentity={handleUpdateIdentity}
              employees={employees}
              onResetToProductionMode={handleResetToProductionMode}
              onExportDatabase={handleExportDatabase}
              onImportDatabase={handleImportDatabase}
              currentUser={currentUser}
              newsReports={newsReports}
              onUpdateNewsReports={handleUpdateNewsReports}
            />
          )}

          {activeTab === 'pk' && (
            <PerformanceAgreementView
              employees={employees}
              identity={identity}
              settings={settings}
              agreements={agreements}
              onUpdateAgreements={handleUpdateAgreements}
              onAddNotification={addNotification}
              currentUser={currentUser}
              newsReports={newsReports}
              contracts={contracts}
              reporterTargets={reporterTargets}
            />
          )}

          {activeTab === 'lpu' && (
            <CooperationPnbpView
              employees={employees}
              contracts={contracts}
              onUpdateContracts={handleUpdateContracts}
              agreements={agreements}
              onUpdateAgreements={handleUpdateAgreements}
            />
          )}

          {activeTab === 'pemberitaan' && (
            <PemberitaanMediaBaruView
              currentUser={currentUser}
              employees={employees}
              agreements={agreements}
              onUpdateAgreements={handleUpdateAgreements}
              reporterTargets={reporterTargets}
              newsReports={newsReports}
              onUpdateReporterTargets={handleUpdateReporterTargets}
              onUpdateNewsReports={handleUpdateNewsReports}
            />
          )}

          {activeTab === 'tmb' && (
            <DashboardTmbView
              currentUser={currentUser}
              employees={employees}
              agreements={agreements}
              onUpdateAgreements={handleUpdateAgreements}
            />
          )}

          {activeTab === 'input-capaian-pk' && (
            <InputCapaianPKView
              currentUser={currentUser}
              employees={employees}
              agreements={agreements}
              identity={identity}
              settings={settings}
              onUpdateAgreements={handleUpdateAgreements}
              onAddNotification={addNotification}
            />
          )}
        </div>
      </main>

    </div>
  );
}
