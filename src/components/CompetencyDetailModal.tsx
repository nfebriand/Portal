import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Award, 
  ExternalLink, 
  Calendar, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  GraduationCap, 
  FileCheck2, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Filter
} from 'lucide-react';
import { Employee, TrainingHistory } from '../types';
import { computeEmployeeAnnualTrainings, formatIndonesianDate } from './kepegawaian/PelatihanTahunanTracker';

interface CompetencyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  indicatorName?: string;
  periodLabel?: string;
  employees: Employee[];
  year?: number;
  selectedYear?: number;
  targetValue?: string | number;
  achievementValue?: number;
  assignedToName?: string;
  division?: string;
}

export default function CompetencyDetailModal({
  isOpen,
  onClose,
  title,
  indicatorName,
  periodLabel = 'Tahunan (2026)',
  employees = [],
  year = new Date().getFullYear(),
  selectedYear,
  targetValue = '100%',
  achievementValue,
  assignedToName,
  division
}: CompetencyDetailModalProps) {
  const activeYear = selectedYear || year || new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'non-compliant'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Active employees
  const activeEmployees = useMemo(() => {
    return employees.filter(emp => {
      const st = (emp.status || 'aktif').toLowerCase();
      return st !== 'keluar' && st !== 'pindah';
    });
  }, [employees]);

  // Unique divisions
  const divisions = useMemo(() => {
    const set = new Set<string>();
    activeEmployees.forEach(e => {
      if (e.divisi) set.add(e.divisi);
    });
    return Array.from(set);
  }, [activeEmployees]);

  // Process training metrics for each employee for the selected year
  const processedEmployees = useMemo(() => {
    return activeEmployees.map(emp => {
      const summaryMap = computeEmployeeAnnualTrainings(emp);
      const summary = summaryMap[activeYear] || {
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

      return {
        employee: emp,
        summary
      };
    });
  }, [activeEmployees, activeYear]);

  // Filtered employees
  const filteredData = useMemo(() => {
    return processedEmployees.filter(({ employee: emp, summary }) => {
      const matchesSearch = 
        !searchTerm.trim() ||
        (emp.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.nip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.divisi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.trainings.some(t => (t.namaPelatihan || '').toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'compliant' && summary.isCompliant) ||
        (statusFilter === 'non-compliant' && !summary.isCompliant);

      const matchesDiv = divisionFilter === 'all' || emp.divisi === divisionFilter;

      return matchesSearch && matchesStatus && matchesDiv;
    });
  }, [processedEmployees, searchTerm, statusFilter, divisionFilter]);

  // Overall metrics
  const metrics = useMemo(() => {
    const total = processedEmployees.length;
    const compliant = processedEmployees.filter(p => p.summary.isCompliant).length;
    const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const totalJp = processedEmployees.reduce((acc, p) => acc + p.summary.totalHours, 0);

    return {
      total,
      compliant,
      nonCompliant: total - compliant,
      percentage: pct,
      totalJp
    };
  }, [processedEmployees]);

  const toggleExpand = (id: string) => {
    setExpandedEmployeeId(prev => (prev === id ? null : id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex justify-between items-start gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 tracking-wider flex items-center gap-1 font-mono">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                Eviden Kepatuhan 40 Jam Pelatihan Pegawai (ASN)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 font-mono">
                Tahun: {activeYear}
              </span>
              {assignedToName && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white font-mono flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {assignedToName}
                </span>
              )}
              {division && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800/80 text-emerald-200 border border-emerald-700/50 font-mono flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {division}
                </span>
              )}
            </div>
            
            <h3 className="text-base font-black text-white leading-snug">
              {title}
            </h3>
            
            {indicatorName && (
              <p className="text-xs text-emerald-200 font-medium line-clamp-2">
                <span className="font-bold text-white uppercase text-[10px] mr-1">[Indikator PK]:</span>
                {indicatorName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Search Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-slate-500 font-medium">Total Pegawai:</span>
                <span className="font-black text-slate-800 font-mono">{metrics.total} ASN</span>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-semibold">Tercapai 40 JP:</span>
                <span className="font-black text-emerald-900 font-mono">{metrics.compliant} ASN ({metrics.percentage}%)</span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-700 font-semibold">Belum 40 JP:</span>
                <span className="font-black text-amber-900 font-mono">{metrics.nonCompliant} ASN</span>
              </div>

              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-indigo-700 font-semibold">Total Jam JP:</span>
                <span className="font-black text-indigo-900 font-mono">{metrics.totalJp} JP</span>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pegawai, NIP, pelatihan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium text-slate-700"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="compliant">Tercapai (≥ 40 JP)</option>
                <option value="non-compliant">Belum (‹ 40 JP)</option>
              </select>

              {divisions.length > 1 && (
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Bidang</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body / Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredData.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Tidak ada data pegawai yang cocok</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Silakan ubah kata kunci pencarian atau filter status kepatuhan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-600 font-bold text-[10px] uppercase font-mono tracking-wider border-b border-slate-200">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[200px]">Nama Pegawai & NIP</th>
                    <th className="p-3">Bidang / Unit Kerja</th>
                    <th className="p-3 text-center">Status Kepatuhan</th>
                    <th className="p-3 text-center">Akumulasi Jam (JP)</th>
                    <th className="p-3">Pelatihan & Tanggal Tercapai</th>
                    <th className="p-3 text-center">Eviden Sertifikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredData.map(({ employee: emp, summary }, idx) => {
                    const isExpanded = expandedEmployeeId === emp.id;
                    const jpCount = summary.totalHours;
                    const isCompliant = summary.isCompliant;
                    const certLinksCount = summary.trainings.filter(t => t.linkSertifikat).length;

                    return (
                      <React.Fragment key={emp.id || idx}>
                        <tr className="hover:bg-emerald-50/20 transition-colors">
                          <td className="p-3 text-center font-mono text-[11px] font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          <td className="p-3 min-w-[200px]">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{emp.nama}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                              <span>NIP: {emp.nip || emp.nik || '-'}</span>
                              {emp.jabatan && <span>• {emp.jabatan}</span>}
                            </div>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              {emp.divisi || 'Tata Usaha / Umum'}
                            </span>
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            {isCompliant ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black font-mono">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Tercapai (100%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold font-mono">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                {summary.percentage}% (Kurang {summary.remainingHours} Jam)
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="inline-block text-center">
                              <span className="font-black text-slate-800 text-xs font-mono">
                                {jpCount} / 40 JP
                              </span>
                              <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden mx-auto">
                                <div 
                                  className={`h-full rounded-full ${isCompliant ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, (jpCount / 40) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-3 min-w-[180px]">
                            {isCompliant ? (
                              <div>
                                <p className="text-[11px] font-bold text-emerald-800 leading-tight">
                                  Tercapai: {formatIndonesianDate(summary.tanggalTercapai40Jam)}
                                </p>
                                {summary.pelatihanTercapai40Jam && (
                                  <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1" title={summary.pelatihanTercapai40Jam}>
                                    {summary.pelatihanTercapai40Jam}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Belum memenuhi akumulasi 40 JP
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleExpand(emp.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                isExpanded 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                              title="Lihat Rincian Pelatihan & Tautan Sertifikat"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>{summary.trainings.length} Pelatihan</span>
                              {certLinksCount > 0 && (
                                <span className="px-1 py-0.2 bg-white text-emerald-800 text-[8px] font-black rounded-full ml-0.5">
                                  {certLinksCount} Link
                                </span>
                              )}
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {/* Accordion Row: Detailed Trainings for this Employee */}
                        {isExpanded && (
                          <tr className="bg-emerald-50/40">
                            <td colSpan={7} className="p-4 border-y border-emerald-200">
                              <div className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                    Daftar Riwayat Pelatihan & Eviden Sertifikat - {emp.nama} ({activeYear})
                                  </h5>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    Total {summary.trainings.length} kegiatan tercatat ({summary.totalHours} JP Pelatihan)
                                  </span>
                                </div>

                                {summary.trainings.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-2">
                                    Belum ada catatan pelatihan yang diinput untuk tahun {activeYear}.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {summary.trainings.map((tr, tIdx) => {
                                      const isJp = (tr.jenisPerhitungan || '').toUpperCase() !== 'NON JP';

                                      return (
                                        <div 
                                          key={tr.id || tIdx} 
                                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-2"
                                        >
                                          <div>
                                            <div className="flex items-start justify-between gap-2">
                                              <h6 className="font-bold text-slate-800 text-[11px] leading-snug">
                                                {tr.namaPelatihan}
                                              </h6>
                                              <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono shrink-0 ${
                                                isJp ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                              }`}>
                                                {tr.durasiJam} {tr.jenisPerhitungan || 'JP'}
                                              </span>
                                            </div>

                                            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                                              {tr.penyelenggara && (
                                                <p>Penyelenggara: <strong className="text-slate-700">{tr.penyelenggara}</strong></p>
                                              )}
                                              <p>Tanggal: {tr.tanggalMulai ? formatIndonesianDate(tr.tanggalMulai) : '-'} {tr.tanggalSelesai ? `s/d ${formatIndonesianDate(tr.tanggalSelesai)}` : ''}</p>
                                              {tr.nomorSertifikat && (
                                                <p className="font-mono">No. Sertifikat: {tr.nomorSertifikat}</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Certificate Evidence Button */}
                                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                                            <span className="text-[9px] text-slate-400 font-medium">
                                              Eviden Dokumen / Sertifikat:
                                            </span>
                                            {tr.linkSertifikat ? (
                                              <a
                                                href={tr.linkSertifikat}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition-all shadow-xs"
                                                title="Buka Link Sertifikat di Google Drive"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                                Buka Sertifikat
                                              </a>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 italic">
                                                Belum ada tautan sertifikat
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <p className="text-[11px] text-slate-400 font-medium">
            Terintegrasi otomatis dengan modul Manajemen Kepegawaian & Kepatuhan 40 Jam Pelatihan SDM.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
