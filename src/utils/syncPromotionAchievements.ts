import { PromotionActivity, PerformanceAgreement, Employee } from '../types';
import { parseFlexibleDate } from './dateUtils';

/**
 * Checks if a given indicator corresponds to "Jumlah Kegiatan Promosi" or promotional activities.
 */
export function isPromotionIndicator(indicatorName?: string): boolean {
  if (!indicatorName) return false;
  const nameLower = indicatorName?.toLowerCase().trim();
  return (
    nameLower.includes('kegiatan promosi') ||
    nameLower.includes('jumlah kegiatan promosi') ||
    nameLower.includes('dokumentasi promosi') ||
    nameLower.includes('promosi siaran') ||
    nameLower.includes('promosi program') ||
    nameLower.includes('promosi media') ||
    nameLower.includes('spot promosi')
  );
}

/**
 * Extracts the 0-indexed month (0 = Jan, 11 = Dec) from a promotion activity date.
 */
export function getPromotionMonthIndex(promo: PromotionActivity): number {
  if (promo.tanggal) {
    const parsed = parseFlexibleDate(promo.tanggal);
    if (parsed.isValid) {
      return parsed.monthIndex;
    }
  }
  if (promo.createdAt) {
    const parsed = parseFlexibleDate(promo.createdAt);
    if (parsed.isValid) {
      return parsed.monthIndex;
    }
  }
  return new Date().getMonth();
}

/**
 * Calculates the total media items (luar ruang + multiplatform) for a single promotion activity.
 */
export function calculateTotalMediaItems(promo: PromotionActivity): number {
  const outdoor = 
    Number(promo.baliho || 0) +
    Number(promo.spanduk || 0) +
    Number(promo.videotron || 0) +
    Number(promo.umbulUmbul || 0) +
    Number(promo.pamflet || 0);

  const multiplatform = 
    Number(promo.yt || 0) +
    Number(promo.ig || 0) +
    Number(promo.tiktok || 0) +
    Number(promo.fb || 0) +
    Number(promo.eFlyer || 0);

  return outdoor + multiplatform;
}

/**
 * Synchronizes promotion activities into monthly achievements for PK indicators:
 * - Counts number of promotion activities per month
 * - Rolls up hierarchically: Pegawai (Level 3) -> Ketua Tim / Kabid (Level 2) -> Kepala Stasiun (Level 1)
 * - Only modifies indicators whose calculationType is 'automatic' or unspecified (not 'manual').
 */
export function syncPromotionAchievements(
  promotions: PromotionActivity[],
  agreements: PerformanceAgreement[],
  employees: Employee[] = []
): PerformanceAgreement[] {
  // 1. Station-wide monthly count of promotion activities (12 months, Jan-Dec)
  const stationMonthlyCounts = new Array(12).fill(0);
  const stationMonthlyMediaSum = new Array(12).fill(0);

  // 2. Division monthly counts
  const divisionMonthlyCounts: Record<string, number[]> = {
    'Tata Usaha / Umum': new Array(12).fill(0),
    'Siaran': new Array(12).fill(0),
    'Pemberitaan': new Array(12).fill(0),
    'Teknologi dan Media Baru': new Array(12).fill(0),
    'Konten Media Baru': new Array(12).fill(0),
    'Layanan Pengembangan Usaha': new Array(12).fill(0),
  };

  // 3. Employee monthly counts
  const empMonthlyCounts: Record<string, number[]> = {};
  employees.forEach(emp => {
    empMonthlyCounts[emp.id] = new Array(12).fill(0);
  });

  // Populate counts from promotion activities
  promotions.forEach(promo => {
    const mIdx = getPromotionMonthIndex(promo);
    if (mIdx < 0 || mIdx > 11) return;

    // Increment station total count
    stationMonthlyCounts[mIdx] += 1;
    stationMonthlyMediaSum[mIdx] += calculateTotalMediaItems(promo);

    // Increment division count if divisi is known
    if (promo.divisi && divisionMonthlyCounts[promo.divisi]) {
      divisionMonthlyCounts[promo.divisi][mIdx] += 1;
    }

    // Increment employee count
    let empId = promo.creatorId;
    if (!empId && promo.creatorName) {
      const cName = (promo.creatorName || "")?.toLowerCase().trim();
      const matched = employees.find(e => {
        const eName = (e.nama || "")?.toLowerCase().trim();
        return eName === cName || eName.includes(cName) || cName.includes(eName);
      });
      if (matched) empId = matched.id;
    }

    if (empId) {
      if (!empMonthlyCounts[empId]) {
        empMonthlyCounts[empId] = new Array(12).fill(0);
      }
      empMonthlyCounts[empId][mIdx] += 1;
    }
  });

  // Clone agreements
  const updatedAgreements: PerformanceAgreement[] = JSON.parse(JSON.stringify(agreements));
  const objMap: Record<string, any> = {};

  // Pass 1: Level 3 (Pegawai)
  updatedAgreements.forEach(ag => {
    if (ag.level === 'Pegawai') {
      let empId = ag.assignedToEmployeeId;
      if (!empId && ag.assignedToName) {
        const nameLower = (ag.assignedToName || "")?.toLowerCase().trim();
        const found = employees.find(e => {
          const eName = (e.nama || "")?.toLowerCase().trim();
          return eName === nameLower || eName.includes(nameLower) || nameLower.includes(eName);
        });
        if (found) empId = found.id;
      }

      ag.objectives.forEach(obj => {
        objMap[obj.id] = obj;

        if (isPromotionIndicator(obj.indicatorName)) {
          // If explicitly set to manual, respect user's manual input
          if (obj.calculationType === 'manual') return;

          // Determine employee's monthly counts
          const monthlyData = (empId && empMonthlyCounts[empId])
            ? [...empMonthlyCounts[empId]]
            : [...stationMonthlyCounts];

          const monthlyArray: number[] = new Array(12).fill(0);
          let totalSum = 0;
          for (let m = 0; m < 12; m++) {
            const count = monthlyData[m] || 0;
            const manualAdd = obj.manualAchievements?.[m] || 0;
            const finalVal = count + manualAdd;
            monthlyArray[m] = finalVal;
            totalSum += finalVal;
          }

          obj.monthlyAchievements = monthlyArray;
          obj.achievement = totalSum;
        }
      });
    }
  });

  // Pass 2: Level 2 (Ketua Tim / Kabid)
  updatedAgreements.forEach(ag => {
    if (ag.level !== 'Pegawai' && ag.level !== 'Kepala Stasiun') {
      ag.objectives.forEach(obj => {
        objMap[obj.id] = obj;

        if (isPromotionIndicator(obj.indicatorName)) {
          if (obj.calculationType === 'manual') return;

          // Check if there are linked child objectives from Level 3
          const childObjectives = Object.values(objMap).filter(
            child => child.parentIndicatorId === obj.id
          );

          const monthlyArray: number[] = new Array(12).fill(0);
          let totalSum = 0;

          if (childObjectives.length > 0) {
            // Aggregate from children
            for (let m = 0; m < 12; m++) {
              let mSum = 0;
              childObjectives.forEach(child => {
                const val = child.monthlyAchievements?.[m] ?? 0;
                mSum += Number(val) || 0;
              });
              const manualAdd = obj.manualAchievements?.[m] || 0;
              const finalVal = mSum + manualAdd;
              monthlyArray[m] = finalVal;
              totalSum += finalVal;
            }
          } else {
            // Check matching division or fall back to station monthly promotions
            let divKey = '';
            if (ag.level.includes('Layanan')) divKey = 'Layanan Pengembangan Usaha';
            else if (ag.level.includes('Siaran')) divKey = 'Siaran';
            else if (ag.level.includes('Pemberitaan')) divKey = 'Pemberitaan';
            else if (ag.level.includes('Konten')) divKey = 'Konten Media Baru';
            else if (ag.level.includes('Tata Usaha')) divKey = 'Tata Usaha / Umum';
            else if (ag.level.includes('Teknologi') || ag.level.includes('Teknik')) divKey = 'Teknologi dan Media Baru';

            const sourceMonthly = (divKey && divisionMonthlyCounts[divKey]) 
              ? divisionMonthlyCounts[divKey] 
              : stationMonthlyCounts;

            for (let m = 0; m < 12; m++) {
              const count = sourceMonthly[m] || 0;
              const manualAdd = obj.manualAchievements?.[m] || 0;
              const finalVal = count + manualAdd;
              monthlyArray[m] = finalVal;
              totalSum += finalVal;
            }
          }

          obj.monthlyAchievements = monthlyArray;
          obj.achievement = totalSum;
        }
      });
    }
  });

  // Pass 3: Level 1 (Kepala Stasiun)
  updatedAgreements.forEach(ag => {
    if (ag.level === 'Kepala Stasiun') {
      ag.objectives.forEach(obj => {
        if (isPromotionIndicator(obj.indicatorName)) {
          if (obj.calculationType === 'manual') return;

          const childObjectives = Object.values(objMap).filter(
            child => child.parentIndicatorId === obj.id
          );

          const monthlyArray: number[] = new Array(12).fill(0);
          let totalSum = 0;

          if (childObjectives.length > 0) {
            for (let m = 0; m < 12; m++) {
              let mSum = 0;
              childObjectives.forEach(child => {
                const val = child.monthlyAchievements?.[m] ?? 0;
                mSum += Number(val) || 0;
              });
              const manualAdd = obj.manualAchievements?.[m] || 0;
              const finalVal = mSum + manualAdd;
              monthlyArray[m] = finalVal;
              totalSum += finalVal;
            }
          } else {
            // Station-wide monthly promotions
            for (let m = 0; m < 12; m++) {
              const count = stationMonthlyCounts[m] || 0;
              const manualAdd = obj.manualAchievements?.[m] || 0;
              const finalVal = count + manualAdd;
              monthlyArray[m] = finalVal;
              totalSum += finalVal;
            }
          }

          obj.monthlyAchievements = monthlyArray;
          obj.achievement = totalSum;
        }
      });
    }
  });

  return updatedAgreements;
}
