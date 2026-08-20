import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PerformanceAgreement, AppSettings, InstitutionalIdentity, Employee } from '../types';

export interface ReportFilterOptions {
  year: number;
  periodLabel?: string;
  selectedLevel?: string; // 'all' or specific level
  selectedDivision?: string;
  includeSignatures?: boolean;
  notes?: string;
}

// Helper to format currency
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

// Calculate indicator achievement percentage score based on periodType and target
const getIndicatorScore = (obj: any) => {
  if (!obj) return 0;
  const targetVal = parseFloat(obj.target) || 100;
  const achievements = obj.monthlyAchievements && obj.monthlyAchievements.length === 12
    ? obj.monthlyAchievements
    : Array(12).fill(0);

  const tType = obj.trajectoryType || (
    obj.unit === '%' ||
    obj.indicatorName.toLowerCase().includes('ikpa') ||
    obj.indicatorName.toLowerCase().includes('indeks') ||
    obj.indicatorName.toLowerCase().includes('nilai')
      ? 'constant'
      : 'cumulative'
  );

  let currentRealization = 0;
  if (tType === 'constant') {
    const activeMonths = achievements.filter((v: number) => v > 0);
    currentRealization = activeMonths.length > 0
      ? activeMonths.reduce((a: number, b: number) => a + b, 0) / activeMonths.length
      : 0;
  } else {
    currentRealization = achievements.reduce((a: number, b: number) => a + b, 0);
  }

  if (targetVal === 0) return 0;
  const pct = Math.round((currentRealization / targetVal) * 100);
  return Math.min(Math.max(pct, 0), 150); // Cap reasonable range
};

/**
 * 1. EXPORT PERJANJIAN KINERJA (PK) RESMI LEVEL 1 & LEVEL 2
 */
export const exportPerjanjianKinerjaPDF = (
  agreements: PerformanceAgreement[],
  identity: InstitutionalIdentity,
  settings: AppSettings,
  options: ReportFilterOptions
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const targetYear = options.year || 2026;
  const filteredAgreements = agreements.filter(a => {
    if (a.year !== targetYear) return false;
    if (options.selectedLevel && options.selectedLevel !== 'all') {
      return a.level === options.selectedLevel;
    }
    return a.level !== 'Pegawai';
  });

  // Header / Kop Surat
  const renderKopSurat = (d: jsPDF, pageNum: number, totalPages?: number) => {
    d.setFont('helvetica', 'bold');
    d.setFontSize(11);
    d.setTextColor(20, 20, 20);
    d.text('LEMBAGA PENYIARAN PUBLIK RADIO REPUBLIK INDONESIA', 105, 14, { align: 'center' });
    d.setFontSize(12);
    d.text(settings.namaInstansi ? settings.namaInstansi.toUpperCase() : 'STASIUN PENYIARAN RRI BANDAR LAMPUNG', 105, 19, { align: 'center' });
    d.setFont('helvetica', 'normal');
    d.setFontSize(8.5);
    d.setTextColor(80, 80, 80);
    d.text(settings.alamat || 'Jl. Gatot Subroto No. 26, Pahoman, Bandar Lampung | Telp: (0721) 252111', 105, 23.5, { align: 'center' });
    
    // Double Line Border
    d.setDrawColor(20, 20, 20);
    d.setLineWidth(0.7);
    d.line(15, 26, 195, 26);
    d.setLineWidth(0.2);
    d.line(15, 27, 195, 27);
  };

  if (filteredAgreements.length === 0) {
    renderKopSurat(doc, 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text('DOKUMEN PERJANJIAN KINERJA', 105, 45, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Tidak ada data Perjanjian Kinerja untuk Tahun ${targetYear}.`, 105, 60, { align: 'center' });
    doc.save(`Perjanjian_Kinerja_RRI_${targetYear}.pdf`);
    return;
  }

  filteredAgreements.forEach((agreement, index) => {
    if (index > 0) doc.addPage();
    renderKopSurat(doc, index + 1);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('PERJANJIAN KINERJA TAHUN ' + targetYear, 105, 34, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(`Nomor: PK-${targetYear}/RRI-BDL/${agreement.level.replace(/\s+/g, '-').toUpperCase()}`, 105, 38.5, { align: 'center' });

    // Narrative Statement
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    const p1Name = identity.kepalaStasiunNama || 'Drs. H. Rozani, M.Si.';
    const p2Name = agreement.assignedToName || 'Pejabat Terkait';
    
    const statement = `Dalam rangka mewujudkan manajemen pemerintahan yang efektif, transparan, dan akuntabel serta berorientasi pada hasil, kami yang bertanda tangan di bawah ini:\n\n` +
      `Nama           : ${p2Name}\n` +
      `Jabatan         : ${agreement.level}\n` +
      `Selanjutnya disebut PIHAK PERTAMA\n\n` +
      `Nama           : ${p1Name}\n` +
      `Jabatan         : Kepala Stasiun RRI Bandar Lampung\n` +
      `Selanjutnya disebut PIHAK KEDUA\n\n` +
      `Pihak Pertama berjanji akan mewujudkan target kinerja yang seharusnya sesuai lampiran perjanjian ini, dalam rangka mencapai target kinerja jangka menengah seperti yang telah ditetapkan dalam dokumen perencanaan. Pihak Kedua akan melakukan supervisi dan evaluasi terhadap capaian kinerja dari perjanjian ini.`;

    const splitStatement = doc.splitTextToSize(statement, 180);
    doc.text(splitStatement, 15, 45);

    const startTableY = 45 + (splitStatement.length * 3.8) + 4;

    // Table Data
    const tableBody = agreement.objectives.map((obj, i) => {
      return [
        (i + 1).toString(),
        obj.indicatorName,
        obj.target,
        obj.unit,
        `${obj.weight}%`,
        obj.periodType ? obj.periodType.toUpperCase() : 'TAHUNAN'
      ];
    });

    autoTable(doc, {
      startY: startTableY,
      head: [['No', 'Sasaran Strategis / Indikator Kinerja', 'Target', 'Satuan', 'Bobot', 'Periode']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' }
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 15, right: 15 }
    });

    // Signature Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we have enough space on page, else add page
    const signatureY = finalY > 235 ? 240 : finalY;
    if (finalY > 235) {
      doc.addPage();
      renderKopSurat(doc, index + 1);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(`Bandar Lampung, 02 Januari ${targetYear}`, 140, signatureY);

    doc.text('Pihak Kedua,\nKepala Stasiun RRI Bandar Lampung', 30, signatureY + 6);
    doc.text('Pihak Pertama,\n' + agreement.level, 140, signatureY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(p1Name, 30, signatureY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('NIP. 19710515 199403 1 002', 30, signatureY + 31.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(p2Name, 140, signatureY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('NIP. 19800812 200501 1 004', 140, signatureY + 31.5);
  });

  doc.save(`Laporan_Perjanjian_Kinerja_${targetYear}.pdf`);
};

/**
 * 2. EXPORT LAPORAN CAPAIAN KINERJA SELURUH BIDANG (EXECUTIVE PERFORMANCE REPORT / LKJIP)
 */
export const exportCapaianKinerjaSeluruhBidangPDF = (
  agreements: PerformanceAgreement[],
  identity: InstitutionalIdentity,
  settings: AppSettings,
  options: ReportFilterOptions
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const targetYear = options.year || 2026;
  const periodAgreements = agreements.filter(a => a.year === targetYear);

  // Header / Kop Surat Landscape
  const renderKopSurat = (d: jsPDF, pageNum: number) => {
    d.setFont('helvetica', 'bold');
    d.setFontSize(12);
    d.setTextColor(20, 20, 20);
    d.text('LEMBAGA PENYIARAN PUBLIK RADIO REPUBLIK INDONESIA', 148.5, 12, { align: 'center' });
    d.setFontSize(13);
    d.text(settings.namaInstansi ? settings.namaInstansi.toUpperCase() : 'STASIUN PENYIARAN RRI BANDAR LAMPUNG', 148.5, 17, { align: 'center' });
    d.setFont('helvetica', 'normal');
    d.setFontSize(8.5);
    d.setTextColor(80, 80, 80);
    d.text(settings.alamat || 'Jl. Gatot Subroto No. 26, Pahoman, Bandar Lampung | Telp: (0721) 252111', 148.5, 21.5, { align: 'center' });
    
    // Double Line Border
    d.setDrawColor(20, 20, 20);
    d.setLineWidth(0.7);
    d.line(15, 24, 282, 24);
    d.setLineWidth(0.2);
    d.line(15, 25, 282, 25);
  };

  renderKopSurat(doc, 1);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`MATRIKS LAPORAN CAPAIAN KINERJA SELURUH BIDANG TAHUN ${targetYear}`, 148.5, 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Periode Evaluasi: ${options.periodLabel || 'Realisasi Berjalan (Tahunan)'} | Sistem SAKIP & Cascading Berjenjang`, 148.5, 36.5, { align: 'center' });

  // Compile Data Across All Divisions (Level 1 and Level 2)
  const rows: any[] = [];
  let no = 1;

  // Level 1: Kepala Stasiun
  const kepalaAg = periodAgreements.find(a => a.level === 'Kepala Stasiun');
  if (kepalaAg && kepalaAg.objectives.length > 0) {
    kepalaAg.objectives.forEach(obj => {
      const score = getIndicatorScore(obj);
      const targetVal = parseFloat(obj.target) || 0;
      const achievements = obj.monthlyAchievements || Array(12).fill(0);
      const realisasi = achievements.reduce((a: number, b: number) => a + b, 0);

      rows.push([
        no++,
        'Level 1: Pimpinan Satker',
        'Kepala Stasiun',
        obj.indicatorName,
        `${obj.target} ${obj.unit}`,
        `${realisasi.toLocaleString('id-ID')} ${obj.unit}`,
        `${obj.weight}%`,
        `${score}%`,
        score >= 100 ? 'Sangat Baik' : score >= 80 ? 'Baik' : 'Perlu Peningkatan'
      ]);
    });
  }

  // Level 2: Bidang-Bidang
  const level2Ags = periodAgreements.filter(a => a.level !== 'Kepala Stasiun' && a.level !== 'Pegawai');
  level2Ags.forEach(ag => {
    ag.objectives.forEach(obj => {
      const score = getIndicatorScore(obj);
      const targetVal = parseFloat(obj.target) || 0;
      const achievements = obj.monthlyAchievements || Array(12).fill(0);
      const realisasi = achievements.reduce((a: number, b: number) => a + b, 0);

      const divLabel = ag.level.replace('Ketua Tim ', '').replace('Kabid ', '');

      rows.push([
        no++,
        `Level 2: Bidang ${divLabel}`,
        ag.assignedToName || ag.level,
        obj.indicatorName,
        `${obj.target} ${obj.unit}`,
        `${realisasi.toLocaleString('id-ID')} ${obj.unit}`,
        `${obj.weight}%`,
        `${score}%`,
        score >= 100 ? 'Sangat Baik' : score >= 80 ? 'Baik' : 'Perlu Peningkatan'
      ]);
    });
  });

  autoTable(doc, {
    startY: 42,
    head: [['No', 'Jenjang / Bidang', 'Penanggung Jawab', 'Sasaran & Indikator Kinerja Utama (IKU/IKP)', 'Target', 'Realisasi', 'Bobot', '% Capaian', 'Predikat']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 26, halign: 'center' }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const sigY = finalY > 165 ? 170 : finalY;
  if (finalY > 165) {
    doc.addPage();
    renderKopSurat(doc, 2);
  }

  // Summary and Sign-off in Landscape
  const p1Name = identity.kepalaStasiunNama || 'Drs. H. Rozani, M.Si.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Bandar Lampung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, sigY);
  doc.text('Mengetahui / Mengesahkan,\nKepala Stasiun RRI Bandar Lampung', 220, sigY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(p1Name, 220, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19710515 199403 1 002', 220, sigY + 25.5);

  doc.save(`Laporan_Capaian_Kinerja_Seluruh_Bidang_${targetYear}.pdf`);
};

/**
 * 3. EXPORT MATRIKS EVALUASI BERKALA (TRIWULAN / SEMESTER / BULANAN)
 */
export const exportEvaluasiBerkalaPDF = (
  agreements: PerformanceAgreement[],
  identity: InstitutionalIdentity,
  settings: AppSettings,
  periodId: string,
  periodName: string,
  year: number
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const renderKopSurat = (d: jsPDF) => {
    d.setFont('helvetica', 'bold');
    d.setFontSize(12);
    d.setTextColor(20, 20, 20);
    d.text('LEMBAGA PENYIARAN PUBLIK RADIO REPUBLIK INDONESIA', 148.5, 12, { align: 'center' });
    d.setFontSize(13);
    d.text(settings.namaInstansi ? settings.namaInstansi.toUpperCase() : 'STASIUN PENYIARAN RRI BANDAR LAMPUNG', 148.5, 17, { align: 'center' });
    d.setFont('helvetica', 'normal');
    d.setFontSize(8.5);
    d.setTextColor(80, 80, 80);
    d.text(settings.alamat || 'Jl. Gatot Subroto No. 26, Pahoman, Bandar Lampung | Telp: (0721) 252111', 148.5, 21.5, { align: 'center' });
    
    d.setDrawColor(20, 20, 20);
    d.setLineWidth(0.7);
    d.line(15, 24, 282, 24);
    d.setLineWidth(0.2);
    d.line(15, 25, 282, 25);
  };

  renderKopSurat(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN EVALUASI CAPAIAN KINERJA BERKALA (${periodName.toUpperCase()}) TAHUN ${year}`, 148.5, 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Evaluasi Penyelarasan IKU Pimpinan ke Seluruh Bidang Satker RRI Bandar Lampung`, 148.5, 36.5, { align: 'center' });

  const targetYearAgs = agreements.filter(a => a.year === year && a.level !== 'Pegawai');
  const rows: any[] = [];
  let no = 1;

  targetYearAgs.forEach(ag => {
    ag.objectives.forEach(obj => {
      const score = getIndicatorScore(obj);
      const achievements = obj.monthlyAchievements || Array(12).fill(0);
      const realisasi = achievements.reduce((a: number, b: number) => a + b, 0);

      rows.push([
        no++,
        ag.level,
        obj.indicatorName,
        `${obj.target} ${obj.unit}`,
        `${realisasi.toLocaleString('id-ID')} ${obj.unit}`,
        `${score}%`,
        score >= 100 ? 'Target Terpenuhi' : score >= 80 ? 'On Track' : 'Memerlukan Intervensi',
        obj.calculationType === 'manual' ? 'Input Manual' : 'Cascading Otomatis'
      ]);
    });
  });

  autoTable(doc, {
    startY: 42,
    head: [['No', 'Jenjang / Bidang', 'Sasaran & Indikator Kinerja', 'Target Periode', 'Realisasi', 'Capaian (%)', 'Status Evaluasi', 'Metode Perhitungan']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 32, halign: 'center' },
      7: { cellWidth: 28, halign: 'center' }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 15, right: 15 }
  });

  doc.save(`Evaluasi_Kinerja_${periodId.toUpperCase()}_${year}.pdf`);
};
