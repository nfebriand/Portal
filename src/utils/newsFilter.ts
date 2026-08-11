import { NewsReport } from '../types';
import { parseFlexibleDate } from './dateUtils';

function getReportMonth(r: NewsReport): number {
  if (r.publishDateTime) {
    const res = parseFlexibleDate(r.publishDateTime);
    if (res.isValid) return res.monthIndex;
  }
  if (r.date) {
    const res = parseFlexibleDate(r.date);
    if (res.isValid) return res.monthIndex;
  }
  return -1;
}

export interface FilterNewsOptions {
  indicator: {
    id?: string;
    indicatorName: string;
    mediaType?: string;
    unit?: string;
  };
  agreement?: {
    level?: string;
    assignedToEmployeeId?: string;
    assignedToName?: string;
  };
  newsReports: NewsReport[];
  period: string; // 'q1'|'q2'|'q3'|'q4'|'s1'|'s2'|'m0'..'m11'|'tahunan'|'Bulanan'|'Semester 1' etc.
  selectedYear?: number;
  selectedMonthIndex?: number; // 0-11 if period === 'Bulanan'
}

/**
 * Checks if an indicator qualifies for opening the Eviden List modal.
 * Strictly allowed only for:
 * 1. Berita Ringan LPU
 * 2. Berita Radio
 * 3. Berita KBRN (Berita Online)
 */
export function isEligibleNewsIndicator(indicator?: { indicatorName?: string; mediaType?: string; unit?: string }): boolean {
  if (!indicator) return false;
  const nameLower = (indicator.indicatorName || '').toLowerCase();
  const mediaType = indicator.mediaType || '';
  const unitLower = (indicator.unit || '').toLowerCase();

  // Non-quantity indicators (Skor, %, Nilai) are manual input indicators, not report count list indicators
  if (unitLower === '%' || unitLower === 'skor' || unitLower === 'nilai' || unitLower.includes('persen')) {
    return false;
  }

  // 1. Berita Ringan LPU
  if (
    mediaType === 'Berita Ringan LPU' || 
    mediaType === 'Berita Ringan' || 
    nameLower.includes('berita ringan') || 
    (nameLower.includes('ringan') && nameLower.includes('lpu')) ||
    nameLower.includes('produksi berita ringan')
  ) {
    return true;
  }

  // 2. Berita Radio
  if (
    mediaType === 'Berita Radio' || 
    nameLower.includes('berita radio') || 
    nameLower.includes('produksi berita radio') ||
    (nameLower.includes('radio') && nameLower.includes('berita') && !nameLower.includes('kepuasan') && !nameLower.includes('pemilu') && !nameLower.includes('layanan'))
  ) {
    return true;
  }

  // 3. Berita KBRN / Berita Online
  if (
    mediaType === 'Berita Online' || 
    mediaType === 'Berita KBRN' || 
    nameLower.includes('berita online') || 
    nameLower.includes('berita kbrn') || 
    nameLower.includes('produksi berita online') ||
    nameLower.includes('kbrn') ||
    nameLower.includes('media baru')
  ) {
    return true;
  }

  // 4. Konten Siaran / Siaran
  if (
    mediaType === 'Konten Siaran' ||
    mediaType === 'Siaran' ||
    nameLower.includes('konten siaran') ||
    (nameLower.includes('siaran') && !nameLower.includes('radio') && !nameLower.includes('pemilu') && !nameLower.includes('prasarana') && !nameLower.includes('stabilitas'))
  ) {
    return true;
  }

  return false;
}

export function filterNewsForIndicator({
  indicator,
  agreement,
  newsReports = [],
  period = 'tahunan',
  selectedYear = 2026,
  selectedMonthIndex = 0
}: FilterNewsOptions): {
  filteredReports: NewsReport[];
  periodLabel: string;
  typeLabel: string;
  isEligible: boolean;
} {
  const nameLower = (indicator?.indicatorName || '').toLowerCase();
  const mediaType = indicator?.mediaType || '';

  let isEligible = false;
  let typeLabel = '';
  let matchesType = (_r: NewsReport) => false;

  if (
    mediaType === 'Berita Ringan LPU' || 
    mediaType === 'Berita Ringan' || 
    nameLower.includes('berita ringan') || 
    (nameLower.includes('ringan') && nameLower.includes('lpu')) ||
    nameLower.includes('produksi berita ringan')
  ) {
    isEligible = true;
    typeLabel = 'Berita Ringan LPU';
    matchesType = (r: NewsReport) => r.type === 'Berita Ringan LPU' || r.type === 'Berita Ringan';
  } else if (
    mediaType === 'Berita Radio' || 
    nameLower.includes('berita radio') || 
    nameLower.includes('produksi berita radio') ||
    (nameLower.includes('radio') && nameLower.includes('berita') && !nameLower.includes('kepuasan') && !nameLower.includes('pemilu') && !nameLower.includes('layanan'))
  ) {
    isEligible = true;
    typeLabel = 'Berita Radio';
    matchesType = (r: NewsReport) => r.type === 'Berita Radio';
  } else if (
    mediaType === 'Berita Online' || 
    mediaType === 'Berita KBRN' || 
    nameLower.includes('berita online') || 
    nameLower.includes('berita kbrn') || 
    nameLower.includes('produksi berita online') ||
    nameLower.includes('kbrn') ||
    nameLower.includes('media baru')
  ) {
    isEligible = true;
    typeLabel = 'Berita KBRN';
    matchesType = (r: NewsReport) => r.type === 'Berita Online' || (r.type as string) === 'Berita KBRN';
  } else if (
    mediaType === 'Konten Siaran' ||
    mediaType === 'Siaran' ||
    nameLower.includes('konten siaran') ||
    (nameLower.includes('siaran') && !nameLower.includes('radio') && !nameLower.includes('pemilu') && !nameLower.includes('prasarana') && !nameLower.includes('stabilitas'))
  ) {
    isEligible = true;
    typeLabel = 'Konten Siaran';
    matchesType = (r: NewsReport) => r.type === 'Konten Siaran' || (r.type as string)?.toLowerCase().includes('siaran');
  }

  if (!isEligible) {
    return {
      filteredReports: [],
      periodLabel: '',
      typeLabel: '',
      isEligible: false
    };
  }

  // Determine normalized period & human label
  let periodLabel = `Tahunan (${selectedYear})`;
  let matchesPeriod = (_r: NewsReport) => true;

  const pLower = (period || '').toLowerCase().trim();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (pLower === 'bulanan' || (pLower.startsWith('m') && pLower.length <= 3)) {
    let mIdx = selectedMonthIndex;
    if (pLower.startsWith('m') && pLower.length > 1) {
      const parsed = parseInt(pLower.substring(1), 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 11) {
        mIdx = parsed;
      }
    }
    periodLabel = `Bulanan - ${monthNames[mIdx]} ${selectedYear}`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m === mIdx;
    };
  } else if (
    pLower === 'q1' || 
    pLower === 'triwulan 1' || 
    pLower === 'triwulan i' || 
    pLower === 'tw 1' || 
    pLower === 'tw i'
  ) {
    periodLabel = `Triwulan I (Jan - Mar ${selectedYear})`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m >= 0 && m <= 2;
    };
  } else if (
    pLower === 'q2' || 
    pLower === 'triwulan 2' || 
    pLower === 'triwulan ii' || 
    pLower === 'tw 2' || 
    pLower === 'tw ii'
  ) {
    periodLabel = `Triwulan II (Apr - Jun ${selectedYear})`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m >= 3 && m <= 5;
    };
  } else if (
    pLower === 'q3' || 
    pLower === 'triwulan 3' || 
    pLower === 'triwulan iii' || 
    pLower === 'tw 3' || 
    pLower === 'tw iii'
  ) {
    periodLabel = `Triwulan III (Jul - Sep ${selectedYear})`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m >= 6 && m <= 8;
    };
  } else if (
    pLower === 'q4' || 
    pLower === 'triwulan 4' || 
    pLower === 'triwulan iv' || 
    pLower === 'tw 4' || 
    pLower === 'tw iv'
  ) {
    periodLabel = `Triwulan IV (Okt - Des ${selectedYear})`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m >= 9 && m <= 11;
    };
  } else if (
    pLower === 's1' || 
    pLower === 'semester 1' || 
    pLower === 'semester i' || 
    pLower === 'sm 1' || 
    pLower === 'sm i'
  ) {
    periodLabel = `Semester I (Jan - Jun ${selectedYear})`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m >= 0 && m <= 5;
    };
  } else if (
    pLower === 's2' || 
    pLower === 'semester 2' || 
    pLower === 'semester ii' || 
    pLower === 'sm 2' || 
    pLower === 'sm ii'
  ) {
    periodLabel = `Semester II (Jul - Des ${selectedYear})`;
    matchesPeriod = (r: NewsReport) => {
      const m = getReportMonth(r);
      return m >= 6 && m <= 11;
    };
  } else {
    // Check if month name was directly passed
    const foundMonthIdx = monthNames.findIndex(m => m.toLowerCase() === pLower);
    if (foundMonthIdx !== -1) {
      periodLabel = `Bulanan - ${monthNames[foundMonthIdx]} ${selectedYear}`;
      matchesPeriod = (r: NewsReport) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return !isNaN(d.getTime()) && d.getMonth() === foundMonthIdx;
      };
    } else {
      periodLabel = `Tahunan (${selectedYear})`;
      matchesPeriod = (_r: NewsReport) => true;
    }
  }

  // Match employee if agreement belongs to Level 3 / Pegawai
  let matchesEmployee = (_r: NewsReport) => true;
  if (agreement?.level === 'Pegawai' && (agreement.assignedToEmployeeId || agreement.assignedToName)) {
    const empId = agreement.assignedToEmployeeId;
    const empName = (agreement.assignedToName || '').toLowerCase().trim();
    
    matchesEmployee = (r: NewsReport) => {
      if (empId && r.employeeId === empId) return true;
      if (empName) {
        const wName = (r.writerName || '').toLowerCase().trim();
        const rName = (r.reporterName || '').toLowerCase().trim();
        if (wName && (wName.includes(empName) || empName.includes(wName))) return true;
        if (rName && (rName.includes(empName) || empName.includes(rName))) return true;
      }
      return false;
    };
  }

  const filteredReports = newsReports.filter(r => matchesPeriod(r) && matchesType(r) && matchesEmployee(r));

  return { filteredReports, periodLabel, typeLabel, isEligible: true };
}

