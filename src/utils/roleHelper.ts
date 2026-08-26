import { Employee } from '../types';

export type ResolvedRole = 'Superadmin' | 'Kepala Satker' | 'Kepala Bidang' | 'Admin Bidang' | 'Staff';

/**
 * Standardizes mapping from employee data to application user role.
 * Role hierarchy:
 * - 'Superadmin': loginRole === 'Super Admin' or role === 'Superadmin'
 * - 'Kepala Satker' (or 'Kepala'): loginRole === 'Kepala Satker' or jabatan === 'kepala satker' or role === 'Kepala'
 * - 'Admin Bidang': loginRole in ('Admin Tim', 'Admin Bidang') or jabatan === 'admin bidang'
 * - 'Kepala Bidang': loginRole in ('Ketua Tim', 'Kepala Bidang') or jabatan in ('ketua bidang', 'kabid') or role === 'Ketua Bidang'
 * - 'Staff': regular staff / default
 */
export function mapEmployeeToAppRole(emp?: Partial<Employee> | null): 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin' {
  if (!emp) return 'Staff';

  const loginRole = (emp.loginRole || '').toLowerCase().trim();
  const jabatan = (emp.jabatan || '').toLowerCase().trim();
  const role = (emp.role || '').toLowerCase().trim();

  // Superadmin check
  if (loginRole.includes('super') || role.includes('super')) {
    return 'Superadmin';
  }

  // Kepala Satker check
  if (
    loginRole.includes('kepala satker') || 
    jabatan.includes('kepala satker') ||
    loginRole === 'kepala' || 
    jabatan === 'kepala' || 
    role === 'kepala'
  ) {
    return 'Kepala';
  }

  // Admin Bidang or Ketua Bidang check
  if (
    loginRole.includes('admin') || 
    loginRole.includes('ketua') || 
    jabatan.includes('admin') || 
    jabatan.includes('ketua') || 
    role.includes('ketua')
  ) {
    return 'Ketua Bidang';
  }

  return 'Staff';
}

export function isTataUsahaDivision(division?: string | null): boolean {
  if (!division) return false;
  const d = division.toLowerCase().trim();
  return d.includes('tata usaha') || d.includes('tu') || d === 'umum' || d.includes('tu / umum');
}

/**
 * Resolves precise granular role for kepegawaian permission matrix:
 * 1. 'Superadmin': akses penuh seluruh modul kepegawaian, penambahan, pengeditan, penghapusan, 40 JP
 * 2. 'Kepala Satker': melihat rekapitulasi kepegawaian dan statistik kepatuhan 40 jam pelatihan SDM (read-only)
 * 3. 'Admin Bidang': jika bidang Tata Usaha -> akses rekapitulasi, pengaturan pegawai (tambah, edit, hapus), dan 40 JP
 * 4. 'Kepala Bidang': melihat statistik kepatuhan 40 jam pelatihan SDM, melihat & mengedit pegawai bidangnya (tanpa hapus). Jika Bidang TU, juga dapat melihat rekapitulasi kepegawaian
 * 5. 'Staff':
 *    - Jika Bidang Tata Usaha: dapat melihat Rekapitulasi Kepegawaian (read-only), namun tidak dapat melihat menu statistik 40 JP atau pengaturan database pegawai
 *    - Jika Bidang Lain (Non-TU): hanya dapat melihat profil pegawai sendiri ('Profil Pegawai Saya')
 */
export function resolveKepegawaianRole(
  currentUser?: { role?: string; loginRole?: string; id?: string; division?: string } | null,
  employeeRecord?: Partial<Employee> | null
): ResolvedRole {
  if (!currentUser && !employeeRecord) return 'Staff';

  const loginRole = (currentUser?.loginRole || employeeRecord?.loginRole || '').toLowerCase().trim();
  const jabatan = (employeeRecord?.jabatan || '').toLowerCase().trim();
  const appRole = (currentUser?.role || employeeRecord?.role || '').toLowerCase().trim();

  if (loginRole.includes('super') || appRole.includes('super') || currentUser?.id === '1871102702910001' || currentUser?.id === 'superadmin') {
    return 'Superadmin';
  }

  if (
    loginRole.includes('kepala satker') || 
    jabatan.includes('kepala satker') || 
    appRole === 'kepala'
  ) {
    return 'Kepala Satker';
  }

  if (
    loginRole.includes('ketua') || 
    loginRole.includes('kepala bidang') || 
    jabatan.includes('ketua') || 
    jabatan.includes('kabid') || 
    appRole === 'ketua bidang'
  ) {
    return 'Kepala Bidang';
  }

  if (loginRole.includes('admin') || jabatan.includes('admin')) {
    return 'Admin Bidang';
  }

  return 'Staff';
}

export interface KepegawaianPermissions {
  resolvedRole: ResolvedRole;
  isTataUsaha: boolean;
  canViewRekapitulasi: boolean; // Akses menu Rekapitulasi Kepegawaian & Kinerja SDM
  canViewPengaturanTab: boolean; // Akses tab Pengaturan/Database Pegawai
  canViewMatriksTab: boolean;    // Akses menu/tab Statistik Kepatuhan Pelatihan 40 Jam SDM
  canViewAllEmployees: boolean;  // false untuk Staff Non-TU (hanya profil sendiri)
  canAddEmployee: boolean;       // Admin Bidang TU & Superadmin
  canEditEmployee: boolean;      // Admin Bidang TU, Superadmin, & Ketua Bidang
  canDeleteEmployee: boolean;    // Admin Bidang TU & Superadmin
  canDeleteTraining: boolean;    // Admin Bidang TU & Superadmin
  canDeleteCompetency: boolean;  // Admin Bidang TU & Superadmin
  canDeleteEducation: boolean;   // Admin Bidang TU & Superadmin
  canViewProfile: boolean;       // Semua role
}

export function getKepegawaianPermissions(
  currentUser?: { role?: string; loginRole?: string; id?: string; division?: string } | null,
  employeeRecord?: Partial<Employee> | null
): KepegawaianPermissions {
  const role = resolveKepegawaianRole(currentUser, employeeRecord);
  const division = currentUser?.division || employeeRecord?.divisi || '';
  const isTU = isTataUsahaDivision(division);

  switch (role) {
    case 'Kepala Satker':
      return {
        resolvedRole: 'Kepala Satker',
        isTataUsaha: isTU,
        // Kasatker dapat melihat Rekapitulasi Kepegawaian & Statistik Kepatuhan 40 Jam SDM
        canViewRekapitulasi: true,
        canViewPengaturanTab: false,
        canViewMatriksTab: true, // Hak akses statistik kepatuhan 40 jam pelatihan SDM
        canViewAllEmployees: true,
        canAddEmployee: false,
        canEditEmployee: false,
        canDeleteEmployee: false,
        canDeleteTraining: false,
        canDeleteCompetency: false,
        canDeleteEducation: false,
        canViewProfile: true, // Read-only view in drawer
      };

    case 'Superadmin':
      return {
        resolvedRole: 'Superadmin',
        isTataUsaha: isTU,
        canViewRekapitulasi: true,
        canViewPengaturanTab: true,
        canViewMatriksTab: true,
        canViewAllEmployees: true,
        canAddEmployee: true,
        canEditEmployee: true,
        canDeleteEmployee: true,
        canDeleteTraining: true,
        canDeleteCompetency: true,
        canDeleteEducation: true,
        canViewProfile: true,
      };

    case 'Admin Bidang':
      if (isTU) {
        // Admin Bidang Tata Usaha: Akses penuh Rekapitulasi, Pengaturan, & 40 JP
        return {
          resolvedRole: 'Admin Bidang',
          isTataUsaha: true,
          canViewRekapitulasi: true,
          canViewPengaturanTab: true,
          canViewMatriksTab: true, // Admin Bidang TU dapat melihat statistik 40 jam
          canViewAllEmployees: true,
          canAddEmployee: true,
          canEditEmployee: true,
          canDeleteEmployee: true,
          canDeleteTraining: true,
          canDeleteCompetency: true,
          canDeleteEducation: true,
          canViewProfile: true,
        };
      } else {
        // Admin Bidang Non-TU: Hanya lihat pegawai bidang sendiri, tanpa fitur edit/tambah
        return {
          resolvedRole: 'Admin Bidang',
          isTataUsaha: false,
          canViewRekapitulasi: false,
          canViewPengaturanTab: true,
          canViewMatriksTab: false, // Hanya admin TU, kasatker, superadmin, ketua bidang
          canViewAllEmployees: false, // Hanya tampilkan pegawai bidang sendiri
          canAddEmployee: false,
          canEditEmployee: false, // Tanpa fitur edit jika bukan bagian dari bidang tata usaha
          canDeleteEmployee: false,
          canDeleteTraining: false,
          canDeleteCompetency: false,
          canDeleteEducation: false,
          canViewProfile: true,
        };
      }

    case 'Kepala Bidang':
      if (isTU) {
        return {
          resolvedRole: 'Kepala Bidang',
          isTataUsaha: true,
          canViewRekapitulasi: true,
          canViewPengaturanTab: true,
          canViewMatriksTab: true,
          canViewAllEmployees: true,
          canAddEmployee: false,
          canEditEmployee: true,
          canDeleteEmployee: false,
          canDeleteTraining: false,
          canDeleteCompetency: false,
          canDeleteEducation: false,
          canViewProfile: true,
        };
      } else {
        // Ketua Bidang Non-TU: Hanya lihat pegawai bidang sendiri, tanpa fitur edit/tambah
        return {
          resolvedRole: 'Kepala Bidang',
          isTataUsaha: false,
          canViewRekapitulasi: false,
          canViewPengaturanTab: true,
          canViewMatriksTab: true, // Seluruh Ketua Bidang berhak melihat statistik kepatuhan 40 JP
          canViewAllEmployees: false, // Hanya tampilkan pegawai bidang sendiri
          canAddEmployee: false,
          canEditEmployee: false, // Tanpa fitur edit jika bukan bagian dari bidang tata usaha
          canDeleteEmployee: false,
          canDeleteTraining: false,
          canDeleteCompetency: false,
          canDeleteEducation: false,
          canViewProfile: true,
        };
      }

    case 'Staff':
    default:
      if (isTU) {
        // Staff Tata Usaha: Dapat melihat Rekapitulasi Kepegawaian (read-only), namun tidak dapat melihat menu statistik 40 JP
        return {
          resolvedRole: 'Staff',
          isTataUsaha: true,
          canViewRekapitulasi: true, // Staff TU memiliki akses rekapitulasi kepegawaian
          canViewPengaturanTab: false,
          canViewMatriksTab: false, // Staff biasa TIDAK bisa melihat menu statistik kepatuhan 40 jam
          canViewAllEmployees: true,
          canAddEmployee: false,
          canEditEmployee: false,
          canDeleteEmployee: false,
          canDeleteTraining: false,
          canDeleteCompetency: false,
          canDeleteEducation: false,
          canViewProfile: true,
        };
      } else {
        // Staff Non-TU: Tidak memiliki akses ke Rekapitulasi Kepegawaian maupun Statistik 40 JP (hanya Profil Saya)
        return {
          resolvedRole: 'Staff',
          isTataUsaha: false,
          canViewRekapitulasi: false, // Staff lain tidak diberikan akses rekapitulasi
          canViewPengaturanTab: false,
          canViewMatriksTab: false, // Staff biasa TIDAK bisa melihat menu statistik kepatuhan 40 jam
          canViewAllEmployees: false, // Hanya profil sendiri
          canAddEmployee: false,
          canEditEmployee: false,
          canDeleteEmployee: false,
          canDeleteTraining: false,
          canDeleteCompetency: false,
          canDeleteEducation: false,
          canViewProfile: true,
        };
      }
  }
}

/**
 * Normalizes credentials input (username, NIP, NIK, or email)
 */
export function normalizeCredential(input?: string | null): string {
  if (!input) return '';
  return input.trim().toLowerCase().replace(/[\s.-]/g, '');
}

/**
 * Extracts clean uppercase 2-letter initials from employee / user name
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'PG';
  // Remove academic / formal titles prefixes and suffixes if any
  const cleaned = name
    .replace(/\b(Drs\.|Dr\.|Dra\.|Ir\.|H\.|Hj\.|Prof\.|S\.Kom|M\.Kom|S\.T|M\.T|S\.E|M\.M|S\.Sos|M\.Si|S\.I\.Kom|A\.Md|M\.P|S\.Pd|M\.Pd)\b/gi, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    const rawParts = name.trim().split(/\s+/).filter(Boolean);
    if (rawParts.length === 0) return 'PG';
    if (rawParts.length === 1) return rawParts[0].slice(0, 2).toUpperCase();
    return (rawParts[0][0] + rawParts[rawParts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a consistent stylish color palette class based on a string name
 */
export function getAvatarColor(name?: string | null): { bg: string; text: string; border: string } {
  const palettes = [
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  ];
  if (!name) return palettes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

