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

/**
 * Resolves precise granular role for kepegawaian permission matrix:
 * 1. 'Kepala Satker': dapat melihat rekapitulasi kepegawaian saja
 * 2. 'Kepala Bidang': dapat melihat menu rekapitulasi kepegawaian, mengedit pengaturan pegawai, melihat profil pegawai, tidak dapat menghapus pegawai, pelatihan, kompetensi
 * 3. 'Admin Bidang' / 'Superadmin': dapat melihat menu rekapitulasi kepegawaian, mengedit pengaturan pegawai, menghapus, mengedit dan menambah
 * 4. 'Staff': dapat melihat profil sendiri / data sendiri
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

  if (loginRole.includes('admin') || jabatan.includes('admin')) {
    return 'Admin Bidang';
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

  return 'Staff';
}

export interface KepegawaianPermissions {
  resolvedRole: ResolvedRole;
  canViewRekapitulasi: boolean;
  canViewPengaturanTab: boolean;
  canViewMatriksTab: boolean;
  canViewAllEmployees: boolean; // false for Staff (only own profile)
  canAddEmployee: boolean;      // Admin Bidang & Superadmin only
  canEditEmployee: boolean;     // Kepala Bidang, Admin Bidang & Superadmin
  canDeleteEmployee: boolean;   // Admin Bidang & Superadmin only (Kepala Bidang cannot delete)
  canDeleteTraining: boolean;   // Admin Bidang & Superadmin only (Kepala Bidang cannot delete)
  canDeleteCompetency: boolean; // Admin Bidang & Superadmin only (Kepala Bidang cannot delete)
  canDeleteEducation: boolean;  // Admin Bidang & Superadmin only (Kepala Bidang cannot delete)
  canViewProfile: boolean;      // All roles
}

export function getKepegawaianPermissions(
  currentUser?: { role?: string; loginRole?: string; id?: string; division?: string } | null,
  employeeRecord?: Partial<Employee> | null
): KepegawaianPermissions {
  const role = resolveKepegawaianRole(currentUser, employeeRecord);

  switch (role) {
    case 'Kepala Satker':
      return {
        resolvedRole: 'Kepala Satker',
        canViewRekapitulasi: true,
        canViewPengaturanTab: false,
        canViewMatriksTab: false,
        canViewAllEmployees: true,
        canAddEmployee: false,
        canEditEmployee: false,
        canDeleteEmployee: false,
        canDeleteTraining: false,
        canDeleteCompetency: false,
        canDeleteEducation: false,
        canViewProfile: true, // Read-only view in drawer
      };

    case 'Kepala Bidang':
      return {
        resolvedRole: 'Kepala Bidang',
        canViewRekapitulasi: true,
        canViewPengaturanTab: true,
        canViewMatriksTab: true,
        canViewAllEmployees: true,
        canAddEmployee: false, // Only edit existing
        canEditEmployee: true,
        canDeleteEmployee: false,   // Strictly forbidden to delete
        canDeleteTraining: false,   // Strictly forbidden to delete
        canDeleteCompetency: false, // Strictly forbidden to delete
        canDeleteEducation: false,  // Strictly forbidden to delete
        canViewProfile: true,
      };

    case 'Admin Bidang':
    case 'Superadmin':
      return {
        resolvedRole: role,
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

    case 'Staff':
    default:
      return {
        resolvedRole: 'Staff',
        canViewRekapitulasi: false,
        canViewPengaturanTab: false,
        canViewMatriksTab: false,
        canViewAllEmployees: false, // Only sees self
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

/**
 * Normalizes credentials input (username, NIP, NIK, or email)
 */
export function normalizeCredential(input?: string | null): string {
  if (!input) return '';
  return input.trim().toLowerCase().replace(/[\s.-]/g, '');
}

