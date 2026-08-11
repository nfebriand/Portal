import { NewsReport, PerformanceAgreement, ReporterTarget, Employee } from '../types';
import { parseFlexibleDate } from './dateUtils';

/**
 * Parses the month index (0 = Jan, 11 = Dec) from a news report date or publishDateTime.
 */
export function getReportMonthIndex(rep: NewsReport): number {
  // Try publishDateTime first as it often contains the raw import date string or serial
  if (rep.publishDateTime) {
    const parsedPub = parseFlexibleDate(rep.publishDateTime);
    if (parsedPub.isValid) {
      return parsedPub.monthIndex;
    }
  }

  if (rep.date) {
    const parsedDate = parseFlexibleDate(rep.date);
    if (parsedDate.isValid) {
      return parsedDate.monthIndex;
    }
  }

  return new Date().getMonth();
}

/**
 * Normalizes report type string into standardized category.
 */
export function getReportTypeCategory(typeStr?: string): 'online' | 'lpu' | 'radio' | 'siaran' | 'total' {
  if (!typeStr) return 'online';
  const t = typeStr.toLowerCase();
  if (t.includes('lpu') || t.includes('ringan')) return 'lpu';
  if (t.includes('radio')) return 'radio';
  if (t.includes('siaran') || t.includes('konten siaran')) return 'siaran';
  if (t.includes('online') || t.includes('kbrn') || t.includes('media baru') || t.includes('medsos')) return 'online';
  return 'online';
}

/**
 * Syncs news reports counts into monthly PK achievements for Level 3 (Pegawai),
 * Level 2 (Ketua Tim / Kabid), and Level 1 (Kepala Stasiun).
 */
export function syncNewsAchievements(
  allNewsReports: NewsReport[],
  agreements: PerformanceAgreement[],
  reporterTargets: ReporterTarget[] = [],
  employees: Employee[] = [],
  targetLevel?: string
): PerformanceAgreement[] {
  // 1. Station-wide monthly totals per type (12 months)
  const stationTypeMonthlyCounts = {
    online: new Array(12).fill(0),
    lpu: new Array(12).fill(0),
    radio: new Array(12).fill(0),
    siaran: new Array(12).fill(0),
    total: new Array(12).fill(0),
  };

  // 2. Per-employee monthly totals per type (12 months)
  const empTypeMonthlyCounts: Record<string, {
    online: number[];
    lpu: number[];
    radio: number[];
    siaran: number[];
    total: number[];
  }> = {};

  employees.forEach(emp => {
    empTypeMonthlyCounts[emp.id] = {
      online: new Array(12).fill(0),
      lpu: new Array(12).fill(0),
      radio: new Array(12).fill(0),
      siaran: new Array(12).fill(0),
      total: new Array(12).fill(0),
    };
  });

  // Populate counts from allNewsReports
  allNewsReports.forEach(rep => {
    const mIndex = getReportMonthIndex(rep);
    if (mIndex < 0 || mIndex > 11) return;

    const cat = getReportTypeCategory(rep.type);

    // Update station-wide
    stationTypeMonthlyCounts[cat][mIndex] += 1;
    stationTypeMonthlyCounts.total[mIndex] += 1;

    // Update per-employee
    let empId = rep.employeeId;

    // Fuzzy fallback matching by reporter/writer name if employeeId missing
    if (!empId && (rep.reporterName || rep.writerName)) {
      const repName = (rep.reporterName || rep.writerName || '').toLowerCase().trim();
      const matchedEmp = employees.find(e => {
        const eName = e.nama.toLowerCase().trim();
        return eName === repName || eName.includes(repName) || repName.includes(eName);
      });
      if (matchedEmp) empId = matchedEmp.id;
    }

    if (empId) {
      if (!empTypeMonthlyCounts[empId]) {
        empTypeMonthlyCounts[empId] = {
          online: new Array(12).fill(0),
          lpu: new Array(12).fill(0),
          radio: new Array(12).fill(0),
          siaran: new Array(12).fill(0),
          total: new Array(12).fill(0),
        };
      }
      empTypeMonthlyCounts[empId][cat][mIndex] += 1;
      empTypeMonthlyCounts[empId].total[mIndex] += 1;
    }
  });

  // Deep clone agreements
  const updatedAgreements: PerformanceAgreement[] = JSON.parse(JSON.stringify(agreements));

  // Map objective ID to object for lookup
  const objMap: Record<string, any> = {};

  // Pass 1: Update Level 3 (Pegawai) objectives
  updatedAgreements.forEach(ag => {
    if (ag.level === 'Pegawai') {
      let empId = ag.assignedToEmployeeId;
      if (!empId && ag.assignedToName) {
        const nameLower = ag.assignedToName.toLowerCase().trim();
        const found = employees.find(e => {
          const eName = e.nama.toLowerCase().trim();
          return eName === nameLower || eName.includes(nameLower) || nameLower.includes(eName);
        });
        if (found) empId = found.id;
      }

      const empCounts = empId ? empTypeMonthlyCounts[empId] : null;

      ag.objectives.forEach(obj => {
        objMap[obj.id] = obj;

        const nameLower = (obj.indicatorName || '').toLowerCase();
        const unitLower = (obj.unit || '').toLowerCase();

        // Match reporter target if explicitly linked
        const target = reporterTargets.find(t => (t.employeeId === empId || !t.employeeId) && t.linkedIndicatorId === obj.id);

        let cat: 'online' | 'lpu' | 'radio' | 'siaran' | 'total' | null = null;

        if (target?.mediaType) {
          cat = getReportTypeCategory(target.mediaType);
        } else if (nameLower.includes('ringan') || nameLower.includes('lpu')) {
          cat = 'lpu';
        } else if (nameLower.includes('radio')) {
          cat = 'radio';
        } else if (nameLower.includes('konten siaran') || (nameLower.includes('siaran') && !nameLower.includes('radio'))) {
          cat = 'siaran';
        } else if (nameLower.includes('online') || nameLower.includes('kbrn') || nameLower.includes('media baru') || nameLower.includes('medsos') || nameLower.includes('harian') || nameLower.includes('publikasi')) {
          cat = 'online';
        } else if (nameLower.includes('berita') || nameLower.includes('konten') || nameLower.includes('rilis') || unitLower.includes('berita')) {
          cat = 'total';
        }

        if (cat) {
          // If employee specific counts exist, use them. Otherwise fallback to station totals
          const counts = (empCounts && empCounts[cat] && empCounts[cat].reduce((a, b) => a + b, 0) > 0)
            ? empCounts[cat]
            : (stationTypeMonthlyCounts[cat] || new Array(12).fill(0));
          
          obj.monthlyAchievements = [...counts];
          obj.achievement = counts.reduce((sum, val) => sum + val, 0);
          objMap[obj.id] = obj;
        }
      });
    } else {
      ag.objectives.forEach(obj => {
        objMap[obj.id] = obj;
      });
    }
  });

  // Helper to determine news category for Level 1 or Level 2 objectives
  const getObjectiveCategory = (name: string, unit: string): 'online' | 'lpu' | 'radio' | 'siaran' | 'total' | null => {
    const nameLower = name.toLowerCase();
    const unitLower = unit.toLowerCase();
    if (nameLower.includes('ringan') || nameLower.includes('lpu')) return 'lpu';
    if (nameLower.includes('radio')) return 'radio';
    if (nameLower.includes('konten siaran') || (nameLower.includes('siaran') && !nameLower.includes('radio') && !nameLower.includes('pemilu'))) return 'siaran';
    if (nameLower.includes('online') || nameLower.includes('kbrn') || nameLower.includes('media baru') || nameLower.includes('medsos')) return 'online';
    if (nameLower.includes('berita') || nameLower.includes('konten') || nameLower.includes('rilis') || unitLower.includes('berita')) return 'total';
    return null;
  };

  // Pass 2: Rollup Level 2 (Ketua Tim / Kabid) from Level 3 or Station Totals
  updatedAgreements.forEach(ag => {
    if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
      ag.objectives.forEach(l2Obj => {
        const l3Children = Object.values(objMap).filter(o => o.parentIndicatorId === l2Obj.id);

        if (l3Children.length > 0) {
          const isConstantType = l2Obj.unit === '%' || l2Obj.unit === 'Skor' || l2Obj.unit === 'Nilai' || (l2Obj.indicatorName || '').toLowerCase().includes('ikpa') || l2Obj.trajectoryType === 'constant';
          const rolledUpMonthly = new Array(12).fill(0);

          for (let idx = 0; idx < 12; idx++) {
            let sumMonth = 0;
            l3Children.forEach(child => {
              sumMonth += child.monthlyAchievements?.[idx] || 0;
            });
            rolledUpMonthly[idx] = isConstantType ? Math.round((sumMonth / l3Children.length) * 10) / 10 : sumMonth;
          }

          l2Obj.monthlyAchievements = rolledUpMonthly;
          const totalVal = rolledUpMonthly.reduce((s, v) => s + v, 0);
          l2Obj.achievement = isConstantType ? Math.round((totalVal / 12) * 10) / 10 : Math.round(totalVal * 10) / 10;
        } else {
          // Direct calculation from station news reports if no child achievements exist
          const cat = getObjectiveCategory(l2Obj.indicatorName || '', l2Obj.unit || '');
          if (cat && allNewsReports.length > 0) {
            const counts = stationTypeMonthlyCounts[cat] || new Array(12).fill(0);
            l2Obj.monthlyAchievements = [...counts];
            l2Obj.achievement = counts.reduce((s, v) => s + v, 0);
          } else if (Array.isArray(l2Obj.monthlyAchievements) && l2Obj.monthlyAchievements.length === 12) {
            const isConstantType = l2Obj.unit === '%' || l2Obj.unit === 'Skor' || l2Obj.unit === 'Nilai' || (l2Obj.indicatorName || '').toLowerCase().includes('ikpa') || l2Obj.trajectoryType === 'constant';
            const totalVal = l2Obj.monthlyAchievements.reduce((s, v) => s + v, 0);
            l2Obj.achievement = isConstantType ? Math.round((totalVal / 12) * 10) / 10 : Math.round(totalVal * 10) / 10;
          }
        }

        // Keep objMap updated so Pass 3 (Level 1) can read updated Level 2 children!
        objMap[l2Obj.id] = l2Obj;
      });
    }
  });

  // Pass 3: Rollup Level 1 (Kepala Stasiun) from Level 2 or Station Totals
  updatedAgreements.forEach(ag => {
    if (ag.level === 'Kepala Stasiun') {
      ag.objectives.forEach(l1Obj => {
        const l2Children = Object.values(objMap).filter(o => o.parentIndicatorId === l1Obj.id);

        if (l2Children.length > 0) {
          const isConstantType = l1Obj.unit === '%' || l1Obj.unit === 'Skor' || l1Obj.unit === 'Nilai' || (l1Obj.indicatorName || '').toLowerCase().includes('ikpa') || l1Obj.trajectoryType === 'constant';
          const rolledUpMonthly = new Array(12).fill(0);

          for (let idx = 0; idx < 12; idx++) {
            let sumMonth = 0;
            l2Children.forEach(child => {
              sumMonth += child.monthlyAchievements?.[idx] || 0;
            });
            rolledUpMonthly[idx] = isConstantType ? Math.round((sumMonth / l2Children.length) * 10) / 10 : sumMonth;
          }

          l1Obj.monthlyAchievements = rolledUpMonthly;
          const totalVal = rolledUpMonthly.reduce((s, v) => s + v, 0);
          l1Obj.achievement = isConstantType ? Math.round((totalVal / 12) * 10) / 10 : Math.round(totalVal * 10) / 10;
        } else {
          // Direct calculation from station news reports if no child achievements exist
          const cat = getObjectiveCategory(l1Obj.indicatorName || '', l1Obj.unit || '');
          if (cat && allNewsReports.length > 0) {
            const counts = stationTypeMonthlyCounts[cat] || new Array(12).fill(0);
            l1Obj.monthlyAchievements = [...counts];
            l1Obj.achievement = counts.reduce((s, v) => s + v, 0);
          } else if (Array.isArray(l1Obj.monthlyAchievements) && l1Obj.monthlyAchievements.length === 12) {
            const isConstantType = l1Obj.unit === '%' || l1Obj.unit === 'Skor' || l1Obj.unit === 'Nilai' || (l1Obj.indicatorName || '').toLowerCase().includes('ikpa') || l1Obj.trajectoryType === 'constant';
            const totalVal = l1Obj.monthlyAchievements.reduce((s, v) => s + v, 0);
            l1Obj.achievement = isConstantType ? Math.round((totalVal / 12) * 10) / 10 : Math.round(totalVal * 10) / 10;
          }
        }

        // Keep objMap updated
        objMap[l1Obj.id] = l1Obj;
      });
    }
  });

  return updatedAgreements;
}
