import React, { useMemo } from 'react';
import { Employee } from '../../types';
import { computeEmployeeAnnualTrainings } from './PelatihanTahunanTracker';
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
  Sparkles
} from 'lucide-react';

interface RekapitulasiKepegawaianProps {
  employees: Employee[];
  onSelectEmployee: (employee: Employee) => void;
  onOpenAddModal: () => void;
  onNavigateToSettingsTab: () => void;
}

export default function RekapitulasiKepegawaian({
  employees,
  onOpenAddModal,
  onNavigateToSettingsTab
}: RekapitulasiKepegawaianProps) {
  const currentYear = new Date().getFullYear();

  // 1. Employee Status Calculations
  const stats = useMemo(() => {
    let aktif = 0;
    let pindah = 0;
    let keluar = 0;

    let fungsional = 0;
    let struktural = 0;

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
      const st = (emp.status || 'aktif').toLowerCase();
      if (st === 'aktif') aktif++;
      else if (st === 'pindah') pindah++;
      else if (st === 'keluar') keluar++;
      else aktif++;

      // Jalur Jabatan
      const jj = (emp.jenisJabatan || 'fungsional').toLowerCase();
      if (jj === 'struktural') struktural++;
      else fungsional++;

      // Jabatan
      const jb = (emp.jabatan || 'staf').toLowerCase();
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

    return {
      total,
      aktif,
      pindah,
      keluar,
      fungsional,
      struktural,
      jabatanCount,
      divisionCount,
      pendidikanCount,
      golDarahCount,
      trainingCompliantCount,
      trainingComplianceRate
    };
  }, [employees, currentYear]);

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
              Pemantauan terpadu data pegawai, status struktural/fungsional, persebaran 6 bidang kerja, kompetensi, dan kepatuhan pelatihan tahunan minimal 40 Jam Pelajaran (JP).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pegawai Baru</span>
            </button>
            <button
              onClick={onNavigateToSettingsTab}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition-all cursor-pointer"
            >
              <span>Pengaturan Pegawai</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Key Executive Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Pegawai Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Total Pegawai Terdaftar
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

        {/* Kepatuhan Pelatihan 40 Jam / Tahun */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Kepatuhan Diklat (40 JP/Thn)
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
                ({stats.trainingCompliantCount}/{stats.total} ASN)
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
              Min. 40 Jam Pelajaran
            </span>
          </div>
        </div>

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
              {stats.fungsional >= stats.struktural ? 'Fungsional Tertentu' : 'Struktural'}
            </span>
          </div>
        </div>

        {/* Jenjang Kualifikasi Akademik */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Kualifikasi Sarjana (S1+)
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
                      ({highEdu} Sarjana/Pasca)
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
            <span className="text-slate-500">Standar Kompetensi</span>
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
                Persebaran Pegawai & Kepatuhan Pelatihan 6 Bidang
              </h3>
              <p className="text-[10px] text-slate-400">Distribusi jumlah SDM dan realisasi kepatuhan 40 JP per unit kerja</p>
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

              return (
                <div key={divName} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="font-bold text-slate-800 text-xs">{divName}</span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-slate-600">
                        <strong>{count}</strong> Pegawai ({pct}%)
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className={compliantPct >= 70 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {divCompliant}/{count} Patuh 40 JP ({compliantPct}%)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                        <span>Porsi SDM</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                        <span>Kepatuhan 40 JP</span>
                        <span>{compliantPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${compliantPct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${compliantPct}%` }} />
                      </div>
                    </div>
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

    </div>
  );
}
