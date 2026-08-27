import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, jsonb, boolean, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(), // Using text because old app uses UUID/string IDs
  nik: text('nik'),
  nip: text('nip'),
  nama: text('nama').notNull(),
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'),
  gelarDepan: text('gelar_depan'),
  gelarBelakang: text('gelar_belakang'),
  alamat: text('alamat'),
  noHp: text('no_hp'),
  surel: text('surel'),
  golDarah: text('gol_darah'),
  jabatan: text('jabatan'),
  jenisJabatan: text('jenis_jabatan'),
  status: text('status'),
  jenjangPendidikan: text('jenjang_pendidikan'),
  divisi: text('divisi'),
  jenisKelamin: text('jenis_kelamin'),
  agama: text('agama'),
  pangkatGolongan: text('pangkat_golongan'),
  riwayatPendidikan: jsonb('riwayat_pendidikan'),
  riwayatPelatihan: jsonb('riwayat_pelatihan'),
  kompetensi: jsonb('kompetensi'),
  loginRole: text('login_role'),
  username: text('username'),
  password: text('password'),
  isLoginActive: boolean('is_login_active'),
  foto: text('foto'),
  ttdElektronik: text('ttd_elektronik'),
  createdAt: timestamp('created_at').defaultNow(),
  role: text('role'),
  isEditor: boolean('is_editor'),
});

export const performanceAgreements = pgTable('performance_agreements', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  level: text('level').notNull(),
  assignedToEmployeeId: text('assigned_to_employee_id'),
  assignedToName: text('assigned_to_name').notNull(),
  objectives: jsonb('objectives'),
  status: text('status').notNull(),
  signaturePembuat: text('signature_pembuat'),
  signaturePenerima: text('signature_penerima'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cooperationContracts = pgTable('cooperation_contracts', {
  id: text('id').primaryKey(),
  partnerName: text('partner_name').notNull(),
  contractNo: text('contract_no').notNull(),
  activityName: text('activity_name').notNull(),
  cooperationType: text('cooperation_type').notNull(),
  value: doublePrecision('value').notNull(),
  realizedPnbp: doublePrecision('realized_pnbp').notNull(),
  paymentStatus: text('payment_status').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  notes: text('notes'),
  linkedIndicatorId: text('linked_indicator_id').notNull(),
});

export const reporterTargets = pgTable('reporter_targets', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  dailyTarget: integer('daily_target').notNull(),
  monthlyTarget: integer('monthly_target').notNull(),
  mediaType: text('media_type'),
  linkedIndicatorId: text('linked_indicator_id').notNull(),
  year: integer('year').notNull(),
  editorId: text('editor_id'),
});

export const newsReports = pgTable('news_reports', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  editorId: text('editor_id'),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull(),
  date: text('date').notNull(),
  programa: text('programa'),
  writerName: text('writer_name'),
  editorName: text('editor_name'),
  category: text('category'),
  publishDateTime: text('publish_date_time'),
  reporterName: text('reporter_name'),
  daerah: text('daerah'),
});

export const promotionActivities = pgTable('promotion_activities', {
  id: text('id').primaryKey(),
  tanggal: text('tanggal').notNull(),
  namaKegiatan: text('nama_kegiatan').notNull(),
  baliho: integer('baliho').default(0),
  spanduk: integer('spanduk').default(0),
  videotron: integer('videotron').default(0),
  umbulUmbul: integer('umbul_umbul').default(0),
  pamflet: integer('pamflet').default(0),
  yt: integer('yt').default(0),
  ig: integer('ig').default(0),
  tiktok: integer('tiktok').default(0),
  fb: integer('fb').default(0),
  eFlyer: integer('e_flyer').default(0),
  jumlah: integer('jumlah').default(0),
  keterangan: text('keterangan'),
  linkDokumentasi: text('link_dokumentasi'),
  fotoDokumentasi: text('foto_dokumentasi'),
  creatorId: text('creator_id'),
  creatorName: text('creator_name'),
  divisi: text('divisi'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey(), // just use a constant string like "default"
  namaInstansi: text('nama_instansi'),
  alamat: text('alamat'),
  noTelp: text('no_telp'),
});

export const institutionalIdentity = pgTable('institutional_identity', {
  id: text('id').primaryKey(), // just use a constant string like "default"
  kepalaStasiunNama: text('kepala_stasiun_nama'),
  kepalaStasiunTtd: text('kepala_stasiun_ttd'),
  kepalaStasiunUsername: text('kepala_stasiun_username'),
  kepalaStasiunPassword: text('kepala_stasiun_password'),
  kepalaBidangNama: text('kepala_bidang_nama'),
  kepalaBidangTtd: text('kepala_bidang_ttd'),
  ketuaTimSiaranNama: text('ketua_tim_siaran_nama'),
  ketuaTimSiaranTtd: text('ketua_tim_siaran_ttd'),
  ketuaTimPemberitaanNama: text('ketua_tim_pemberitaan_nama'),
  ketuaTimPemberitaanTtd: text('ketua_tim_pemberitaan_ttd'),
  ketuaTimTeknikNama: text('ketua_tim_teknik_nama'),
  ketuaTimTeknikTtd: text('ketua_tim_teknik_ttd'),
  ketuaTimKontenNama: text('ketua_tim_konten_nama'),
  ketuaTimKontenTtd: text('ketua_tim_konten_ttd'),
  ketuaTimLayananNama: text('ketua_tim_layanan_nama'),
  ketuaTimLayananTtd: text('ketua_tim_layanan_ttd'),
});

export const criticalNotifications = pgTable('critical_notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  timestamp: text('timestamp').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  metricValue: text('metric_value'),
  metricName: text('metric_name'),
});

