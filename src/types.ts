export interface Employee {
  id: string;
  nik: string;
  nip: string;
  nama: string;
  gelarDepan: string;
  gelarBelakang: string;
  jenjangPendidikan: 'SMA' | 'D3' | 'S1' | 'S2' | 'S3';
  divisi: 'Tata Usaha / Umum' | 'Siaran' | 'Pemberitaan' | 'Teknologi dan Media Baru' | 'Konten Media Baru' | 'Layanan Pengembangan Usaha';
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  alamat: string;
  noHp: string;
  foto: string; // Base64 Data URL or standard preset avatar SVG/URL
  ttdElektronik: string; // Base64 Data URL of signature
  createdAt: string;
  role?: 'Staff' | 'Ketua Bidang' | 'Superadmin';
  isEditor?: boolean;
  password?: string;
}

export interface AppSettings {
  namaInstansi: string;
  alamat: string;
  noTelp: string;
}

export interface InstitutionalIdentity {
  kepalaStasiunNama: string;
  kepalaStasiunTtd: string; // Base64 Data URL
  kepalaStasiunUsername?: string;
  kepalaStasiunPassword?: string;
  kepalaBidangNama: string; // Kepala Bidang Tata Usaha
  kepalaBidangTtd: string; // Base64 Data URL
  ketuaTimSiaranNama: string;
  ketuaTimSiaranTtd: string; // Base64 Data URL
  ketuaTimPemberitaanNama: string;
  ketuaTimPemberitaanTtd: string; // Base64 Data URL
  ketuaTimTeknikNama: string;
  ketuaTimTeknikTtd: string; // Base64 Data URL
  ketuaTimKontenNama: string;
  ketuaTimKontenTtd: string; // Base64 Data URL
  ketuaTimLayananNama: string;
  ketuaTimLayananTtd: string; // Base64 Data URL
}

export interface IndicatorComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface PerformanceIndicator {
  id: string;
  indicatorName: string; // Indikator Kinerja Utama (IKU) / Sasaran
  target: string; // e.g. "95%", "12 Dokumen"
  unit: string; // e.g. "%", "Laporan", "Konten"
  weight: number; // Bobot percentage, e.g. 25
  achievement: number; // Realisasi, e.g. 90
  parentIndicatorId?: string; // Links back to parent target for cascading traceability
  comments?: IndicatorComment[];
  trajectory?: number[]; // Proyeksi target per bulan (12 bulan, indeks 0 = Jan, 11 = Des)
  trajectoryType?: 'cumulative' | 'constant'; // Trajectory accumulation type: cumulative or constant/average
  monthlyAchievements?: number[]; // Realisasi per bulan (12 bulan, indeks 0 = Jan, 11 = Des)
  manualAchievements?: number[]; // Realisasi manual (tambahan) per bulan (12 bulan, indeks 0 = Jan, 11 = Des)
  calculationType?: 'automatic' | 'manual'; // Level 2 calculation source: automatic from staff or manual intervention
  periodType?: 'tahunan' | 'triwulanan' | 'semesteran'; // Tipe evaluasi capaian terhadap target tahunan
}

export interface PerformanceAgreement {
  id: string;
  year: number;
  level: 'Kepala Stasiun' | 'Kabid Tata Usaha' | 'Ketua Tim Siaran' | 'Ketua Tim Pemberitaan' | 'Ketua Tim Teknologi dan Media Baru' | 'Ketua Tim Konten Media Baru' | 'Ketua Tim Layanan Pengembangan Usaha' | 'Pegawai';
  assignedToEmployeeId?: string; // If level is 'Pegawai', links to specific employee
  assignedToName: string; // Name of person responsible
  objectives: PerformanceIndicator[];
  status: 'Draft' | 'Aktif' | 'Evaluasi' | 'Tercapai';
  signaturePembuat?: string; // Signature of the maker (Base64)
  signaturePenerima?: string; // Signature of the receiver/delegated (Base64)
  createdAt: string;
}

export interface CriticalNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  timestamp: string;
  isRead: boolean;
  metricValue?: string;
  metricName?: string;
}

export interface CooperationContract {
  id: string;
  partnerName: string; // Nama Mitra
  contractNo: string; // Nomor Kontrak
  activityName: string; // Nama Kegiatan/Sewa
  cooperationType: 'Iklan/Siar Layanan' | 'Sewa Lahan/Menara' | 'Sponsorship Acara' | 'Lainnya'; // Jenis Kerjasama
  value: number; // Nilai Kontrak (dalam Juta Rupiah)
  realizedPnbp: number; // Realisasi Pendapatan PNBP (dalam Juta Rupiah)
  paymentStatus: 'Belum Bayar' | 'Selesai Sebagian' | 'Lunas'; // Status Pembayaran
  startDate: string; // Tanggal Mulai
  endDate: string; // Tanggal Selesai
  notes?: string; // Catatan Tambahan
  linkedIndicatorId: string; // ID Sasaran Kinerja Terkait (e.g., 'ind-11')
}

export interface ReporterTarget {
  id: string;
  employeeId: string;
  dailyTarget: number;
  monthlyTarget: number;
  mediaType?: string; // e.g. 'Berita Online', 'Berita Radio', 'Berita Ringan LPU', 'Konten Siaran'
  linkedIndicatorId: string; // ID of the Pegawai performance indicator this target links to
  year: number;
  editorId?: string; // Designated Editor's Employee ID
}

export interface NewsReport {
  id: string;
  employeeId: string; // reporter who created this
  editorId?: string; // Editor's Employee ID who inputted/approved this
  title: string; // nama berita/konten media sosial
  url: string; // link eviden
  type: 'Berita Ringan' | 'Berita Radio' | 'Berita Online' | 'Berita Ringan LPU' | 'Konten Siaran';
  date: string; // tanggal lapor
  programa?: 'Programa 1' | 'Programa 2' | 'Programa 3' | 'Programa 4'; // Programa 1/2/3/4
  writerName?: string; // nama penulis
  editorName?: string; // nama editor
  category?: 'teks' | 'radio' | 'adlibs' | 'feature' | 'podcast' | 'sosmed' | string;
  publishDateTime?: string; // tgl jam publish
  reporterName?: string; // nama pembuat
  daerah?: string; // daerah berita
}


