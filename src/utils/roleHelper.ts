import { Employee } from '../types';

/**
 * Standardizes mapping from employee data to application user role.
 * Role hierarchy:
 * - 'Superadmin': loginRole === 'Super Admin' or role === 'Superadmin'
 * - 'Kepala': loginRole === 'Kepala Satker' or jabatan === 'kepala satker' or role === 'Kepala'
 * - 'Ketua Bidang': loginRole in ('Ketua Tim', 'Admin Tim') or jabatan in ('ketua bidang', 'admin bidang') or role === 'Ketua Bidang'
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
    loginRole.includes('kepala') || 
    jabatan.includes('kepala') || 
    role === 'kepala'
  ) {
    return 'Kepala';
  }

  // Ketua Bidang / Admin Tim check
  if (
    loginRole.includes('ketua') || 
    loginRole.includes('admin') || 
    jabatan.includes('ketua') || 
    jabatan.includes('admin') || 
    role.includes('ketua')
  ) {
    return 'Ketua Bidang';
  }

  return 'Staff';
}

/**
 * Normalizes credentials input (username, NIP, NIK, or email)
 */
export function normalizeCredential(input?: string | null): string {
  if (!input) return '';
  return input.trim().toLowerCase().replace(/[\s.-]/g, '');
}
