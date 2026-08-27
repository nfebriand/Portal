import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { computeEmployeeAnnualTrainings } from './PelatihanTahunanTracker';
import { getInitials, getAvatarColor } from '../../utils/roleHelper';
import { 
  Users, 
  Award, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  UserPlus, 
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Clock,
  UserCheck
} from 'lucide-react';

interface RekapitulasiKepegawaianProps {
  employees: Employee[];
  onSelectEmployee: (employee: Employee) => void;
  onOpenAddModal: () => void;
  onNavigateToSettingsTab: () => void;
  canAddEmployee?: boolean;
  canViewPengaturanTab?: boolean;
  canViewPelatihan40Jam?: boolean;
}

export default function RekapitulasiKepegawaian({
  employees,
  onSelectEmployee,
  onOpenAddModal,
  onNavigateToSettingsTab,
  canAddEmployee = true,
  canViewPengaturanTab = true,
  canViewPelatihan40Jam = true
}: RekapitulasiKepegawaianProps) {
  const currentYear = new Date().getFullYear();

  // Search & Filter State for Rekapitulasi Employee Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 20;

  // 1. Employee Status & Demographic Calculations
  const stats = useMemo(() => {
    let aktif = 0;
    let pindah = 0;
    let keluar = 0;

    let fungsional = 0;
    let struktural = 0;

    let lakiLaki = 0;
    let perempuan = 0;

    const jabatanCount: Record<string, number> = {
      'Kepala Satker': 0,
      'Ketua Bidang': 0,
      'Admin Bidang': 0,
      'Pengelola': 0,
      'Staf': 0
    };

    const divisionCount: Record<string, number> = {
      'Tata Usaha / Umum': 0,
      'Siaran': 0,
      'Pemberitaan': 0,
      'Teknologi dan Media Baru': 0,
      'Konten Media Baru': 0,
      'Layanan Pengembangan Usaha': 0
    };

    const divisionGenderCount: Record<string, { l: number; p: number }> = {
      'Tata Usaha / Umum': { l: 0, p: 0 },
      'Siaran': { l: 0, p: 0 },
      'Pemberitaan': { l: 0, p: 0 },
      'Teknologi dan Media Baru': { l: 0, p: 0 },
      'Konten Media Baru': { l: 0, p: 0 },
      'Layanan Pengembangan Usaha': { l: 0, p: 0 }
    };

    const pendidikanCount: Record<string, number> = {
      'SMA': 0,
      'D3': 0,
      'S1': 0,
      'S2': 0,
      'S3': 0
    };

    const golDarahCount: Record<string, number> = {
      'A': 0,
      'B': 0,
      'AB': 0,
      'O': 0,
      'Lainnya': 0
    };

    let trainingCompliantCount = 0;

    employees.forEach(emp => {
      // Status
      const st = (emp.status || 'aktif')?.toLowerCase();
      if (st === 'aktif') aktif++;
      else if (st === 'pindah') pindah++;
      else if (st === 'keluar') keluar++;
      else aktif++;

      // Jalur Jabatan
      const jj = (emp.jenisJabatan || 'fungsional')?.toLowerCase();
      if (jj === 'struktural') struktural++;
      else fungsional++;

      // Jenis Kelamin
      const jk = emp.jenisKelamin || 'Laki-laki';
      if (jk === 'Perempuan') {
        perempuan++;
        if (divisionGenderCount[emp.divisi]) divisionGenderCount[emp.divisi].p++;
      } else {
        lakiLaki++;
        if (divisionGenderCount[emp.divisi]) divisionGenderCount[emp.divisi].l++;
      }

      // Jabatan
      const jb = (emp.jabatan || 'staf')?.toLowerCase();
      if (jb.includes('kepala') || jb.includes('satker')) jabatanCount['Kepala Satker']++;
      else if (jb.includes('ketua') || jb.includes('bidang')) jabatanCount['Ketua Bidang']++;
      else if (jb.includes('admin')) jabatanCount['Admin Bidang']++;
      else if (jb.includes('pengelola')) jabatanCount['Pengelola']++;
      else jabatanCount['Staf']++;

      // Divisi
      if (divisionCount[emp.divisi] !== undefined) {
        divisionCount[emp.divisi]++;
      }

      // Pendidikan
      const jp = emp.jenjangPendidikan || 'S1';
      if (pendidikanCount[jp] !== undefined) {
        pendidikanCount[jp]++;
      }

      // Gol Darah
      const gd = emp.golDarah || '-';
      if (gd.includes('A') && !gd.includes('B')) golDarahCount['A']++;
      else if (gd.includes('B') && !gd.includes('A')) golDarahCount['B']++;
      else if (gd.includes('AB')) golDarahCount['AB']++;
      else if (gd.includes('O')) golDarahCount['O']++;
      else golDarahCount['Lainnya']++;

      // Pelatihan 40 Jam / Tahun
      const annuals = computeEmployeeAnnualTrainings(emp);
      const currYearSummary = annuals[currentYear];
      if (currYearSummary && currYearSummary.isCompliant) {
        trainingCompliantCount++;
      }
    });

    const total = employees.length;
    const trainingComplianceRate = total > 0 ? Math.round((trainingCompliantCount / total) * 100) : 0;
    const lakiLakiPct = total > 0 ? Math.round((lakiLaki / total) * 100) : 0;
    const perempuanPct = total > 0 ? Math.round((perempuan / total) * 100) : 0;

    return {
      total,
      aktif,
      pindah,
      keluar,
      fungsional,
      struktural,
      lakiLaki,
      perempuan,
      lakiLakiPct,
      perempuanPct,
      jabatanCount,
      divisionCount,
      divisionGenderCount,
      pendidikanCount,
      golDarahCount,
      trainingCompliantCount,
      trainingComplianceRate
    };
  }, [employees, currentYear]);

  // 2. Filtered & Paginated Employees List (20 per page)
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery?.toLowerCase().trim();
      const matchSearch = !q || (
        (emp.nama || "")?.toLowerCase().includes(q) ||
        (emp.nip && (emp.nip || "")?.toLowerCase().includes(q)) ||
        (emp.nik && (emp.nik || "")?.toLowerCase().includes(q)) ||
        (emp.jabatan && (emp.jabatan || "")?.toLowerCase().includes(q)) ||
        (emp.divisi && (emp.divisi || "")?.toLowerCase().includes(q))
      );

      const matchDiv = selectedDivision === 'all' || emp.divisi === selectedDivision;
      const matchStat = selectedStatus === 'all' || (emp.status || 'aktif')?.toLowerCase() === selectedStatus?.toLowerCase();
      const matchGen = selectedGender === 'all' || emp.jenisKelamin === selectedGender;

      return matchSearch && matchDiv && matchStat && matchGen;
    });
  }, [employees, searchQuery, selectedDivision, selectedStatus, selectedGender]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleDivisionFilter = (val: string) => {
    setSelectedDivision(val);
    setCurrentPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  const handleGenderFilter = (val: string) => {
    setSelectedGender(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest font-mono">
                DASHBOARD EKSEKUTIF SDM
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tahun {currentYear}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Rekapitulasi Kepegawaian & Kinerja SDM
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pemantauan terpadu data pegawai, statistik demografi gender, status struktural/fungsional, persebaran 6 bidang kerja, dan kepatuhan pelatihan tahunan minimal 40 Jam Pelajaran (JP).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {canAddEmployee && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Pegawai Baru</span>
              </button>
            )}
            {canViewPengaturanTab && (
              <button
                onClick={onNavigateToSettingsTab}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition-all cursor-pointer"
              >
                <span>Pengaturan Pegawai</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: Key Executive Indicators (5 Cards including Gender Statistics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Pegawai Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Total Pegawai
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {stats.total}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {stats.aktif} Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-medium">
              <span>{stats.pindah} Pindah</span>
              <span>•</span>
              <span>{stats.keluar} Keluar/Pensiun</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Rasio Status Aktif</span>
            <span className="font-bold text-slate-800">
              {stats.total > 0 ? Math.round((stats.aktif / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* STATISTIK BY JENIS KELAMIN CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Statistik Gender
            </span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-sky-600 font-mono">{stats.lakiLaki}</span>
                <span className="text-[10px] font-bold text-sky-700 uppercase">L ({stats.lakiLakiPct}%)</span>
              </div>
              <span className="text-slate-300 font-light text-xl">/</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-500 font-mono">{stats.perempuan}</span>
                <span className="text-[10px] font-bold text-rose-600 uppercase">P ({stats.perempuanPct}%)</span>
              </div>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden flex">
              <div
                className="bg-sky-500 h-full transition-all"
                style={{ width: `${stats.lakiLakiPct}%` }}
                title={`Laki-laki: ${stats.lakiLaki} orang (${stats.lakiLakiPct}%)`}
              />
              <div
                className="bg-rose-400 h-full transition-all"
                style={{ width: `${stats.perempuanPct}%` }}
                title={`Perempuan: ${stats.perempuan} orang (${stats.perempuanPct}%)`}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Komposisi Gender</span>
            <span className="font-bold text-slate-800">
              {stats.lakiLaki >= stats.perempuan ? 'Mayoritas L' : 'Mayoritas P'}
            </span>
          </div>
        </div>

        {/* Kepatuhan Pelatihan 40 Jam / Tahun OR Status Keaktifan Pegawai */}
        {canViewPelatihan40Jam ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Diklat 40 JP/Thn
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {stats.trainingComplianceRate}%
                </span>
                <span className="text-xs font-bold text-slate-500">
                  ({stats.trainingCompliantCount}/{stats.total})
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${stats.trainingComplianceRate}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Target Tahunan</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Min. 40 JP
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Status Keaktifan
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {stats.aktif}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Pegawai Aktif
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: stats.total > 0 ? `${(stats.aktif / stats.total) * 100}%` : '100%' }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Non-Aktif/Pindah</span>
              <span className="font-bold text-slate-700">
                {stats.pindah + stats.keluar} Orang
              </span>
            </div>
          </div>
        )}

        {/* Jalur Jabatan: Struktural vs Fungsional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Jalur Jabatan
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {stats.fungsional}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Fungsional</span>
              </div>
              <span className="text-slate-300 font-light text-2xl">/</span>
              <div>
                <span className="text-2xl font-black text-indigo-700 font-mono">
                  {stats.struktural}
                </span>
                <span className="text-[10px] text-indigo-600 uppercase font-bold block">Struktural</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Dominasi Formasi</span>
            <span className="font-bold text-slate-800">
              {stats.fungsional >= stats.struktural ? 'Fungsional' : 'Struktural'}
            </span>
          </div>
        </div>

        {/* Jenjang Kualifikasi Akademik */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Sarjana (S1+)
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            {(() => {
              const highEdu = (stats.pendidikanCount['S1'] || 0) + (stats.pendidikanCount['S2'] || 0) + (stats.pendidikanCount['S3'] || 0);
              const highEduPct = stats.total > 0 ? Math.round((highEdu / stats.total) * 100) : 0;
              return (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                      {highEduPct}%
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      ({highEdu} Sarjana)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    S1: {stats.pendidikanCount['S1']} • S2: {stats.pendidikanCount['S2']} • D3: {stats.pendidikanCount['D3']}
                  </p>
                </div>
              );
            })()}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Kualifikasi SDM</span>
            <span className="font-bold text-purple-700">Terpenuhi</span>
          </div>
        </div>

      </div>

      {/* Row 2: Persebaran Bidang & Detail Demografi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Persebaran Pegawai Per 6 Bidang Kerja */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {canViewPelatihan40Jam 
                  ? 'Persebaran Pegawai & Kepatuhan Pelatihan 6 Bidang' 
                  : 'Persebaran Pegawai 6 Bidang Kerja'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {canViewPelatihan40Jam 
                  ? 'Distribusi jumlah SDM, proporsi gender, dan realisasi kepatuhan 40 JP per unit kerja'
                  : 'Distribusi jumlah SDM dan proporsi gender per unit kerja'}
              </p>
            </div>
            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
              Tahun {currentYear}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.divisionCount).map(([divName, rawCount]) => {
              const count = Number(rawCount) || 0;
              const divEmps = employees.filter(e => e.divisi === divName);
              const divCompliant = divEmps.filter(e => {
                const a = computeEmployeeAnnualTrainings(e);
                return a[currentYear]?.isCompliant;
              }).length;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const compliantPct = count > 0 ? Math.round((divCompliant / count) * 100) : 0;
              const genInfo = stats.divisionGenderCount[divName] || { l: 0, p: 0 };

              return (
                <div key={divName} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{divName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({genInfo.l} L / {genInfo.p} P)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-slate-600">
                        <strong>{count}</strong> Pegawai ({pct}%)
                      </span>
                      {canViewPelatihan40Jam && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className={compliantPct >= 70 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            {divCompliant}/{count} Patuh 40 JP ({compliantPct}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`grid ${canViewPelatihan40Jam ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                        <span>Porsi SDM</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {canViewPelatihan40Jam && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                          <span>Kepatuhan 40 JP</span>
                          <span>{compliantPct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${compliantPct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${compliantPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Rekap Jabatan & Gol Darah */}
        <div className="space-y-6">
          
          {/* Distribusi Jabatan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Komposisi Jabatan Struktural & Pelaksana
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(stats.jabatanCount).map(([jName, jCount]) => (
                <div key={jName} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-600 font-medium">{jName}</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {jCount} Orang
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Golongan Darah */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Data Golongan Darah
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              {['A', 'B', 'AB', 'O'].map(gol => (
                <div key={gol} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                  <span className="text-xs font-black text-rose-700 block font-mono">{gol}</span>
                  <span className="text-xs font-bold text-slate-700 mt-1 block">
                    {stats.golDarahCount[gol] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Row 3: DAFTAR LIST PEGAWAI DENGAN SEARCH & PAGINATION (20 PEGAWAI PER HALAMAN) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Daftar Pegawai & Kinerja SDM ({filteredEmployees.length} Pegawai)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tampilan rekapitulasi data profil dan kepatuhan pelatihan tahunan per pegawai (20 pegawai per halaman).
            </p>
          </div>
          <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, NIK, jabatan..."
              value={searchQuery || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600 transition-all font-medium"
            />
          </div>

          {/* Division Filter */}
          <div>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600 transition-all font-medium"
            >
              <option value="all">Semua Bidang / Divisi</option>
              <option value="Tata Usaha / Umum">Tata Usaha / Umum</option>
              <option value="Siaran">Siaran</option>
              <option value="Pemberitaan">Pemberitaan</option>
              <option value="Teknologi dan Media Baru">Teknologi & Media Baru</option>
              <option value="Konten Media Baru">Konten Media Baru</option>
              <option value="Layanan Pengembangan Usaha">Layanan Pengembangan Usaha</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600 transition-all font-medium"
            >
              <option value="all">Semua Status Pegawai</option>
              <option value="aktif">Aktif</option>
              <option value="pindah">Pindah</option>
              <option value="keluar">Keluar / Pensiun</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => handleGenderFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600 transition-all font-medium"
            >
              <option value="all">Semua Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki ({stats.lakiLaki})</option>
              <option value="Perempuan">Perempuan ({stats.perempuan})</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Gender & NIK</th>
                <th className="py-3 px-4">Bidang Kerja</th>
                <th className="py-3 px-4">Jabatan & Jalur</th>
                <th className="py-3 px-4">Pendidikan</th>
                <th className="py-3 px-4">Status</th>
                {canViewPelatihan40Jam && (
                  <th className="py-3 px-4">Diklat 40 JP ({currentYear})</th>
                )}
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={canViewPelatihan40Jam ? 8 : 7} className="py-10 text-center text-slate-400 italic">
                    Tidak ada data pegawai yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const annuals = computeEmployeeAnnualTrainings(emp);
                  const currTr = annuals[currentYear];
                  const totalJP = currTr ? currTr.totalHours : 0;
                  const isCompliant = currTr ? currTr.isCompliant : false;
                  const st = (emp.status || 'aktif')?.toLowerCase();

                  return (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectEmployee(emp)}
                    >
                      {/* Pegawai Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const pal = getAvatarColor(emp.nama);
                            return (
                              <div className={`w-8 h-8 rounded-xl ${pal.bg} ${pal.text} ${pal.border} border font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                                {getInitials(emp.nama)}
                              </div>
                            );
                          })()}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-snug truncate">
                              {emp.gelarDepan ? `${emp.gelarDepan} ` : ''}
                              {emp.nama}
                              {emp.gelarBelakang ? `, ${emp.gelarBelakang}` : ''}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              NIP: {emp.nip || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Gender & NIK */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          emp.jenisKelamin === 'Perempuan' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {emp.jenisKelamin || 'Laki-laki'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          NIK: {emp.nik || '-'}
                        </p>
                      </td>

                      {/* Bidang Kerja */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{emp.divisi}</span>
                      </td>

                      {/* Jabatan & Jalur */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 capitalize">{emp.jabatan || 'Staf'}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-mono">
                          {emp.jenisJabatan || 'Fungsional'} {emp.pangkatGolongan ? `• ${emp.pangkatGolongan}` : ''}
                        </p>
                      </td>

                      {/* Pendidikan */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {emp.jenjangPendidikan || 'S1'}
                        </span>
                      </td>

                      {/* Status Pegawai */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          st === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : st === 'pindah'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {st}
                        </span>
                      </td>

                      {/* Diklat 40 JP Status (Optional based on RBAC) */}
                      {canViewPelatihan40Jam && (
                        <td className="py-3 px-4">
                          {isCompliant ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {totalJP} JP (Tercapai)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 font-mono">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {totalJP}/40 JP (Kurang {40 - totalJP} JP)
                            </span>
                          )}
                        </td>
                      )}

                      {/* Action Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(emp);
                          }}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Profil</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (20 per page) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <p className="text-slate-500 text-[11px]">
              Menampilkan {Math.min(filteredEmployees.length, (currentPage - 1) * PAGE_SIZE + 1)} - {Math.min(filteredEmployees.length, currentPage * PAGE_SIZE)} dari {filteredEmployees.length} pegawai
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
