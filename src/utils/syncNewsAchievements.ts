import { NewsReport, PerformanceAgreement, ReporterTarget, Employee } from '../types';

/**
 * Syncs news reports counts into monthly PK achievements for Level 3 (Pegawai) indicators,
 * and automatically rolls them up to Level 2 (Ketua Tim / Kabid) and Level 1 (Kepala Stasiun).
 */
export function syncNewsAchievements(
  allNewsReports: NewsReport[],
  agreements: PerformanceAgreement[],
  reporterTargets: ReporterTarget[],
  employees: Employee[]
): PerformanceAgreement[] {
  // 1. Accumulate counts per employee and month (0..11)
  const empMonthlyCounts: Record<string, number[]> = {};
  const empTypeMonthlyCounts: Record<string, Record<string, number[]>> = {};

  employees.forEach(emp => {
    empMonthlyCounts[emp.id] = new Array(12).fill(0);
    empTypeMonthlyCounts[emp.id] = {
      'Berita Online': new Array(12).fill(0),
      'Berita Ringan LPU': new Array(12).fill(0),
      'Berita Ringan': new Array(12).fill(0),
      'Berita Radio': new Array(12).fill(0),
      'Konten Siaran': new Array(12).fill(0)
    };
  });

  allNewsReports.forEach(rep => {
    if (!rep.employeeId) return;
    let mIndex = -1;
    if (rep.date) {
      const d = new Date(rep.date);
      if (!isNaN(d.getTime())) mIndex = d.getMonth();
    } else if (rep.publishDateTime) {
      const d = new Date(rep.publishDateTime);
      if (!isNaN(d.getTime())) mIndex = d.getMonth();
    }

    if (mIndex < 0 || mIndex > 11) {
      mIndex = new Date().getMonth();
    }

    const empId = rep.employeeId;
    if (!empMonthlyCounts[empId]) {
      empMonthlyCounts[empId] = new Array(12).fill(0);
    }
    empMonthlyCounts[empId][mIndex] += 1;

    if (!empTypeMonthlyCounts[empId]) {
      empTypeMonthlyCounts[empId] = {
        'Berita Online': new Array(12).fill(0),
        'Berita Ringan LPU': new Array(12).fill(0),
        'Berita Ringan': new Array(12).fill(0),
        'Berita Radio': new Array(12).fill(0),
        'Konten Siaran': new Array(12).fill(0)
      };
    }

    const typeKey = rep.type || 'Berita Online';
    if (!empTypeMonthlyCounts[empId][typeKey]) {
      empTypeMonthlyCounts[empId][typeKey] = new Array(12).fill(0);
    }
    empTypeMonthlyCounts[empId][typeKey][mIndex] += 1;
  });

  // 2. Clone agreements to make updates
  const updatedAgreements: PerformanceAgreement[] = JSON.parse(JSON.stringify(agreements));

  // Map of objective ID to objective object for fast lookup during cascading rollup
  const objMap: Record<string, any> = {};

  // First pass: Update Level 3 (Pegawai) objectives
  updatedAgreements.forEach(ag => {
    if (ag.level === 'Pegawai' && ag.assignedToEmployeeId) {
      const empId = ag.assignedToEmployeeId;
      const target = reporterTargets.find(t => t.employeeId === empId);
      const linkedId = target?.linkedIndicatorId;

      ag.objectives.forEach(obj => {
        objMap[obj.id] = obj;

        const isLinked = linkedId && obj.id === linkedId;
        const nameLower = (obj.indicatorName || '').toLowerCase();
        const unitLower = (obj.unit || '').toLowerCase();
        const isNewsIndicator = isLinked || 
          nameLower.includes('berita') || 
          nameLower.includes('konten') || 
          nameLower.includes('rilis') || 
          nameLower.includes('siaran') ||
          unitLower.includes('berita') ||
          unitLower.includes('konten') ||
          unitLower.includes('rilis');

        if (isNewsIndicator) {
          let counts = empMonthlyCounts[empId] || new Array(12).fill(0);
          if (target?.mediaType && empTypeMonthlyCounts[empId]?.[target.mediaType]) {
            counts = empTypeMonthlyCounts[empId][target.mediaType];
          }

          obj.monthlyAchievements = [...counts];
          obj.achievement = counts.reduce((sum, val) => sum + val, 0);
        }
      });
    } else {
      ag.objectives.forEach(obj => {
        objMap[obj.id] = obj;
      });
    }
  });

  // Second pass: Rollup Level 2 (Ketua Tim / Kabid) from Level 3
  updatedAgreements.forEach(ag => {
    if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
      ag.objectives.forEach(l2Obj => {
        const l3Children = Object.values(objMap).filter(o => o.parentIndicatorId === l2Obj.id);
        if (l3Children.length > 0) {
          const rolledUpMonthly = new Array(12).fill(0);
          let totalSum = 0;
          l3Children.forEach(child => {
            if (Array.isArray(child.monthlyAchievements) && child.monthlyAchievements.length === 12) {
              child.monthlyAchievements.forEach((val: number, idx: number) => {
                rolledUpMonthly[idx] += (val || 0);
              });
            } else if (child.achievement) {
              totalSum += child.achievement;
            }
          });
          const monthlySum = rolledUpMonthly.reduce((s, v) => s + v, 0);
          if (monthlySum > 0 || l3Children.some(c => Array.isArray(c.monthlyAchievements))) {
            l2Obj.monthlyAchievements = rolledUpMonthly;
            l2Obj.achievement = monthlySum > 0 ? monthlySum : totalSum;
          }
        }
      });
    }
  });

  // Third pass: Rollup Level 1 (Kepala Stasiun) from Level 2
  updatedAgreements.forEach(ag => {
    if (ag.level === 'Kepala Stasiun') {
      ag.objectives.forEach(l1Obj => {
        const l2Children = Object.values(objMap).filter(o => o.parentIndicatorId === l1Obj.id);
        if (l2Children.length > 0) {
          const rolledUpMonthly = new Array(12).fill(0);
          let totalSum = 0;
          l2Children.forEach(child => {
            if (Array.isArray(child.monthlyAchievements) && child.monthlyAchievements.length === 12) {
              child.monthlyAchievements.forEach((val: number, idx: number) => {
                rolledUpMonthly[idx] += (val || 0);
              });
            } else if (child.achievement) {
              totalSum += child.achievement;
            }
          });
          const monthlySum = rolledUpMonthly.reduce((s, v) => s + v, 0);
          if (monthlySum > 0 || l2Children.some(c => Array.isArray(c.monthlyAchievements))) {
            l1Obj.monthlyAchievements = rolledUpMonthly;
            l1Obj.achievement = monthlySum > 0 ? monthlySum : totalSum;
          }
        }
      });
    }
  });

  return updatedAgreements;
}
