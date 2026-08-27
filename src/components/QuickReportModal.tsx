import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Building2, 
  Calendar,
  Eye,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PerformanceAgreement, InstitutionalIdentity, AppSettings } from '../types';
import { 
  exportPerjanjianKinerjaPDF, 
  exportCapaianKinerjaSeluruhBidangPDF, 
  exportEvaluasiBerkalaPDF 
} from '../utils/pdfExport';

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreements: PerformanceAgreement[];
  identity: InstitutionalIdentity;
  settings: AppSettings;
  defaultYear?: number;
}

export const QuickReportModal: React.FC<QuickReportModalProps> = ({
  isOpen,
  onClose,
  agreements,
  identity,
  settings,
  defaultYear = 2026
}) => {
  const [reportType, setReportType] = useState<'pk' | 'capaian_bidang' | 'evaluasi'>('capaian_bidang');
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [evalPeriod, setEvalPeriod] = useState<string>('tahunan');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const periodLabels: Record<string, string> = {
    'q1': 'Triwulan I (Januari - Maret)',
    'q2': 'Triwulan II (April - Juni)',
    'q3': 'Triwulan III (Juli - September)',
    'q4': 'Triwulan IV (Oktober - Desember)',
    's1': 'Semester I (Januari - Juni)',
    's2': 'Semester II (Juli - Desember)',
    'tahunan': 'Tahunan Penuh'
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      if (reportType === 'pk') {
        exportPerjanjianKinerjaPDF(agreements, identity, settings, {
          year: selectedYear,
          selectedLevel: selectedLevel
        });
      } else if (reportType === 'capaian_bidang') {
        exportCapaianKinerjaSeluruhBidangPDF(agreements, identity, settings, {
          year: selectedYear,
          periodLabel: periodLabels[evalPeriod] || 'Tahunan'
        });
      } else {
        exportEvaluasiBerkalaPDF(
          agreements,
          identity,
          settings,
          evalPeriod,
          periodLabels[evalPeriod] || 'Evaluasi Berkala',
          selectedYear
        );
      }
      setExportSuccessMsg('Dokumen PDF berhasil dibuat dan diunduh!');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Gagal export PDF:", err);
      alert("Terjadi kendala saat membuat PDF. Silakan gunakan opsi Cetak Laporan.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const targetAgs = agreements.filter(a => a.year === selectedYear && a.level !== 'Pegawai');
      const dataRows: any[] = [];

      targetAgs.forEach(ag => {
        ag?.objectives?.forEach((obj, idx) => {
          const achievements = obj.monthlyAchievements || Array(12).fill(0);
          const realisasi = achievements.reduce((a, b) => a + b, 0);
          const targetVal = parseFloat(obj.target) || 100;
          const score = targetVal > 0 ? Math.round((realisasi / targetVal) * 100) : 0;

          dataRows.push({
            'Tahun': selectedYear,
            'Jenjang / Level': ag.level,
            'Penanggung Jawab': ag.assignedToName,
            'No Sasaran': idx + 1,
            'Indikator Kinerja': obj.indicatorName,
            'Target': obj.target,
            'Satuan': obj.unit,
            'Bobot (%)': obj.weight,
            'Realisasi Akumulasi': realisasi,
            'Capaian (%)': `${score}%`,
            'Status PK': ag.status,
            'Tipe Evaluasi': obj.periodType || 'Tahunan'
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan_Kinerja");
      XLSX.writeFile(wb, `Laporan_Kinerja_RRI_${selectedYear}_${reportType}.xlsx`);

      setExportSuccessMsg('File Spreadsheet Excel (.xlsx) berhasil diunduh!');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
      alert("Gagal mengunduh Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        id="quick-report-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md font-mono">
                  EXPORT & CETAK RESMI
                </span>
                <span className="text-xs text-slate-300 font-mono">SAKIP FORMAT</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">Laporan Kinerja & Perjanjian Kerja</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Success Banner */}
          {exportSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {/* 1. Pilih Jenis Laporan */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Pilih Format Laporan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1 */}
              <button
                type="button"
                onClick={() => setReportType('capaian_bidang')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  reportType === 'capaian_bidang'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Building2 className={`w-4 h-4 ${reportType === 'capaian_bidang' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {reportType === 'capaian_bidang' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <h4 className="text-xs font-bold text-slate-800">Capaian Kinerja Seluruh Bidang</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Rekapitulasi sasaran & realisasi seluruh divisi (TU, Siaran, Berita, TMB, KMB, LPU).
                </p>
              </button>

              {/* Option 2 */}
              <button
                type="button"
                onClick={() => setReportType('pk')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  reportType === 'pk'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Award className={`w-4 h-4 ${reportType === 'pk' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {reportType === 'pk' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <h4 className="text-xs font-bold text-slate-800">Dokumen Perjanjian Kinerja (PK)</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Format resmi bertandatangan antara Pimpinan & Ketua Bidang / Tim.
                </p>
              </button>

              {/* Option 3 */}
              <button
                type="button"
                onClick={() => setReportType('evaluasi')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  reportType === 'evaluasi'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Calendar className={`w-4 h-4 ${reportType === 'evaluasi' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {reportType === 'evaluasi' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <h4 className="text-xs font-bold text-slate-800">Evaluasi Capaian Berkala</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Matriks evaluasi target berkala (Triwulanan, Semesteran, atau Bulanan).
                </p>
              </button>
            </div>
          </div>

          {/* 2. Pengaturan Filter */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Parameter Laporan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tahun */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tahun Anggaran:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value={2026}>2026 (Periode Aktif)</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              {/* Conditional: Periode or Level */}
              {reportType === 'pk' ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jenjang Dokumen:</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="all">Semua Jenjang (Level 1 & Level 2)</option>
                    <option value="Kepala Stasiun">Khusus Level 1 - Kepala Stasiun</option>
                    <option value="Kabid Tata Usaha">Kabid Tata Usaha</option>
                    <option value="Ketua Tim Siaran">Ketua Tim Siaran</option>
                    <option value="Ketua Tim Pemberitaan">Ketua Tim Pemberitaan</option>
                    <option value="Ketua Tim Teknologi dan Media Baru">Ketua Tim Teknologi dan Media Baru</option>
                    <option value="Ketua Tim Layanan Pengembangan Usaha">Ketua Tim Layanan Pengembangan Usaha</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Periode Evaluasi:</label>
                  <select
                    value={evalPeriod}
                    onChange={(e) => setEvalPeriod(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="tahunan">Tahunan (Full Year)</option>
                    <option value="q1">Triwulan I (Januari - Maret)</option>
                    <option value="q2">Triwulan II (April - Juni)</option>
                    <option value="q3">Triwulan III (Juli - September)</option>
                    <option value="q4">Triwulan IV (Oktober - Desember)</option>
                    <option value="s1">Semester I (Januari - Juni)</option>
                    <option value="s2">Semester II (Juli - Desember)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>
                Laporan dilengkapi kop resmi <strong>{settings.namaInstansi || 'LPP RRI Bandar Lampung'}</strong>, nomor register dokumen, matriks sasaran berjenjang, dan tanda tangan pimpinan.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Tutup
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Excel Download */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              title="Unduh data dalam format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>

            {/* Print Browser Preview */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              title="Buka dialog cetak browser (Ctrl + P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>

            {/* Primary PDF Direct Download */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses...' : 'Export to PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuickReportModal;
