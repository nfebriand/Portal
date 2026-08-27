import { useState, useEffect, useRef } from 'react';
import { Employee, AppSettings, InstitutionalIdentity, CriticalNotification, PerformanceAgreement, CooperationContract, ReporterTarget, NewsReport, PromotionActivity } from './types';
import { syncNewsAchievements } from './utils/syncNewsAchievements';
import { syncCompetencyAchievements, isCompetencyIndicator } from './utils/syncCompetencyAchievements';
import { syncPromotionAchievements } from './utils/syncPromotionAchievements';
import { mapEmployeeToAppRole, isTataUsahaDivision, getInitials, getAvatarColor } from './utils/roleHelper';
import DashboardView from './components/DashboardView';
import EmployeeAdminView from './components/EmployeeAdminView';
import AppAdminView from './components/AppAdminView';
import PerformanceAgreementView from './components/PerformanceAgreementView';
import CooperationPnbpView from './components/CooperationPnbpView';
import PemberitaanMediaBaruView from './components/PemberitaanMediaBaruView';
import DokumentasiPromosiView from './components/DokumentasiPromosiView';
import LoginView from './components/LoginView';
import DashboardBidangView from './components/DashboardBidangView';
import DashboardTmbView from './components/DashboardTmbView';
import InputCapaianPKView from './components/InputCapaianPKView';
import PetaKomandoLogo from './components/PetaKomandoLogo';
import PetaKomandoIcon from './components/PetaKomandoIcon';
import { 
  fetchCollection, 
  fetchDocument, 
  saveDocument, 
  saveCollectionList, 
  deleteDocument,
  isSystemSeeded,
  markSystemSeeded,
  subscribeToCollection,
  subscribeToDocument
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
  Calendar,
  LogOut,
  Megaphone
} from 'lucide-react';

const INITIAL_EMPLOYEES: Employee[] = [];

const INITIAL_SETTINGS: AppSettings = {
  namaInstansi: "LPP RRI",
  alamat: "",
  noTelp: ""
};

const INITIAL_IDENTITY: InstitutionalIdentity = {
  kepalaStasiunNama: "",
  kepalaStasiunTtd: "",
  kepalaStasiunUsername: "kepala",
  kepalaStasiunPassword: "kepala",
  kepalaBidangNama: "",
  kepalaBidangTtd: "",
  ketuaTimSiaranNama: "",
  ketuaTimSiaranTtd: "",
  ketuaTimPemberitaanNama: "",
  ketuaTimPemberitaanTtd: "",
  ketuaTimTeknikNama: "",
  ketuaTimTeknikTtd: "",
  ketuaTimKontenNama: "",
  ketuaTimKontenTtd: "",
  ketuaTimLayananNama: "",
  ketuaTimLayananTtd: ""
};

const INITIAL_NOTIFICATIONS: CriticalNotification[] = [];
const INITIAL_AGREEMENTS: PerformanceAgreement[] = [];
const INITIAL_CONTRACTS: CooperationContract[] = [];
const INITIAL_REPORTER_TARGETS: ReporterTarget[] = [];
const INITIAL_NEWS_REPORTS: NewsReport[] = [];
export const INITIAL_PROMOTIONS: PromotionActivity[] = [];

const recalculateCascade = (
  currentAgs: PerformanceAgreement[], 
  currentContracts: CooperationContract[],
  currentNewsReports: NewsReport[] = [],
  currentReporterTargets: ReporterTarget[] = [],
  currentEmployees: Employee[] = [],
  currentPromotions: PromotionActivity[] = []
) => {
  const emps = currentEmployees;

  // 1. Calculate total PNBP for linked indicator 'ind-11'
  const totalPnbpForInd11 = currentContracts
    .filter(c => c.linkedIndicatorId === 'ind-11')
    .reduce((sum, c) => sum + c.realizedPnbp, 0);

  // 2. Map through agreements to update the LPU PNBP objective (ind-11)
  let updated = currentAgs.map(ag => {
    const objectives = (ag.objectives || []).map(obj => {
      if (obj.id === 'ind-11') {
        return { ...obj, achievement: totalPnbpForInd11 };
      }
      return obj;
    });
    return { ...ag, objectives };
  });

  // 3. Sync Competency & 40 JP training compliance to "Persentase pelaksanaan pengembangan kompetensi pegawai"
  updated = syncCompetencyAchievements(emps, updated);

  // 4. Sync news reports counts & monthlyAchievements (12 months) and perform full cascade rollup across Level 1, Level 2, Level 3
  updated = syncNewsAchievements(
    currentNewsReports, 
    updated, 
    currentReporterTargets, 
    emps
  );

  // 5. Sync promotional activities counts & monthlyAchievements and perform full cascade rollup across Level 1, Level 2, Level 3
  updated = syncPromotionAchievements(
    currentPromotions,
    updated,
    emps
  );

  return updated;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kepegawaian' | 'aplikasi' | 'pk' | 'lpu' | 'pemberitaan' | 'tmb' | 'input-capaian-pk' | 'promosi'>(() => {
    const saved = localStorage.getItem('swara_current_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.role === 'Superadmin') return 'aplikasi';
        if (user.division === 'Tata Usaha / Umum' && user.role !== 'Kepala') return 'kepegawaian';
      } catch (e) {}
    }
    return 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_employees');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_EMPLOYEES;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_doc_settings_current');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return INITIAL_SETTINGS;
  });
  const [identity, setIdentity] = useState<InstitutionalIdentity>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_doc_identity_current');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return INITIAL_IDENTITY;
  });
  const [notifications, setNotifications] = useState<CriticalNotification[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_notifications');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [agreements, setAgreements] = useState<PerformanceAgreement[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_agreements');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_AGREEMENTS;
  });
  const [contracts, setContracts] = useState<CooperationContract[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_contracts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [reporterTargets, setReporterTargets] = useState<ReporterTarget[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_reporterTargets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [newsReports, setNewsReports] = useState<NewsReport[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_newsReports');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [promotions, setPromotions] = useState<PromotionActivity[]>(() => {
    try {
      const cached = localStorage.getItem('swara_cache_col_promotions');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_PROMOTIONS;
  });
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
    if (user.role === 'Superadmin') {
      setActiveTab('aplikasi');
    } else if (user.division === 'Tata Usaha / Umum') {
      setActiveTab('kepegawaian');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('swara_current_user');
  };

  const empsRef = useRef(employees);
  useEffect(() => { empsRef.current = employees; }, [employees]);
  const contractsRef = useRef(contracts);
  useEffect(() => { contractsRef.current = contracts; }, [contracts]);
  const newsReportsRef = useRef(newsReports);
  useEffect(() => { newsReportsRef.current = newsReports; }, [newsReports]);
  const reporterTargetsRef = useRef(reporterTargets);
  useEffect(() => { reporterTargetsRef.current = reporterTargets; }, [reporterTargets]);
  const promotionsRef = useRef(promotions);
  useEffect(() => { promotionsRef.current = promotions; }, [promotions]);

  // Load from Firestore on initialization & real-time live synchronization
  useEffect(() => {
    let unsubscribeEmployees: (() => void) | undefined;
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeIdentity: (() => void) | undefined;
    let unsubscribeNotifs: (() => void) | undefined;
    let unsubscribeContracts: (() => void) | undefined;
    let unsubscribeTargets: (() => void) | undefined;
    let unsubscribeReports: (() => void) | undefined;
    let unsubscribePromotions: (() => void) | undefined;
    let unsubscribeAgreements: (() => void) | undefined;

    async function loadData() {
      try {
        setIsSyncing(true);
        const seeded = await isSystemSeeded();
        
        let fireEmployees: Employee[];
        let fireSettings: AppSettings;
        let fireIdentity: InstitutionalIdentity;
        let fireNotifications: CriticalNotification[];
        let fireContracts: CooperationContract[];
        let fireTargets: ReporterTarget[];
        let fireReports: NewsReport[];
        let firePromotions: PromotionActivity[];
        let fireAgreements: PerformanceAgreement[];

        if (!seeded) {
          // Brand new empty database initialization (clean production mode)
          fireEmployees = [];
          fireSettings = INITIAL_SETTINGS;
          fireIdentity = INITIAL_IDENTITY;
          fireNotifications = [];
          fireContracts = [];
          fireTargets = [];
          fireReports = [];
          firePromotions = [];
          fireAgreements = [];

          await saveCollectionList('employees', []);
          await saveDocument('settings', 'current', INITIAL_SETTINGS);
          await saveDocument('identity', 'current', INITIAL_IDENTITY);
          await saveCollectionList('notifications', []);
          await saveCollectionList('contracts', []);
          await saveCollectionList('reporterTargets', []);
          await saveCollectionList('newsReports', []);
          await saveCollectionList('promotions', []);
          await saveCollectionList('agreements', []);
          
          await markSystemSeeded();
        } else {
          // Live Firestore database is already seeded. Fetch live state directly.
          fireEmployees = await fetchCollection<Employee>('employees', []);
          fireSettings = await fetchDocument<AppSettings>('settings', 'current', INITIAL_SETTINGS);
          fireIdentity = await fetchDocument<InstitutionalIdentity>('identity', 'current', INITIAL_IDENTITY);
          fireNotifications = await fetchCollection<CriticalNotification>('notifications', []);
          fireContracts = await fetchCollection<CooperationContract>('contracts', []);
          fireTargets = await fetchCollection<ReporterTarget>('reporterTargets', []);
          fireReports = await fetchCollection<NewsReport>('newsReports', []);
          firePromotions = await fetchCollection<PromotionActivity>('promotions', []);
          fireAgreements = await fetchCollection<PerformanceAgreement>('agreements', []);
        }

        // Sanitize agreements
        let hadPnbpDummy = false;
        fireAgreements = fireAgreements.map((ag) => {
          const hasPnbp = (ag.objectives || []).some(o => 
            o.id === 'ind-15-pnbp' || 
            (o.indicatorName || '')?.toLowerCase().includes('optimalisasi realisasi penerimaan negara bukan pajak') ||
            (o.indicatorName || '')?.toLowerCase().includes('optimalisasi penerimaan negara bukan pajak')
          );
          const hasLinkedToPnbp = (ag.objectives || []).some(o => o.parentIndicatorId === 'ind-15-pnbp');

          if (hasPnbp || hasLinkedToPnbp) {
            hadPnbpDummy = true;
            let filteredObjectives = ag.objectives
              .filter(o => 
                o.id !== 'ind-15-pnbp' && 
                !(o.indicatorName || '')?.toLowerCase().includes('optimalisasi realisasi penerimaan negara bukan pajak') &&
                !(o.indicatorName || '')?.toLowerCase().includes('optimalisasi penerimaan negara bukan pajak')
              )
              .map(o => o.parentIndicatorId === 'ind-15-pnbp' ? { ...o, parentIndicatorId: 'ind-1' } : o);

            if (ag.level === 'Kepala Stasiun' && filteredObjectives.length === 4) {
              filteredObjectives = filteredObjectives.map(o => {
                if (o.id === 'ind-1' || o.id === 'ind-2') return { ...o, weight: 30 };
                if (o.id === 'ind-3' || o.id === 'ind-4') return { ...o, weight: 20 };
                return o;
              });
            }

            return {
              ...ag,
              objectives: filteredObjectives
            };
          }
          return ag;
        });

        let hadTuCompetencyAdded = false;
        fireAgreements = fireAgreements.map(ag => {
          if (ag.level === 'Kabid Tata Usaha' && !(ag.objectives || []).some(o => isCompetencyIndicator(o))) {
            hadTuCompetencyAdded = true;
            return {
              ...ag,
              objectives: [
                ...(ag.objectives || []).map(o => ({ ...o, weight: o.id === 'ind-5' || o.id === 'ind-6' ? 35 : o.weight })),
                {
                  id: "ind-tu-kompetensi",
                  indicatorName: "Persentase pelaksanaan pengembangan kompetensi pegawai",
                  target: "100",
                  unit: "%",
                  weight: 30,
                  achievement: 0,
                  parentIndicatorId: "ind-3",
                  trajectoryType: "constant"
                }
              ]
            };
          }
          return ag;
        });

        if (hadPnbpDummy || hadTuCompetencyAdded) {
          saveCollectionList('agreements', fireAgreements).catch(err => 
            console.warn("Notice: Cleaned agreements sync to live database:", err)
          );
        }

        const migratedEmployees = fireEmployees.map((emp) => {
          if ((emp.divisi as any) === 'Program Acara') emp.divisi = 'Konten Media Baru';
          if ((emp.divisi as any) === 'Teknik') emp.divisi = 'Teknologi dan Media Baru';
          if ((emp.divisi as any) === 'Layanan Publik') emp.divisi = 'Layanan Pengembangan Usaha';
          return emp;
        });

        // Calculate initial cascade rollup
        const initialCascaded = recalculateCascade(fireAgreements, fireContracts, fireReports, fireTargets, migratedEmployees, firePromotions);

        setEmployees(migratedEmployees);
        setSettings(fireSettings);
        setIdentity(fireIdentity);
        setNotifications(fireNotifications);
        setContracts(fireContracts);
        setReporterTargets(fireTargets);
        setNewsReports(fireReports);
        setPromotions(firePromotions);
        setAgreements(initialCascaded);

        // Attach live Firestore real-time listeners
        unsubscribeEmployees = subscribeToCollection<Employee>('employees', (liveEmployees) => {
          if (liveEmployees) {
            const migrated = liveEmployees.map(emp => {
              if ((emp.divisi as any) === 'Program Acara') emp.divisi = 'Konten Media Baru';
              if ((emp.divisi as any) === 'Teknik') emp.divisi = 'Teknologi dan Media Baru';
              if ((emp.divisi as any) === 'Layanan Publik') emp.divisi = 'Layanan Pengembangan Usaha';
              return emp;
            });
            setEmployees(migrated);

            // Synchronize active session if current logged-in employee was updated in database
            const savedUserStr = localStorage.getItem('swara_current_user');
            if (savedUserStr) {
              try {
                const parsedUser = JSON.parse(savedUserStr);
                if (parsedUser && parsedUser.id !== 'superadmin' && parsedUser.id !== 'kepala') {
                  const matchEmp = migrated.find(e => e.id === parsedUser.id);
                  if (matchEmp) {
                    if (matchEmp.isLoginActive === false || (matchEmp.status && matchEmp.status?.toLowerCase() !== 'aktif')) {
                      handleLogout();
                    } else {
                      const updatedRole = mapEmployeeToAppRole(matchEmp);
                      const fullName = `${matchEmp.gelarDepan ? matchEmp.gelarDepan + ' ' : ''}${matchEmp.nama}${matchEmp.gelarBelakang ? ', ' + matchEmp.gelarBelakang : ''}`;
                      const updatedUser = {
                        ...parsedUser,
                        name: fullName,
                        role: updatedRole,
                        division: matchEmp.divisi,
                        photo: matchEmp.foto
                      };
                      setCurrentUser(updatedUser);
                      localStorage.setItem('swara_current_user', JSON.stringify(updatedUser));
                    }
                  }
                }
              } catch (e) {}
            }
          }
        });

        unsubscribeSettings = subscribeToDocument<AppSettings>('settings', 'current', (liveSettings) => {
          if (liveSettings) setSettings(liveSettings);
        });

        unsubscribeIdentity = subscribeToDocument<InstitutionalIdentity>('identity', 'current', (liveIdentity) => {
          if (liveIdentity) setIdentity(liveIdentity);
        });

        unsubscribeNotifs = subscribeToCollection<CriticalNotification>('notifications', (liveNotifs) => {
          if (liveNotifs) setNotifications(liveNotifs);
        });

        unsubscribeContracts = subscribeToCollection<CooperationContract>('contracts', (liveContracts) => {
          if (liveContracts) setContracts(liveContracts);
        });

        unsubscribeTargets = subscribeToCollection<ReporterTarget>('reporterTargets', (liveTargets) => {
          if (liveTargets) setReporterTargets(liveTargets);
        });

        unsubscribeReports = subscribeToCollection<NewsReport>('newsReports', (liveReports) => {
          if (liveReports) setNewsReports(liveReports);
        });

        unsubscribeAgreements = subscribeToCollection<PerformanceAgreement>('agreements', (liveAgs) => {
          if (liveAgs && liveAgs.length > 0) {
            setAgreements(liveAgs);
          }
        });

        unsubscribePromotions = subscribeToCollection<PromotionActivity>('promotions', (livePromos) => {
          if (livePromos) {
            setPromotions(livePromos);
          }
        });
      } catch (err) {
        console.error("Critical error during live Firestore database sync:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    loadData();

    return () => {
      if (unsubscribeEmployees) unsubscribeEmployees();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeIdentity) unsubscribeIdentity();
      if (unsubscribeNotifs) unsubscribeNotifs();
      if (unsubscribeContracts) unsubscribeContracts();
      if (unsubscribeTargets) unsubscribeTargets();
      if (unsubscribeReports) unsubscribeReports();
      if (unsubscribePromotions) unsubscribePromotions();
    };
  }, []);

  // Sync helpers
  const handleUpdateEmployees = async (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    await saveCollectionList('employees', newEmployees);

    // Auto calculate 40 JP competency compliance and cascade to PK
    const autoSyncedAgreements = syncCompetencyAchievements(newEmployees, agreements);
    const cascaded = recalculateCascade(autoSyncedAgreements, contracts, newsReports, reporterTargets, newEmployees, promotions);
    setAgreements(cascaded);
    await saveCollectionList('agreements', cascaded);

    // Synchronize active session if current logged in user was modified
    if (currentUser && currentUser.id !== 'superadmin' && currentUser.id !== 'kepala') {
      const matchEmp = newEmployees.find(e => e.id === currentUser.id);
      if (matchEmp) {
        if (matchEmp.isLoginActive === false || (matchEmp.status && matchEmp.status?.toLowerCase() !== 'aktif')) {
          handleLogout();
        } else {
          const updatedRole = mapEmployeeToAppRole(matchEmp);
          const fullName = `${matchEmp.gelarDepan ? matchEmp.gelarDepan + ' ' : ''}${matchEmp.nama}${matchEmp.gelarBelakang ? ', ' + matchEmp.gelarBelakang : ''}`;
          const updatedUser = {
            ...currentUser,
            name: fullName,
            role: updatedRole,
            division: matchEmp.divisi,
            photo: matchEmp.foto
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('swara_current_user', JSON.stringify(updatedUser));
        }
      }
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveDocument('settings', 'current', newSettings);
  };

  const handleUpdateIdentity = async (newIdentity: InstitutionalIdentity) => {
    setIdentity(newIdentity);
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
      await saveCollectionList('promotions', []);
      await saveCollectionList('agreements', []);

      // 3. Clear local react state
      setEmployees([]);
      setNotifications([]);
      setContracts([]);
      setReporterTargets([]);
      setNewsReports([]);
      setPromotions([]);
      setAgreements([]);

      // Clear local storage backups
      localStorage.removeItem('e_station_employees');
      localStorage.removeItem('e_station_notifications');
      localStorage.removeItem('e_station_contracts');
      localStorage.removeItem('e_station_reporter_targets');
      localStorage.removeItem('e_station_news_reports');
      localStorage.removeItem('e_station_promotions');
      localStorage.removeItem('e_station_agreements');
      localStorage.removeItem('swara_cache_col_promotions');

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
          promotions,
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

  const handleImportDatabase = async (
    jsonString: string,
    onProgress?: (progress: number, message: string, step?: string) => void
  ): Promise<boolean> => {
    try {
      if (onProgress) onProgress(5, "Membaca dan memvalidasi file cadangan...", "Validasi");
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

      // Helper to simulate smooth progress transitions
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      // 1. Pegawai
      if (onProgress) onProgress(15, `Menyimpan ${data.employees.length} data Pegawai ke Firestore...`, "Pegawai");
      await saveCollectionList('employees', data.employees);
      await delay(150);

      // 2. Settings & Identity
      if (onProgress) onProgress(30, "Menyimpan Pengaturan & Profil Identitas Instansi...", "Pengaturan");
      await saveDocument('settings', 'current', data.settings);
      await saveDocument('identity', 'current', data.identity);
      await delay(150);

      // 3. Notifikasi
      if (onProgress) onProgress(45, `Menyimpan ${data.notifications.length} data Notifikasi Sistem...`, "Notifikasi");
      await saveCollectionList('notifications', data.notifications);
      await delay(150);

      // 4. Kontrak & PNBP
      if (onProgress) onProgress(60, `Menyimpan ${data.contracts.length} data Kontrak Kerja Sama PNBP...`, "Kontrak");
      await saveCollectionList('contracts', data.contracts);
      await delay(150);

      // 5. Target & Laporan Berita
      if (onProgress) onProgress(75, `Menyimpan ${data.newsReports.length} data Laporan Berita & Media Baru...`, "Berita");
      await saveCollectionList('reporterTargets', data.reporterTargets);
      await saveCollectionList('newsReports', data.newsReports);
      await delay(150);

      // 6. Promosi
      if (Array.isArray(data.promotions)) {
        if (onProgress) onProgress(85, `Menyimpan ${data.promotions.length} data Kegiatan Promosi...`, "Promosi");
        await saveCollectionList('promotions', data.promotions);
        await delay(150);
      }

      // 7. Perjanjian Kinerja
      if (onProgress) onProgress(95, `Menyimpan ${data.agreements.length} data Perjanjian Kinerja SAKIP...`, "PK SAKIP");
      await saveCollectionList('agreements', data.agreements);
      await delay(150);
      
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
      if (Array.isArray(data.promotions)) {
        setPromotions(data.promotions);
      }
      setAgreements(data.agreements);

      if (onProgress) onProgress(100, "Sinkronisasi selesai! Data berhasil dipulihkan.", "Selesai");
      await delay(300);

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

      return true;
    } catch (error) {
      console.error("Gagal mengimpor database:", error);
      alert("Gagal membaca atau memproses file cadangan. Pastikan format file JSON valid.");
      return false;
    }
  };

  const handleUpdateNotifications = async (newNotifs: CriticalNotification[]) => {
    setNotifications(newNotifs);
    await saveCollectionList('notifications', newNotifs);
  };

  const handleUpdateAgreements = async (newAgs: PerformanceAgreement[]) => {
    const cascaded = recalculateCascade(newAgs, contracts, newsReports, reporterTargets, employees, promotions);
    setAgreements(cascaded);
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdateContracts = async (newContracts: CooperationContract[]) => {
    setContracts(newContracts);
    
    // Auto cascade PNBP totals up to the agreements
    const cascaded = recalculateCascade(agreements, newContracts, newsReports, reporterTargets, employees, promotions);
    setAgreements(cascaded);

    await saveCollectionList('contracts', newContracts);
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdateReporterTargets = async (newTargets: ReporterTarget[]) => {
    setReporterTargets(newTargets);
    
    const cascaded = recalculateCascade(agreements, contracts, newsReports, newTargets, employees, promotions);
    setAgreements(cascaded);

    await saveCollectionList('reporterTargets', newTargets);
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdateNewsReports = async (newReports: NewsReport[]) => {
    setNewsReports(newReports);
    
    const autoSyncedAgreements = syncNewsAchievements(newReports, agreements, reporterTargets, employees);
    const cascaded = recalculateCascade(autoSyncedAgreements, contracts, newReports, reporterTargets, employees, promotions);
    setAgreements(cascaded);

    await saveCollectionList('newsReports', newReports);
    await saveCollectionList('agreements', cascaded);
  };

  const handleUpdatePromotions = async (newPromos: PromotionActivity[]) => {
    setPromotions(newPromos);
    
    const autoSyncedAgreements = syncPromotionAchievements(newPromos, agreements, employees);
    const cascaded = recalculateCascade(autoSyncedAgreements, contracts, newsReports, reporterTargets, employees, newPromos);
    setAgreements(cascaded);

    await saveCollectionList('promotions', newPromos);
    await saveCollectionList('agreements', cascaded);
  };

  const handleSavePromotion = async (promo: PromotionActivity) => {
    const exists = promotions.some(p => p.id === promo.id);
    let updatedPromos: PromotionActivity[];
    if (exists) {
      updatedPromos = promotions.map(p => p.id === promo.id ? promo : p);
    } else {
      updatedPromos = [promo, ...promotions];
    }
    await handleUpdatePromotions(updatedPromos);
  };

  const handleDeletePromotion = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data kegiatan promosi ini?")) {
      const updatedPromos = promotions.filter(p => p.id !== id);
      await handleUpdatePromotions(updatedPromos);
      await deleteDocument('promotions', id);
    }
  };

  // CRUD Operations for Employees
  const addEmployee = async (emp: Employee) => {
    const updated = [emp, ...employees];
    await handleUpdateEmployees(updated);
  };

  const updateEmployee = async (emp: Employee) => {
    const updated = employees.map(e => e.id === emp.id ? emp : e);
    await handleUpdateEmployees(updated);
  };

  const deleteEmployee = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pegawai ini dari database live?")) {
      const updated = employees.filter(e => e.id !== id);
      await handleUpdateEmployees(updated);
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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Ambient neon radial glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Central Splash Container */}
        <div className="w-full max-w-xl text-center space-y-7 z-10 px-2">
          
          {/* Official Peta Komando RRI Logo with subtle pulse */}
          {settings.splashLogoUrl ? (
            <div className="flex justify-center transition-transform hover:scale-[1.02] duration-300">
              <div className="w-full max-w-[560px] p-2 sm:p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-md relative group flex items-center justify-center min-h-[140px]">
                <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-transparent to-indigo-500/10 rounded-2xl animate-pulse" />
                <img 
                  src={settings.splashLogoUrl} 
                  alt="Peta Komando Splash Screen" 
                  className="relative z-10 max-h-44 max-w-full w-auto h-auto object-contain drop-shadow-2xl rounded-xl"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center transition-transform hover:scale-[1.02] duration-300">
              <div className="w-full max-w-[560px] p-2 sm:p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-md relative group">
                <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-transparent to-indigo-500/10 rounded-2xl animate-pulse" />
                <PetaKomandoLogo size="xl" className="relative z-10" />
              </div>
            </div>
          )}

          {/* Database Connection Status with Blinking Dots */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>SINKRONISASI SISTEM REAL-TIME</span>
            </div>

            <div className="flex items-center justify-center gap-0.5 text-base sm:text-lg font-extrabold text-white tracking-wide">
              <span>Sedang Menghubungkan Basis Data</span>
              <span className="inline-flex text-cyan-400 font-mono tracking-widest pl-1 font-black">
                <span className="animate-pulse duration-500" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-pulse duration-500" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-pulse duration-500" style={{ animationDelay: '300ms' }}>.</span>
                <span className="animate-pulse duration-500" style={{ animationDelay: '450ms' }}>.</span>
                <span className="animate-pulse duration-500" style={{ animationDelay: '600ms' }}>.</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Memverifikasi koneksi cloud database Firestore dan mengamankan jaringan komando operasional.
            </p>
          </div>

          {/* Security Badge */}
          <div className="flex justify-center items-center gap-2 text-[11px] font-extrabold text-emerald-400/90 font-mono">
            <ShieldCheck className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>KONEKSI ENKRIPSI PROTOKOL AMAN</span>
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
        kepalaStasiunUsername={identity.kepalaStasiunUsername || 'kepala'}
        kepalaStasiunPassword={identity.kepalaStasiunPassword || 'kepala'}
        kepalaStasiunNama={identity.kepalaStasiunNama}
        loginLogoUrl={settings.loginLogoUrl}
        appLogoUrl={settings.appLogoUrl}
      />
    );
  }

  // Access control for "Input Capaian PK": Accessible by Admin Bidang, Ketua Bidang/Tim, Kasatker, and Superadmin
  const currentEmpRecord = employees.find(e => e.id === currentUser.id || e.nip === currentUser.id || e.nik === currentUser.id);
  const currentLoginRole = (currentUser as any).loginRole || currentEmpRecord?.loginRole;
  const currentJabatan = ((currentUser as any).jabatan || currentEmpRecord?.jabatan || '')?.toLowerCase();
  
  const canAccessInputCapaianPK = 
    currentUser.role === 'Superadmin' || 
    currentUser.role === 'Kepala' || 
    currentUser.role === 'Ketua Bidang' ||
    currentLoginRole === 'Super Admin' ||
    currentLoginRole === 'Kepala Satker' ||
    currentLoginRole === 'Ketua Tim' ||
    currentLoginRole === 'Admin Tim' ||
    currentJabatan.includes('admin') ||
    currentJabatan.includes('ketua') ||
    currentJabatan.includes('kepala') ||
    currentJabatan.includes('pengelola') ||
    currentUser.isEditor;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans antialiased">
      
      {/* Navigation Sidebar - Desktop */}
      <aside className={`${isSidebarCollapsed ? 'hidden' : 'hidden md:flex'} flex-col w-64 bg-slate-900 text-white shrink-0 shadow-lg select-none`}>
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="shrink-0 p-1 bg-slate-950 rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-500/10 flex items-center justify-center w-11 h-11 overflow-hidden">
            {settings.appLogoUrl ? (
              <img 
                src={settings.appLogoUrl} 
                alt="App Logo" 
                className="w-9 h-9 object-contain rounded-lg"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <PetaKomandoIcon size={38} className="animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono">Peta Komando</h1>
            <p className="text-[10px] font-extrabold text-slate-200 tracking-tight">RRI BANDAR LAMPUNG</p>
          </div>
        </div>

        {/* User Profile Widget in Sidebar */}
        <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-950/20 flex items-center gap-3">
          {(() => {
            const pal = getAvatarColor(currentUser.name);
            return (
              <div className={`w-10 h-10 rounded-xl ${pal.bg} ${pal.text} ${pal.border} border font-black text-sm flex items-center justify-center shrink-0 shadow-sm font-mono tracking-wider`}>
                {getInitials(currentUser.name)}
              </div>
            );
          })()}
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
        <nav className="flex-1 p-4 space-y-1.5 pt-3 flex flex-col">
          {currentUser.role !== 'Superadmin' && (
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
          )}

          {/* Menu Kepegawaian / Profil Pegawai (Accessible according to RBAC) */}
          <button
            onClick={() => setActiveTab('kepegawaian')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'kepegawaian' 
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {currentUser.role === 'Kepala' 
                ? 'Rekapitulasi Kepegawaian' 
                : isTataUsahaDivision(currentUser.division)
                ? 'Administrasi Kepegawaian'
                : currentUser.role === 'Staff' 
                ? 'Profil Pegawai Saya' 
                : 'Kepegawaian & Pelatihan SDM'}
            </span>
          </button>

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

          {/* Input Capaian PK (Admin Bidang, Ketua Bidang/Tim, Kasatker, Superadmin) */}
          {canAccessInputCapaianPK && (
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

          {/* Pemberitaan & Media Baru */}
          {currentUser.role !== 'Superadmin' && (
          <button
            onClick={() => setActiveTab('pemberitaan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'pemberitaan' 
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Produksi Siaran & Berita
          </button>
          )}

          {/* Dokumentasi Promosi */}
          {currentUser.role !== 'Superadmin' && (currentUser.division === 'Layanan Pengembangan Usaha' || currentUser.role === 'Kepala') && (
            <button
              onClick={() => setActiveTab('promosi')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'promosi' 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Dokumentasi Promosi</span>
              {promotions.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-mono">
                  {promotions.length}
                </span>
              )}
            </button>
          )}

          {/* Dashboard TMB */}
          {currentUser.role !== 'Superadmin' && currentUser.role !== 'Kepala' && (currentUser.division === 'Teknik' || currentUser.division === 'Teknologi & Media Baru') && (
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
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE EXECUTIVE PORTAL
          </div>
          <p className="truncate">{settings.namaInstansi}</p>
          <p>© 2026 PETA KOMANDO RRI</p>
        </div>
      </aside>

      {/* Navigation Bar - Mobile */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 p-1 bg-slate-950 rounded-lg border border-cyan-500/30 flex items-center justify-center w-8 h-8 overflow-hidden">
            {settings.appLogoUrl ? (
              <img 
                src={settings.appLogoUrl} 
                alt="App Logo" 
                className="w-6 h-6 object-contain rounded"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <PetaKomandoIcon size={28} />
            )}
          </div>
          <div>
            <h1 className="text-[11px] font-black uppercase tracking-wider text-cyan-400 font-mono">Peta Komando</h1>
            <p className="text-[8px] font-bold text-slate-300">RRI BANDAR LAMPUNG</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Top Logout button for Mobile Header */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
            title="Keluar Aplikasi"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Keluar</span>
          </button>
          {/* Hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 text-white p-4 space-y-2 select-none shadow-inner z-50">
          {currentUser.role !== 'Superadmin' && (
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {currentUser.role === 'Kepala' ? 'Capaian Indikator Kinerja Program' : 'Dashboard Bidang'}
          </button>
          )}

          {/* Menu Kepegawaian / Profil Pegawai (Accessible according to RBAC) */}
          <button
            onClick={() => { setActiveTab('kepegawaian'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'kepegawaian' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {currentUser.role === 'Kepala' 
                ? 'Rekapitulasi Kepegawaian' 
                : isTataUsahaDivision(currentUser.division)
                ? 'Administrasi Kepegawaian'
                : currentUser.role === 'Staff' 
                ? 'Profil Pegawai Saya' 
                : 'Kepegawaian & Pelatihan SDM'}
            </span>
          </button>

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

          {/* Input Capaian PK (Admin Bidang, Ketua Bidang/Tim, Kasatker, Superadmin) */}
          {canAccessInputCapaianPK && (
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

          {/* Pemberitaan & Media Baru */}
          {currentUser.role !== 'Superadmin' && (
          <button
            onClick={() => { setActiveTab('pemberitaan'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'pemberitaan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Produksi Siaran & Berita
          </button>
          )}

          {/* Dokumentasi Promosi */}
          {currentUser.role !== 'Superadmin' && (currentUser.division === 'Layanan Pengembangan Usaha' || currentUser.role === 'Kepala') && (
            <button
              onClick={() => { setActiveTab('promosi'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'promosi' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Dokumentasi Promosi</span>
              {promotions.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-mono">
                  {promotions.length}
                </span>
              )}
            </button>
          )}

          {/* Dashboard TMB */}
          {currentUser.role !== 'Superadmin' && currentUser.role !== 'Kepala' && (currentUser.division === 'Teknik' || currentUser.division === 'Teknologi & Media Baru') && (
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
        </div>
      )}

      {/* Primary Application Workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Top Header (Desktop only) */}
        <header className="hidden md:flex justify-between items-center px-8 py-3.5 bg-white border-b border-slate-200/80 shadow-2xs select-none sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-600 border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
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

          {/* User Profile & Quick Logout Button at the Top Workspace Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              {(() => {
                const pal = getAvatarColor(currentUser.name);
                return (
                  <div className={`w-7 h-7 rounded-lg ${pal.bg} ${pal.text} ${pal.border} border font-black text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono`}>
                    {getInitials(currentUser.name)}
                  </div>
                );
              })()}
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-none">{currentUser.name}</span>
                <span className="text-[9px] font-semibold text-slate-400 font-mono block mt-0.5">{currentUser.role} {currentUser.division ? `• ${currentUser.division}` : ''}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/80 shadow-2xs transition-all cursor-pointer"
              title="Keluar dari Aplikasi"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Keluar Aplikasi</span>
            </button>
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
                promotions={promotions}
                identity={identity}
                settings={settings}
              />
            ) : (
              <DashboardBidangView
                currentUser={currentUser}
                employees={employees}
                agreements={agreements}
                contracts={contracts}
                reporterTargets={reporterTargets}
                newsReports={newsReports}
                promotions={promotions}
                onUpdateAgreements={handleUpdateAgreements}
                onAddNotification={addNotification}
                identity={identity}
                settings={settings}
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
              onUpdateEmployees={handleUpdateEmployees}
              notifications={notifications}
              onUpdateNotifications={handleUpdateNotifications}
              agreements={agreements}
              onUpdateAgreements={handleUpdateAgreements}
              contracts={contracts}
              onUpdateContracts={handleUpdateContracts}
              reporterTargets={reporterTargets}
              onUpdateReporterTargets={handleUpdateReporterTargets}
              onResetToProductionMode={handleResetToProductionMode}
              onExportDatabase={handleExportDatabase}
              onImportDatabase={handleImportDatabase}
              currentUser={currentUser}
              newsReports={newsReports}
              onUpdateNewsReports={handleUpdateNewsReports}
              promotions={promotions}
              onUpdatePromotions={handleUpdatePromotions}
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
              promotions={promotions}
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

          {activeTab === 'promosi' && (
            <DokumentasiPromosiView
              promotions={promotions}
              onSavePromotion={handleSavePromotion}
              onDeletePromotion={handleDeletePromotion}
              currentUser={currentUser}
              employees={employees}
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
              newsReports={newsReports}
              contracts={contracts}
              reporterTargets={reporterTargets}
              onUpdateAgreements={handleUpdateAgreements}
              onUpdateNewsReports={handleUpdateNewsReports}
              onAddNotification={addNotification}
            />
          )}
        </div>
      </main>

    </div>
  );
}
