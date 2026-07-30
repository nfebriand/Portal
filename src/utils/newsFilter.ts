import { NewsReport } from '../types';

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
} {
  const nameLower = (indicator.indicatorName || '').toLowerCase();
  const mediaType = indicator.mediaType;

  // Determine normalized period & human label
  let periodLabel = `Tahunan (${selectedYear})`;
  let matchesPeriod = (_r: NewsReport) => true;

  const pLower = (period || '').toLowerCase().trim();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (pLower === 'bulanan' || pLower.startsWith('m') && pLower.length <= 3) {
    let mIdx = selectedMonthIndex;
    if (pLower.startsWith('m') && pLower.length > 1) {
      const parsed = parseInt(pLower.substring(1), 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 11) {
        mIdx = parsed;
      }
    }
    periodLabel = `Bulanan - ${monthNames[mIdx]} ${selectedYear}`;
    matchesPeriod = (r: NewsReport) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() === mIdx;
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
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() >= 0 && d.getMonth() <= 2;
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
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() >= 3 && d.getMonth() <= 5;
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
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() >= 6 && d.getMonth() <= 8;
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
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() >= 9 && d.getMonth() <= 11;
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
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() >= 0 && d.getMonth() <= 5;
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
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() >= 6 && d.getMonth() <= 11;
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

  // Type label & matcher
  let typeLabel = 'Semua Berita';
  let matchesType = (_r: NewsReport) => true;

  if (mediaType === 'Berita Ringan LPU' || mediaType === 'Berita Ringan' || nameLower.includes('ringan') || nameLower.includes('lpu')) {
    typeLabel = 'Berita Ringan LPU';
    matchesType = (r: NewsReport) => r.type === 'Berita Ringan LPU' || r.type === 'Berita Ringan';
  } else if (mediaType === 'Berita Radio' || nameLower.includes('radio')) {
    typeLabel = 'Berita Radio';
    matchesType = (r: NewsReport) => r.type === 'Berita Radio';
  } else if (mediaType === 'Konten Siaran' || nameLower.includes('konten siaran') || (nameLower.includes('siaran') && !nameLower.includes('radio'))) {
    typeLabel = 'Konten Siaran';
    matchesType = (r: NewsReport) => r.type === 'Konten Siaran';
  } else if (mediaType === 'Berita Online' || nameLower.includes('online') || nameLower.includes('media baru') || nameLower.includes('medsos') || nameLower.includes('kbrn')) {
    typeLabel = 'Berita Online';
    matchesType = (r: NewsReport) => r.type === 'Berita Online';
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

  return { filteredReports, periodLabel, typeLabel };
}
