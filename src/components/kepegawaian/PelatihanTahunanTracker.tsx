import React, { useMemo } from 'react';
import { Employee, TrainingHistory } from '../../types';
import { Award, CheckCircle2, AlertCircle, Clock, Calendar, BookOpen, Layers, Sparkles, Check } from 'lucide-react';

interface PelatihanTahunanTrackerProps {
  employee: Employee;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

export interface YearTrainingSummary {
  year: number;
  totalHours: number; // Hanya jam berjenis 'JP' yang dihitung ke kewajiban 40 jam
  totalNonJpHours: number; // Total jam yang berjenis 'Non JP'
  trainings: TrainingHistory[]; // Seluruh riwayat pelatihan tahun tersebut
  jpTrainings: TrainingHistory[]; // Khusus yang berjenis 'JP'
  nonJpTrainings: TrainingHistory[]; // Khusus yang berjenis 'Non JP'
  isCompliant: boolean; // totalHours >= 40
  percentage: number; // Math.min(100, Math.round((totalHours / 40) * 100))
  remainingHours: number; // Math.max(0, 40 - totalHours)
  tanggalTercapai40Jam?: string | null; // Tanggal saat kumulatif JP mencapai minimal 40 jam
  pelatihanTercapai40Jam?: string | null; // Nama kegiatan pelatihan pencapai batas 40 jam
}

// Helper formatting Indonesian Date
export function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function computeEmployeeAnnualTrainings(employee: Employee): Record<number, YearTrainingSummary> {
  const list = employee.riwayatPelatihan || [];
  const currentYear = new Date().getFullYear();
  const yearMap: Record<number, TrainingHistory[]> = {};

  // Default initialize current year and previous year
  yearMap[currentYear] = [];
  yearMap[currentYear - 1] = [];

  list.forEach(item => {
    const y = item.tahun || (item.tanggalMulai ? new Date(item.tanggalMulai).getFullYear() : currentYear);
    if (!yearMap[y]) {
      yearMap[y] = [];
    }
    yearMap[y].push(item);
  });

  const result: Record<number, YearTrainingSummary> = {};
  Object.keys(yearMap).forEach(key => {
    const y = Number(key);
    const trainings = yearMap[y];

    const jpTrainings: TrainingHistory[] = [];
    const nonJpTrainings: TrainingHistory[] = [];
    let totalHours = 0;
    let totalNonJpHours = 0;

    trainings.forEach(t => {
      const isJP = t.jenisPerhitungan !== 'Non JP';
      const jam = Number(t.durasiJam) || 0;
      if (isJP) {
        jpTrainings.push(t);
        totalHours += jam;
      } else {
        nonJpTrainings.push(t);
        totalNonJpHours += jam;
      }
    });

    const isCompliant = totalHours >= 40;
    const percentage = Math.min(100, Math.round((totalHours / 40) * 100));
    const remainingHours = Math.max(0, 40 - totalHours);

    let tanggalTercapai40Jam: string | null = null;
    let pelatihanTercapai40Jam: string | null = null;

    if (isCompliant) {
      // Sort JP trainings chronologically by tanggalSelesai or tanggalMulai
      const sortedJp = [...jpTrainings].sort((a, b) => {
        const dateA = a.tanggalSelesai || a.tanggalMulai || `${y}-01-01`;
        const dateB = b.tanggalSelesai || b.tanggalMulai || `${y}-01-01`;
        return dateA.localeCompare(dateB);
      });

      let cumHours = 0;
      for (const item of sortedJp) {
        cumHours += Number(item.durasiJam) || 0;
        if (cumHours >= 40) {
          tanggalTercapai40Jam = item.tanggalSelesai || item.tanggalMulai || `${y}-12-31`;
          pelatihanTercapai40Jam = item.namaPelatihan;
          break;
        }
      }
    }

    result[y] = {
      year: y,
      totalHours,
      totalNonJpHours,
      trainings,
      jpTrainings,
      nonJpTrainings,
      isCompliant,
      percentage,
      remainingHours,
      tanggalTercapai40Jam,
      pelatihanTercapai40Jam
    };
  });

  return result;
}

export default function PelatihanTahunanTracker({
  employee,
  selectedYear: propYear,
  onYearChange
}: PelatihanTahunanTrackerProps) {
  const currentYear = new Date().getFullYear();
  const [internalYear, setInternalYear] = React.useState<number>(currentYear);
  const activeYear = propYear !== undefined ? propYear : internalYear;

  const annualSummaries = useMemo(() => {
    return computeEmployeeAnnualTrainings(employee);
  }, [employee]);

  const availableYears = useMemo(() => {
    const years = Object.keys(annualSummaries).map(Number).sort((a, b) => b - a);
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
    }
    return years;
  }, [annualSummaries, currentYear]);

  const currentSummary = annualSummaries[activeYear] || {
    year: activeYear,
    totalHours: 0,
    totalNonJpHours: 0,
    trainings: [],
    jpTrainings: [],
    nonJpTrainings: [],
    isCompliant: false,
    percentage: 0,
    remainingHours: 40,
    tanggalTercapai40Jam: null,
    pelatihanTercapai40Jam: null
  };

  const handleSelectYear = (yr: number) => {
    setInternalYear(yr);
    if (onYearChange) onYearChange(yr);
  };

  return (
    <div className="space-y-4">
      {/* Header & Year Selector */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Kewajiban Pelatihan Tahunan (Min. 40 Jam / Tahun)
            </h4>
            <p className="text-[10px] text-slate-400">
              Perhitungan hanya mengakumulasikan pelatihan berjenis <strong>Jam Pelajaran (JP)</strong>.
            </p>
          </div>
        </div>

        {/* Year Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          {availableYears.map(yr => (
            <button
              key={yr}
              type="button"
              onClick={() => handleSelectYear(yr)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeYear === yr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Compliance Banner */}
      <div className={`p-4 rounded-2xl border ${
        currentSummary.isCompliant
          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-2xs'
          : 'bg-amber-50/90 border-amber-200 text-amber-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {currentSummary.isCompliant ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-7 h-7 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  Status Tahun {activeYear}:
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                  currentSummary.isCompliant
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}>
                  {currentSummary.isCompliant ? 'Memenuhi Standar (≥ 40 JP)' : 'Belum Memenuhi (< 40 JP)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">
                {currentSummary.isCompliant
                  ? `Target tahun ${activeYear} terpenuhi dengan total realisasi ${currentSummary.totalHours} Jam Pelajaran (JP).`
                  : `Tercapai ${currentSummary.totalHours} JP. Masih memerlukan ${currentSummary.remainingHours} Jam Pelajaran (JP) lagi untuk memenuhi batas minimal 40 Jam/Tahun.`}
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="text-2xl font-black font-mono">
              {currentSummary.totalHours} <span className="text-xs font-bold text-slate-500">/ 40 JP</span>
            </span>
            {currentSummary.totalNonJpHours > 0 && (
              <p className="text-[10px] text-slate-500 font-medium">
                + {currentSummary.totalNonJpHours} Jam (Non-JP)
              </p>
            )}
          </div>
        </div>

        {/* Milestone Date Box (Tanggal Tercapai 40 Jam Pertama) */}
        {currentSummary.isCompliant && currentSummary.tanggalTercapai40Jam && (
          <div className="mb-3 p-3 bg-white/90 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 font-mono block">
                  Tanggal Tercapai 40 Jam Pertama:
                </span>
                <span className="text-xs font-extrabold text-emerald-950">
                  {formatIndonesianDate(currentSummary.tanggalTercapai40Jam)}
                </span>
                {currentSummary.pelatihanTercapai40Jam && (
                  <span className="text-[11px] text-slate-600 block mt-0.5 line-clamp-1">
                    Melalui: <em>"{currentSummary.pelatihanTercapai40Jam}"</em>
                  </span>
                )}
              </div>
            </div>
            <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase font-mono shrink-0">
              LULUS TARGET
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              currentSummary.isCompliant
                ? 'bg-emerald-500'
                : currentSummary.totalHours > 20
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${currentSummary.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1 font-mono">
          <span>0 JP</span>
          <span>Progres: {currentSummary.percentage}%</span>
          <span>Target: 40 JP/Tahun</span>
        </div>
      </div>

      {/* List of trainings contributing to this year */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Rincian Pelatihan Tahun {activeYear} ({currentSummary.trainings.length} Kegiatan)
          </h5>
          <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
              JP Terhitung: {currentSummary.totalHours} Jam
            </span>
            {currentSummary.totalNonJpHours > 0 && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Non-JP: {currentSummary.totalNonJpHours} Jam
              </span>
            )}
          </div>
        </div>

        {currentSummary.trainings.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada data pelatihan yang dicatat untuk tahun {activeYear}.
          </div>
        ) : (
          <div className="space-y-2">
            {currentSummary.trainings.map((t, idx) => {
              const isJP = t.jenisPerhitungan !== 'Non JP';
              return (
                <div
                  key={t.id || idx}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs">{t.namaPelatihan}</span>
                      
                      {/* Badge JP vs Non JP */}
                      {isJP ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          JP (Dihitung 40 Jam)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                          Non JP (Tidak Dihitung)
                        </span>
                      )}

                      {t.kategori && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200">
                          {t.kategori}
                        </span>
                      )}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status || 'Selesai'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-3">
                      <span><strong>Penyelenggara:</strong> {t.penyelenggara}</span>
                      {t.tanggalMulai && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {t.tanggalMulai} {t.tanggalSelesai ? `s/d ${t.tanggalSelesai}` : ''}
                        </span>
                      )}
                    </p>
                    {t.nomorSertifikat && (
                      <p className="text-[9px] text-slate-400 font-mono">
                        No. Sertifikat: {t.nomorSertifikat}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200">
                    <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg border ${
                      isJP 
                        ? 'text-indigo-700 bg-indigo-100/80 border-indigo-200'
                        : 'text-slate-600 bg-slate-200/80 border-slate-300'
                    }`}>
                      +{t.durasiJam} {isJP ? 'JP' : 'Jam (Non JP)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
