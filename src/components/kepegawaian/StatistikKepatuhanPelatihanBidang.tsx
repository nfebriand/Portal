import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { computeEmployeeAnnualTrainings, formatIndonesianDate } from './PelatihanTahunanTracker';
import { 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  Clock, 
  Sparkles, 
  Users, 
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface StatistikKepatuhanPelatihanBidangProps {
  employees: Employee[];
  selectedDivision?: string; // Optional filter if called inside a specific division view
  onSelectEmployee?: (employee: Employee) => void;
}

const ALL_DIVISIONS = [
  'Tata Usaha / Umum',
  'Siaran',
  'Pemberitaan',
  'Teknologi dan Media Baru',
  'Konten Media Baru',
  'Layanan Pengembangan Usaha'
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const QUARTERS = [
  { id: 'Q1', name: 'Triwulan I (Jan - Mar)', months: [1, 2, 3] },
  { id: 'Q2', name: 'Triwulan II (Apr - Jun)', months: [4, 5, 6] },
  { id: 'Q3', name: 'Triwulan III (Jul - Sep)', months: [7, 8, 9] },
  { id: 'Q4', name: 'Triwulan IV (Okt - Des)', months: [10, 11, 12] }
];

export default function StatistikKepatuhanPelatihanBidang({
  employees,
  selectedDivision,
  onSelectEmployee
}: StatistikKepatuhanPelatihanBidangProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth() + 1; // 1-12

  // Filters & State
  const [activeYear, setActiveYear] = useState<number>(currentYear);
  const [viewMode, setViewMode] = useState<'triwulan' | 'bulanan' | 'matriks'>('triwulan');
  const [filterDivision, setFilterDivision] = useState<string>(selectedDivision || 'all');

  // Compute Available Years
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([currentYear, currentYear - 1]);
    employees.forEach(emp => {
      emp.riwayatPelatihan?.forEach(tr => {
        if (tr.tahun) yearSet.add(tr.tahun);
        if (tr.tanggalMulai) {
          const y = new Date(tr.tanggalMulai).getFullYear();
          if (!isNaN(y)) yearSet.add(y);
        }
      });
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [employees, currentYear]);

  // Core Compliance Calculation Per Bidang & Time Period (Monthly & Quarterly)
  const complianceAnalytics = useMemo(() => {
    // 1. Map each employee's annual data for activeYear
    const employeeData = employees.map(emp => {
      const annuals = computeEmployeeAnnualTrainings(emp);
      const yearSummary = annuals[activeYear] || {
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

      // Calculate cumulative JP per month (1 to 12)
      const monthlyCumulativeJP: number[] = new Array(12).fill(0);
      const monthlyIncrementalJP: number[] = new Array(12).fill(0);

      // Only evaluate JP trainings for this year
      const jpList = (yearSummary.jpTrainings || []).slice().sort((a, b) => {
        const dateA = a.tanggalSelesai || a.tanggalMulai || `${activeYear}-01-01`;
        const dateB = b.tanggalSelesai || b.tanggalMulai || `${activeYear}-01-01`;
        return dateA.localeCompare(dateB);
      });

      jpList.forEach(tr => {
        const dStr = tr.tanggalSelesai || tr.tanggalMulai;
        let mIdx = 0; // 0 = Jan
        if (dStr) {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            mIdx = Math.max(0, Math.min(11, d.getMonth()));
          }
        }
        const hours = Number(tr.durasiJam) || 0;
        monthlyIncrementalJP[mIdx] += hours;
      });

      // Cumulative running sum across months
      let runningSum = 0;
      for (let m = 0; m < 12; m++) {
        runningSum += monthlyIncrementalJP[m];
        monthlyCumulativeJP[m] = runningSum;
      }

      return {
        employee: emp,
        division: emp.divisi || 'Tata Usaha / Umum',
        yearSummary,
        monthlyCumulativeJP,
        monthlyIncrementalJP
      };
    });

    // 2. Aggregate by Division for Monthly & Quarterly
    const divisionStats: Record<string, {
      totalEmployees: number;
      compliantEmployeesCount: number;
      complianceRate: number;
      totalJPHours: number;
      avgJP: number;
      monthlyComplianceCount: number[]; // Count of employees compliant at month m
      monthlyCompliancePct: number[]; // Pct of employees compliant at month m
      quarterlyComplianceCount: number[]; // Count of employees compliant at Q1, Q2, Q3, Q4
      quarterlyCompliancePct: number[]; // Pct of employees compliant at Q1, Q2, Q3, Q4
      quarterlyJPHours: number[]; // Total JP acquired in Q
      employees: typeof employeeData;
    }> = {};

    ALL_DIVISIONS.forEach(div => {
      divisionStats[div] = {
        totalEmployees: 0,
        compliantEmployeesCount: 0,
        complianceRate: 0,
        totalJPHours: 0,
        avgJP: 0,
        monthlyComplianceCount: new Array(12).fill(0),
        monthlyCompliancePct: new Array(12).fill(0),
        quarterlyComplianceCount: new Array(4).fill(0),
        quarterlyCompliancePct: new Array(4).fill(0),
        quarterlyJPHours: new Array(4).fill(0),
        employees: []
      };
    });

    employeeData.forEach(item => {
      const div = divisionStats[item.division] ? item.division : 'Tata Usaha / Umum';
      const stats = divisionStats[div];

      stats.totalEmployees++;
      stats.employees.push(item);
      stats.totalJPHours += item.yearSummary.totalHours;
      if (item.yearSummary.isCompliant) {
        stats.compliantEmployeesCount++;
      }

      // Check monthly cumulative compliance
      for (let m = 0; m < 12; m++) {
        if (item.monthlyCumulativeJP[m] >= 40) {
          stats.monthlyComplianceCount[m]++;
        }
      }

      // Check quarterly cumulative compliance (end of Q1 = mIdx 2, Q2 = mIdx 5, Q3 = mIdx 8, Q4 = mIdx 11)
      const qEndIndices = [2, 5, 8, 11];
      qEndIndices.forEach((endMonthIdx, qIdx) => {
        if (item.monthlyCumulativeJP[endMonthIdx] >= 40) {
          stats.quarterlyComplianceCount[qIdx]++;
        }
        // Quarterly JP sum
        const startMonthIdx = qIdx * 3;
        let qHours = 0;
        for (let m = startMonthIdx; m <= endMonthIdx; m++) {
          qHours += item.monthlyIncrementalJP[m];
        }
        stats.quarterlyJPHours[qIdx] += qHours;
      });
    });

    // Compute percentages
    ALL_DIVISIONS.forEach(div => {
      const s = divisionStats[div];
      s.complianceRate = s.totalEmployees > 0 ? Math.round((s.compliantEmployeesCount / s.totalEmployees) * 100) : 0;
      s.avgJP = s.totalEmployees > 0 ? Math.round((s.totalJPHours / s.totalEmployees) * 10) / 10 : 0;

      for (let m = 0; m < 12; m++) {
        s.monthlyCompliancePct[m] = s.totalEmployees > 0 ? Math.round((s.monthlyComplianceCount[m] / s.totalEmployees) * 100) : 0;
      }

      for (let q = 0; q < 4; q++) {
        s.quarterlyCompliancePct[q] = s.totalEmployees > 0 ? Math.round((s.quarterlyComplianceCount[q] / s.totalEmployees) * 100) : 0;
      }
    });

    // Overall Totals
    const totalInstansiEmployees = employeeData.length;
    const totalInstansiCompliant = employeeData.filter(d => d.yearSummary.isCompliant).length;
    const overallComplianceRate = totalInstansiEmployees > 0 ? Math.round((totalInstansiCompliant / totalInstansiEmployees) * 100) : 0;
    const totalInstansiJP = employeeData.reduce((acc, d) => acc + d.yearSummary.totalHours, 0);
    const avgInstansiJP = totalInstansiEmployees > 0 ? Math.round((totalInstansiJP / totalInstansiEmployees) * 10) / 10 : 0;

    // Monthly Chart Data (12 Months)
    const monthlyChartData = MONTH_NAMES.map((mName, mIdx) => {
      const row: any = { bulan: mName, bulanShort: mName.slice(0, 3) };
      let totalCompliantMonth = 0;

      ALL_DIVISIONS.forEach(div => {
        const pct = divisionStats[div].monthlyCompliancePct[mIdx];
        row[div] = pct;
        totalCompliantMonth += divisionStats[div].monthlyComplianceCount[mIdx];
      });

      row['Rata-rata Instansi'] = totalInstansiEmployees > 0 ? Math.round((totalCompliantMonth / totalInstansiEmployees) * 100) : 0;
      return row;
    });

    // Quarterly Chart Data (4 Quarters)
    const quarterlyChartData = QUARTERS.map((q, qIdx) => {
      const row: any = { triwulan: q.id, label: q.name };
      let totalCompliantQ = 0;

      ALL_DIVISIONS.forEach(div => {
        const pct = divisionStats[div].quarterlyCompliancePct[qIdx];
        row[div] = pct;
        totalCompliantQ += divisionStats[div].quarterlyComplianceCount[qIdx];
      });

      row['Rata-rata Instansi'] = totalInstansiEmployees > 0 ? Math.round((totalCompliantQ / totalInstansiEmployees) * 100) : 0;
      return row;
    });

    // Compliant Milestone Employees List
    const compliantMilestoneList = employeeData
      .filter(d => d.yearSummary.isCompliant && d.yearSummary.tanggalTercapai40Jam)
      .sort((a, b) => {
        const dateA = a.yearSummary.tanggalTercapai40Jam || '';
        const dateB = b.yearSummary.tanggalTercapai40Jam || '';
        return dateA.localeCompare(dateB);
      });

    return {
      divisionStats,
      totalInstansiEmployees,
      totalInstansiCompliant,
      overallComplianceRate,
      totalInstansiJP,
      avgInstansiJP,
      monthlyChartData,
      quarterlyChartData,
      compliantMilestoneList
    };
  }, [employees, activeYear]);

  // Color mapping per division for charts & badges
  const divisionColors: Record<string, string> = {
    'Tata Usaha / Umum': '#4f46e5', // indigo
    'Siaran': '#0ea5e9', // sky
    'Pemberitaan': '#10b981', // emerald
    'Teknologi dan Media Baru': '#8b5cf6', // purple
    'Konten Media Baru': '#f59e0b', // amber
    'Layanan Pengembangan Usaha': '#ec4899' // pink
  };

  const displayedDivisions = filterDivision === 'all'
    ? ALL_DIVISIONS
    : ALL_DIVISIONS.filter(d => d === filterDivision);

  return (
    <div className="space-y-6">
      
      {/* Header Widget & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-widest font-mono">
                BIDANG TATA USAHA & SDM
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Standar Min. 40 JP / Tahun</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Award className="w-6 h-6 text-indigo-400" />
              Statistik Pencapaian Kepatuhan 40 Jam Pelatihan SDM
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Monitoring persentase kepatuhan pelatihan Jam Pelajaran (JP) ASN terintegrasi 6 bidang kerja, direkapitulasi secara berkala per bulan dan per triwulan.
            </p>
          </div>

          {/* Controls: Year & View Mode */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-md">
            {/* Year Selector */}
            <div className="flex items-center gap-1 px-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Tahun:</span>
              <select
                value={activeYear}
                onChange={(e) => setActiveYear(Number(e.target.value))}
                className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('triwulan')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'triwulan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rekap Triwulan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('bulanan')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'bulanan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rekap Bulanan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matriks')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'matriks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Matriks Komparasi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PK Competency Indicator Integration Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-4 md:p-5 text-white shadow-md border border-purple-400/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-400/30 text-purple-300 shrink-0 mt-0.5">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-400/20">
                ⚡ Integrasi Otomatis Perjanjian Kinerja (PK)
              </span>
            </div>
            <h4 className="text-sm font-black text-white mt-1">
              Sumber Data Resmi Indikator "Persentase pelaksanaan pengembangan kompetensi pegawai"
            </h4>
            <p className="text-xs text-purple-200 mt-0.5 max-w-3xl leading-relaxed">
              Setiap kali pegawai mencapai milestone 40 jam pelajaran (JP) pertama kali, sistem otomatis mengakumulasi capaian tersebut ke dalam realisasi bulanan Perjanjian Kinerja di Bagian Tata Usaha dan Kepala Stasiun ({complianceAnalytics.overallComplianceRate}% capaian saat ini).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
          <div className="text-right">
            <p className="text-[10px] text-purple-200 uppercase font-semibold">Capaian Terhubung PK</p>
            <p className="text-lg font-black text-emerald-400">{complianceAnalytics.overallComplianceRate}% ({complianceAnalytics.totalInstansiCompliant}/{complianceAnalytics.totalInstansiEmployees} ASN)</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Overall Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Tingkat Kepatuhan ASN</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {complianceAnalytics.overallComplianceRate}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({complianceAnalytics.totalInstansiCompliant}/{complianceAnalytics.totalInstansiEmployees} ASN)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                complianceAnalytics.overallComplianceRate >= 80 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${complianceAnalytics.overallComplianceRate}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Target: Min. 40 JP per Pegawai</p>
        </div>

        {/* Realisasi Total JP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Akumulasi JP</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-700 font-mono">
              {complianceAnalytics.totalInstansiJP}
            </span>
            <span className="text-xs font-bold text-slate-500">Jam Pelajaran</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            Rata-rata <strong>{complianceAnalytics.avgInstansiJP} JP</strong> / Pegawai
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Hanya menghitung pelatihan terverifikasi JP</p>
        </div>

        {/* Unit Tata Usaha Specific */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Bidang Tata Usaha</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          {(() => {
            const tuStats = complianceAnalytics.divisionStats['Tata Usaha / Umum'];
            return (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {tuStats.complianceRate}%
                  </span>
                  <span className="text-xs font-bold text-purple-700">
                    ({tuStats.compliantEmployeesCount}/{tuStats.totalEmployees} Pegawai)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${tuStats.complianceRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Total {tuStats.totalJPHours} JP terealisasi</p>
              </>
            );
          })()}
        </div>

        {/* Milestone Pegawai Lulus Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Milestone 40 JP Terpenuhi</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 font-mono">
              {complianceAnalytics.compliantMilestoneList.length}
            </span>
            <span className="text-xs font-bold text-slate-500">Pegawai Sudah Tuntas</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            Tercatat memiliki tanggal capaian 40 JP
          </p>
          <p className="text-[10px] text-emerald-600 font-bold font-mono">✓ Kepatuhan SAKIP & PermenPAN</p>
        </div>

      </div>

      {/* VIEW MODE 1: REKAP TRIWULAN (Q1 - Q4) */}
      {viewMode === 'triwulan' && (
        <div className="space-y-6">
          
          {/* Chart Per Triwulan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Grafik Progres Kepatuhan 40 JP Per Triwulan ({activeYear})
                </h4>
                <p className="text-[10px] text-slate-400">Persentase kumulatif pegawai yang telah mencapai target 40 JP di setiap akhir triwulan</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                  Q1 s/d Q4 • Target 100%
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceAnalytics.quarterlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="triwulan" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(value: any) => [`${value}% Patuh`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  {ALL_DIVISIONS.map(div => (
                    <Bar key={div} dataKey={div} fill={divisionColors[div]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards for each Triwulan (Q1, Q2, Q3, Q4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUARTERS.map((q, qIdx) => {
              // Calculate instansi total in this Q
              let qTotalCompliant = 0;
              let qTotalEmployees = complianceAnalytics.totalInstansiEmployees;
              ALL_DIVISIONS.forEach(div => {
                qTotalCompliant += complianceAnalytics.divisionStats[div].quarterlyComplianceCount[qIdx];
              });
              const qRate = qTotalEmployees > 0 ? Math.round((qTotalCompliant / qTotalEmployees) * 100) : 0;

              return (
                <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-extrabold font-mono uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {q.id}
                      </span>
                      <h5 className="font-bold text-slate-800 text-xs mt-1">{q.name}</h5>
                    </div>
                    <span className="text-xl font-black font-mono text-slate-900">{qRate}%</span>
                  </div>

                  <div className="space-y-2">
                    {ALL_DIVISIONS.map(div => {
                      const divData = complianceAnalytics.divisionStats[div];
                      const pct = divData.quarterlyCompliancePct[qIdx];
                      const count = divData.quarterlyComplianceCount[qIdx];

                      return (
                        <div key={div} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-medium text-slate-700 truncate max-w-[140px]" title={div}>
                              {div}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {pct}% <span className="text-slate-400 font-normal">({count}/{divData.totalEmployees})</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: divisionColors[div]
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW MODE 2: REKAP BULANAN (12 BULAN) */}
      {viewMode === 'bulanan' && (
        <div className="space-y-6">
          
          {/* Monthly Trend Area Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Tren Akumulasi Kepatuhan Bulanan 6 Bidang (Januari - Desember {activeYear})
                </h4>
                <p className="text-[10px] text-slate-400">Kurva peningkatan persentase kepatuhan ASN yang mencapai batas 40 JP setiap bulannya</p>
              </div>
              <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                12 Bulan Evaluasi
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceAnalytics.monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="bulanShort" tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}% Patuh`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  {ALL_DIVISIONS.map(div => (
                    <Line
                      key={div}
                      type="monotone"
                      dataKey={div}
                      stroke={divisionColors[div]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="Rata-rata Instansi"
                    stroke="#0f172a"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 12 Months Mini Grid Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Tabel Rekap Kepatuhan Bulanan 6 Bidang ({activeYear})
            </h5>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-3 py-2.5">Bidang / Unit</th>
                    {MONTH_NAMES.map((m, idx) => (
                      <th key={m} className="px-2 py-2.5 text-center font-mono">
                        {m.slice(0, 3)}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-mono">Akhir Thn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_DIVISIONS.map(div => {
                    const stats = complianceAnalytics.divisionStats[div];
                    return (
                      <tr key={div} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: divisionColors[div] }}
                          />
                          <span className="truncate max-w-[160px]">{div}</span>
                        </td>
                        {MONTH_NAMES.map((_, mIdx) => {
                          const pct = stats.monthlyCompliancePct[mIdx];
                          return (
                            <td key={mIdx} className="px-2 py-2.5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                pct >= 80 ? 'bg-emerald-100 text-emerald-800' : pct > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'
                              }`}>
                                {pct}%
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-right">
                          <span className="font-mono font-black text-xs text-slate-900">
                            {stats.complianceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW MODE 3: MATRIKS KOMPARASI 6 BIDANG */}
      {viewMode === 'matriks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Matriks Evaluasi Kepatuhan Pelatihan 6 Bidang Kerja
              </h4>
              <p className="text-[10px] text-slate-400">Rangkuman triwulan, akumulasi jam pelajaran (JP), dan status kepatuhan target 40 Jam/Tahun</p>
            </div>
            <span className="text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg">
              Tahun {activeYear}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Bidang Kerja</th>
                  <th className="px-4 py-3 text-center">Total SDM</th>
                  <th className="px-4 py-3 text-center">Capaian Q1</th>
                  <th className="px-4 py-3 text-center">Capaian Q2</th>
                  <th className="px-4 py-3 text-center">Capaian Q3</th>
                  <th className="px-4 py-3 text-center">Capaian Q4</th>
                  <th className="px-4 py-3 text-center">Total JP Terealisasi</th>
                  <th className="px-4 py-3 text-center">Rata-rata JP</th>
                  <th className="px-4 py-3 text-right">Status Kepatuhan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_DIVISIONS.map(div => {
                  const s = complianceAnalytics.divisionStats[div];
                  const q1 = s.quarterlyCompliancePct[0];
                  const q2 = s.quarterlyCompliancePct[1];
                  const q3 = s.quarterlyCompliancePct[2];
                  const q4 = s.quarterlyCompliancePct[3];

                  return (
                    <tr key={div} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-md shrink-0"
                            style={{ backgroundColor: divisionColors[div] }}
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{div}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.compliantEmployeesCount} dari {s.totalEmployees} Pegawai Patuh</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800 font-mono">
                        {s.totalEmployees} ASN
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q1}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q2}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q3}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q4}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-black text-indigo-700">
                        {s.totalJPHours} JP
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                        {s.avgJP} JP/org
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {s.complianceRate >= 80 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {s.complianceRate}% (Sangat Baik)
                          </span>
                        ) : s.complianceRate >= 50 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-[10px]">
                            {s.complianceRate}% (Progresif)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            {s.complianceRate}% (Perlu Akselerasi)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Section: Daftar Pegawai Yang Telah Mencapai 40 Jam Pertama */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Daftar Pegawai Telah Mencapai 40 JP Pertama (Tahun {activeYear})
            </h4>
            <p className="text-[10px] text-slate-400">
              Menampilkan nama ASN, unit bidang kerja, total jam terakumulasi, serta tanggal tercapainya 40 jam pertama.
            </p>
          </div>
          <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {complianceAnalytics.compliantMilestoneList.length} ASN Tuntas
          </span>
        </div>

        {complianceAnalytics.compliantMilestoneList.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
            Belum ada pegawai yang mencapai 40 JP pada tahun {activeYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {complianceAnalytics.compliantMilestoneList.map((item) => {
              const emp = item.employee;
              const sum = item.yearSummary;

              let fullName = emp.nama;
              if (emp.gelarDepan) fullName = `${emp.gelarDepan} ${fullName}`;
              if (emp.gelarBelakang) fullName = `${fullName}, ${emp.gelarBelakang}`;

              return (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                  className="p-3.5 bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200/80 rounded-xl transition-all space-y-2 cursor-pointer shadow-2xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIP: {emp.nip || '-'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-black text-[10px]">
                      {sum.totalHours} JP
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{emp.divisi}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-emerald-800 font-bold font-mono">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Tercapai: {formatIndonesianDate(sum.tanggalTercapai40Jam)}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
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
