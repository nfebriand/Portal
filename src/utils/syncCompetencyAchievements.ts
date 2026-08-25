import { Employee, PerformanceAgreement, PerformanceIndicator } from '../types';
import { computeEmployeeAnnualTrainings } from '../components/kepegawaian/PelatihanTahunanTracker';

/**
 * Checks if a given indicator corresponds to "Pengembangan Kompetensi Pegawai" / "Pelatihan 40 Jam"
 */
export function isCompetencyIndicator(indicator?: { indicatorName?: string; id?: string; unit?: string }): boolean {
  if (!indicator) return false;
  if (indicator.id === 'ind-tu-kompetensi') return true;
  
  const nameLower = (indicator.indicatorName || '').toLowerCase();
  
  return (
    nameLower.includes('pengembangan kompetensi') ||
    nameLower.includes('kompetensi pegawai') ||
    (nameLower.includes('pelatihan') && nameLower.includes('pegawai')) ||
    (nameLower.includes('kepatuhan') && nameLower.includes('pelatihan')) ||
    (nameLower.includes('40 jam') && nameLower.includes('pelatihan')) ||
    nameLower.includes('persentase pelaksanaan pengembangan kompetensi')
  );
}

export interface CompetencyComplianceResult {
  monthlyPercentages: number[]; // 12 values: [Jan, Feb, ..., Des]
  monthlyCounts: number[]; // 12 values: count of compliant employees up to month m
  totalEmployees: number;
  totalCompliant: number;
  finalPercentage: number;
  milestones: {
    employeeId: string;
    employeeName: string;
    division: string;
    tanggalTercapai40Jam: string;
    pelatihanTercapai40Jam: string;
    monthIndex: number;
    totalHours: number;
  }[];
}

/**
 * Calculates month-by-month cumulative compliance percentage of employees reaching 40 JP training hours.
 */
export function calculateMonthlyCompetencyCompliance(
  employees: Employee[],
  year: number = new Date().getFullYear()
): CompetencyComplianceResult {
  const totalEmployees = employees.length;

  if (totalEmployees === 0) {
    return {
      monthlyPercentages: new Array(12).fill(0),
      monthlyCounts: new Array(12).fill(0),
      totalEmployees: 0,
      totalCompliant: 0,
      finalPercentage: 0,
      milestones: []
    };
  }

  const milestones: CompetencyComplianceResult['milestones'] = [];

  employees.forEach(emp => {
    const annualMap = computeEmployeeAnnualTrainings(emp);
    const summary = annualMap[year];

    if (summary && summary.isCompliant && summary.tanggalTercapai40Jam) {
      let mIdx = 0;
      try {
        const d = new Date(summary.tanggalTercapai40Jam);
        if (!isNaN(d.getTime())) {
          mIdx = Math.max(0, Math.min(11, d.getMonth()));
        }
      } catch {
        mIdx = 0;
      }

      milestones.push({
        employeeId: emp.id,
        employeeName: emp.nama,
        division: emp.divisi || 'Tata Usaha / Umum',
        tanggalTercapai40Jam: summary.tanggalTercapai40Jam,
        pelatihanTercapai40Jam: summary.pelatihanTercapai40Jam || '-',
        monthIndex: mIdx,
        totalHours: summary.totalHours
      });
    }
  });

  // Sort milestones chronologically
  milestones.sort((a, b) => a.tanggalTercapai40Jam.localeCompare(b.tanggalTercapai40Jam));

  const monthlyCounts = new Array(12).fill(0);
  const monthlyPercentages = new Array(12).fill(0);

  for (let m = 0; m < 12; m++) {
    // Count how many distinct employees reached 40 JP at or before month m
    const count = milestones.filter(item => item.monthIndex <= m).length;
    monthlyCounts[m] = count;
    monthlyPercentages[m] = Math.round((count / totalEmployees) * 100);
  }

  const totalCompliant = milestones.length;
  const finalPercentage = totalEmployees > 0 ? Math.round((totalCompliant / totalEmployees) * 100) : 0;

  return {
    monthlyPercentages,
    monthlyCounts,
    totalEmployees,
    totalCompliant,
    finalPercentage,
    milestones
  };
}

/**
 * Synchronizes calculated competency monthly percentages into all matching performance agreement objectives.
 */
export function syncCompetencyAchievements(
  employees: Employee[],
  agreements: PerformanceAgreement[],
  year: number = new Date().getFullYear()
): PerformanceAgreement[] {
  const result = calculateMonthlyCompetencyCompliance(employees, year);
  const updatedAgreements: PerformanceAgreement[] = JSON.parse(JSON.stringify(agreements));

  updatedAgreements.forEach(ag => {
    ag.objectives = ag.objectives.map(obj => {
      if (isCompetencyIndicator(obj)) {
        return {
          ...obj,
          unit: '%',
          target: obj.target || '100',
          trajectoryType: 'constant',
          monthlyAchievements: [...result.monthlyPercentages],
          achievement: result.finalPercentage
        };
      }
      return obj;
    });
  });

  return updatedAgreements;
}
