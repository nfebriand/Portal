import { getGaugeColorByPercentage } from "../utils/colors";
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Layers, 
  Target, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  User,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Award as AwardIcon,
  HardDrive,
  Laptop,
  Cpu
} from 'lucide-react';
import { Employee, PerformanceAgreement, PerformanceIndicator } from '../types';

interface DashboardTmbViewProps {
  currentUser: any;
  employees: Employee[];
  agreements: PerformanceAgreement[];
  onUpdateAgreements: (agreements: PerformanceAgreement[]) => void;
}

export default function DashboardTmbView({
  currentUser,
  employees,
  agreements,
  onUpdateAgreements
}: DashboardTmbViewProps) {
  const [editingObjId, setEditingObjId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Find the Teknologi dan Media Baru (TMB) agreement
  const tmbAgreement = useMemo(() => {
    return agreements.find(a => 
      a.level === 'Ketua Tim Teknologi dan Media Baru' && 
      (a.status === 'Aktif' || a.status === 'Evaluasi')
    ) || agreements.find(a => a.level === 'Ketua Tim Teknologi dan Media Baru');
  }, [agreements]);

  const objectives = useMemo(() => {
    return tmbAgreement ? tmbAgreement.objectives : [];
  }, [tmbAgreement]);

  // TMB Employees list (divisi === 'Teknologi dan Media Baru')
  const tmbEmployees = useMemo(() => {
    return employees.filter(e => e.divisi === 'Teknologi dan Media Baru');
  }, [employees]);

  // Average Achievement percentage
  const avgAchievement = useMemo(() => {
    if (objectives.length === 0) return 0;
    let sum = 0;
    objectives.forEach(obj => {
      const targetVal = parseFloat(obj.target) || 100;
      const progress = targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
      sum += Math.min(120, Math.max(0, progress));
    });
    return Math.round(sum / objectives.length);
  }, [objectives]);

  // Update target achievement handler
  const handleUpdateAchievement = (objId: string, valueStr: string) => {
    if (!tmbAgreement) return;
    const valueNum = parseFloat(valueStr) || 0;

    const updatedObjectives = tmbAgreement.objectives.map(obj => 
      obj.id === objId ? { ...obj, achievement: valueNum } : obj
    );

    const updatedAgreements = agreements.map(ag => 
      ag.id === tmbAgreement.id ? { ...ag, objectives: updatedObjectives } : ag
    );

    onUpdateAgreements(updatedAgreements);
    setEditingObjId(null);
  };

  const isAuthorizedToEdit = useMemo(() => {
    return currentUser?.role === 'Superadmin' || 
           currentUser?.role === 'Kepala' || 
           (currentUser?.role === 'Ketua Bidang' && currentUser?.division === 'Teknik') ||
           currentUser?.name === tmbAgreement?.assignedToName;
  }, [currentUser, tmbAgreement]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/10">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-400/20 tracking-wider">
              Divisi Teknologi & Media Baru (TMB)
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Portal Kinerja Teknologi & Media Baru</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Sistem dashboard pemantauan mandiri capaian indikator kinerja utama sub-bidang pemancar, streaming digital, and keandalan infrastruktur transmisi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/50 text-right">
            <span className="text-[9px] text-slate-400 block font-mono font-bold">STATUS PK</span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">{tmbAgreement?.status || 'Draft'}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Rerata Capaian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rerata Capaian Divisi</span>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{avgAchievement}%</h3>
            <p className="text-[10px] text-slate-400">Rata-rata kumulatif IKP yang divalidasi</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* KPI 2: Total Indikator */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Indikator Kinerja Utama</span>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{objectives.length} IKP</h3>
            <p className="text-[10px] text-slate-400">Sasaran strategis tim yang aktif</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Jumlah Personel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Personel Teknik</span>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{tmbEmployees.length} Staff</h3>
            <p className="text-[10px] text-slate-400">Jumlah fungsional pranata komputer & teknik siaran</p>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Section: Objectives & Half-Circle Gauges */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-500" />
            Visualisasi Capaian Sasaran Teknologi & Media Baru (TMB)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Representasi grafis menggunakan model Half Circle Gauge untuk mengukur persentase pemenuhan target IKP.</p>
        </div>

        {objectives.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Belum ada Perjanjian Kinerja (PK) yang didaftarkan untuk divisi Teknologi & Media Baru.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((obj) => {
              const realisasiVal = obj.achievement;
              const targetVal = parseFloat(obj.target) || 100;
              const percentage = targetVal > 0 ? Math.round((realisasiVal / targetVal) * 100) : 0;
              const fillPercentage = Math.min(100, Math.max(0, percentage));
              const remaining = 100 - fillPercentage;

              const gaugeColor = getGaugeColorByPercentage(percentage);

              const gaugeData = [
                { value: fillPercentage },
                { value: remaining }
              ];

              return (
                <div 
                  key={obj.id} 
                  className="bg-slate-50/40 p-5 rounded-2xl border border-slate-150 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  {/* Indicator Header */}
                  <div className="space-y-1 text-center">
                    <span className="text-[8px] font-mono font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                      ID: {obj.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 min-h-[32px] pt-1" title={obj.indicatorName}>
                      {obj.indicatorName}
                    </h4>
                  </div>

                  {/* Half Circle Gauge Chart */}
                  <div className="relative w-full h-24 flex items-center justify-center overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 12, left: 0, right: 0, bottom: 0 }}>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="95%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={40}
                          outerRadius={56}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill={gaugeColor} />
                          <Cell fill="#e2e8f0" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Label inside the gauge */}
                    <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
                      <span className="text-base font-black text-slate-800 font-mono tracking-tight leading-none">
                        {percentage}%
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Capaian</span>
                    </div>
                  </div>

                  {/* Metrics & Editing */}
                  <div className="w-full bg-white border border-slate-150 rounded-xl p-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs divide-x divide-slate-100">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Realisasi</span>
                        {editingObjId === obj.id ? (
                          <div className="flex items-center gap-1 justify-center mt-1">
                            <input 
                              type="number" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-14 bg-slate-100 border border-slate-300 rounded text-center font-bold text-xs p-0.5"
                              placeholder="0"
                            />
                            <button 
                              onClick={() => handleUpdateAchievement(obj.id, editValue)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded p-0.5"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => setEditingObjId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded p-0.5"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className="font-extrabold text-indigo-600 font-mono text-[13px]">
                              {realisasiVal} <span className="text-[9px] font-bold text-slate-400 font-sans">{obj.unit}</span>
                            </span>
                            {isAuthorizedToEdit && (
                              <button 
                                onClick={() => { setEditingObjId(obj.id); setEditValue(realisasiVal.toString()); }}
                                className="text-[9px] text-slate-400 hover:text-indigo-600 font-bold hover:underline"
                                title="Edit Realisasi"
                              >
                                [Ubah]
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Target PK</span>
                        <span className="font-extrabold text-slate-700 font-mono text-[13px] block mt-0.5">
                          {targetVal} <span className="text-[9px] font-bold text-slate-400 font-sans">{obj.unit}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Roster list of division personnel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            Daftar Anggota Divisi Teknologi & Media Baru (TMB)
          </h3>
          <p className="text-xs text-slate-500">Anggota personel yang bertugas merawat infrastruktur, jaringan streaming, dan penyiaran stasiun.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="py-3 px-4">Nama Pegawai</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">NIP</th>
                <th className="py-3 px-4">Kualifikasi</th>
                <th className="py-3 px-4">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tmbEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {emp.nama.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{emp.nama}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{emp.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">{emp.jabatan}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{emp.nip}</td>
                  <td className="py-3 px-4 font-medium text-slate-500">{emp.jenjangPendidikan} • {emp.statusPegawai}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 border-emerald-100 text-emerald-700 font-sans">
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
