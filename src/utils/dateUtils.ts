/**
 * Utility for parsing various date formats from Excel, CSV, JSON, and user inputs.
 * Handles Excel serial numbers (e.g. 45292), Indonesian month names (e.g. 15 Januari 2024),
 * DD/MM/YYYY vs YYYY-MM-DD, ISO timestamps, and standard JS Date objects.
 */

export interface ParsedDateResult {
  dateISO: string; // YYYY-MM-DD format
  publishDateTimeISO: string; // Original formatted string or ISO
  monthIndex: number; // 0-based month index (0 = Jan, 11 = Dec)
  year: number; // Full year (e.g. 2024)
  isValid: boolean;
}

export function parseFlexibleDate(rawInput: any): ParsedDateResult {
  const now = new Date();
  const fallbackResult: ParsedDateResult = {
    dateISO: now.toISOString().split('T')[0],
    publishDateTimeISO: now.toISOString(),
    monthIndex: now.getMonth(),
    year: now.getFullYear(),
    isValid: false,
  };

  if (rawInput === null || rawInput === undefined || rawInput === '') {
    return fallbackResult;
  }

  // 1. If rawInput is a JS Date instance
  if (rawInput instanceof Date && !isNaN(rawInput.getTime())) {
    const y = rawInput.getFullYear();
    const m = rawInput.getMonth();
    const d = rawInput.getDate();
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      dateISO: iso,
      publishDateTimeISO: rawInput.toISOString(),
      monthIndex: m,
      year: y,
      isValid: true,
    };
  }

  // 2. Handle Excel serial numbers (number or string containing digits only)
  // e.g. 45292 = 2024-01-01
  let numVal = typeof rawInput === 'number' ? rawInput : NaN;
  if (typeof rawInput === 'string' && /^\d+(\.\d+)?$/.test(rawInput.trim())) {
    numVal = Number(rawInput.trim());
  }

  if (!isNaN(numVal) && numVal > 20000 && numVal < 80000) {
    // 25569 = days between 1899-12-30 and 1970-01-01
    const msSinceEpoch = (numVal - 25569) * 86400 * 1000;
    const dateObj = new Date(msSinceEpoch);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const m = dateObj.getUTCMonth();
      const d = dateObj.getUTCDate();
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return {
        dateISO: iso,
        publishDateTimeISO: iso,
        monthIndex: m,
        year: y,
        isValid: true,
      };
    }
  }

  let str = String(rawInput).trim();
  if (!str) return fallbackResult;

  // 3. Indonesian Month Names Mapping
  const indoMonths: { [key: string]: number } = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, ags: 7, agu: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    oktober: 9, okt: 9, oct: 9,
    november: 10, nov: 10, nop: 10,
    desember: 11, des: 11, dec: 11
  };

  const words = str.toLowerCase().split(/[\s,.-]+/);
  let foundMonthIdx = -1;
  words.forEach(w => {
    if (indoMonths[w] !== undefined) {
      foundMonthIdx = indoMonths[w];
    }
  });

  if (foundMonthIdx !== -1) {
    const nums = str.match(/\d+/g);
    if (nums && nums.length >= 1) {
      let day = 1;
      let year = now.getFullYear();

      const yearMatch = nums.find(n => n.length === 4);
      if (yearMatch) {
        year = parseInt(yearMatch, 10);
      } else {
        const lastNum = nums[nums.length - 1];
        if (lastNum && lastNum.length === 2) {
          year = 2000 + parseInt(lastNum, 10);
        }
      }

      const dayMatch = nums.find(n => n !== String(year) && parseInt(n, 10) >= 1 && parseInt(n, 10) <= 31);
      if (dayMatch) {
        day = parseInt(dayMatch, 10);
      }

      const iso = `${year}-${String(foundMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        dateISO: iso,
        publishDateTimeISO: str,
        monthIndex: foundMonthIdx,
        year: year,
        isValid: true,
      };
    }
  }

  // 4. Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Standard Indonesian Date Format)
  // e.g. "15/01/2024", "02/06/2024 14:30:00", "15-01-2024"
  const ddmmyyyyRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
  const matchDDMM = str.match(ddmmyyyyRegex);
  if (matchDDMM) {
    const day = parseInt(matchDDMM[1], 10);
    const month = parseInt(matchDDMM[2], 10); // 1-12
    const year = parseInt(matchDDMM[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const monthIdx = month - 1;
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        dateISO: iso,
        publishDateTimeISO: str,
        monthIndex: monthIdx,
        year: year,
        isValid: true,
      };
    }
  }

  // 5. Handle YYYY-MM-DD or YYYY/MM/DD
  const yyyymmddRegex = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
  const matchYYYYMM = str.match(yyyymmddRegex);
  if (matchYYYYMM) {
    const year = parseInt(matchYYYYMM[1], 10);
    const month = parseInt(matchYYYYMM[2], 10); // 1-12
    const day = parseInt(matchYYYYMM[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const monthIdx = month - 1;
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        dateISO: iso,
        publishDateTimeISO: str,
        monthIndex: monthIdx,
        year: year,
        isValid: true,
      };
    }
  }

  // 6. Standard ISO / JS Date string fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const dateVal = d.getDate();
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(dateVal).padStart(2, '0')}`;
    return {
      dateISO: iso,
      publishDateTimeISO: str,
      monthIndex: m,
      year: y,
      isValid: true,
    };
  }

  return fallbackResult;
}
