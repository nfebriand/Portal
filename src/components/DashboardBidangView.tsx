import { useMemo } from 'react';
import { Employee, PerformanceAgreement, CooperationContract, ReporterTarget, NewsReport } from '../types';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  User, 
  Award, 
  Briefcase, 
  Clock, 
  Radio, 
  FileText, 
  Handshake, 
  Share2, 
  Settings, 
  GitFork
} from 'lucide-react';

interface DashboardBidangViewProps {
  currentUser: { id: string; name: string; role: 'Kepala' | 'Staff'; division?: string; photo?: string };
  employees: Employee[];
  agreements: PerformanceAgreement[];
  contracts?: CooperationContract[];
  reporterTargets?: ReporterTarget[];
  newsReports?: NewsReport[];
}

export default function DashboardBidangView({
  currentUser,
  employees,
  agreements,
  contracts = [],
  reporterTargets = [],
  newsReports = []
}: DashboardBidangViewProps) {
  
  // Find current active employee details
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === currentUser.id);
  }, [employees, currentUser]);

  const activeDivision = currentUser.division || 'Umum';

  // Find all agreements relevant to this division
  // 1. Their own agreement (assignedToEmployeeId === currentEmployee.id)
  // 2. Their Ketua Tim / Kabid agreement for this division
  const divisionAgreements = useMemo(() => {
    return agreements.filter(ag => {
      // Direct assignment
      if (ag.assignedToEmployeeId === currentUser.id) return true;
      
      // Ketua Tim of their division
      const divisionKey = activeDivision.toLowerCase();
      const levelKey = ag.level.toLowerCase();
      
      if (divisionKey.includes('pemberitaan') && levelKey.includes('pemberitaan')) return true;
      if (divisionKey.includes('konten') && levelKey.includes('konten')) return true;
      if (divisionKey.includes('teknologi') && levelKey.includes('teknologi')) return true;
      if (divisionKey.includes('layanan') && levelKey.includes('layanan')) return true;
      if (divisionKey.includes('siaran') && levelKey.includes('siaran')) return true;
      if (divisionKey.includes('tata usaha') && levelKey.includes('tata usaha')) return true;
      if (divisionKey.includes('tata usaha') && levelKey.includes('kabid')) return true;
      
      return false;
    });
  }, [agreements, currentUser, activeDivision]);

  // Extract objectives
  const { ownObjectives, teamObjectives } = useMemo(() => {
    const own = divisionAgreements.find(ag => ag.assignedToEmployeeId === currentUser.id);
    const team = divisionAgreements.find(ag => ag.assignedToEmployeeId !== currentUser.id && ag.level !== 'Pegawai');
    
    return {
      ownObjectives: own ? own.objectives : [],
      teamObjectives: team ? team.objectives : [],
      teamAgreement: team
    };
  }, [divisionAgreements, currentUser]);

  // Calculate stats for this specific division
  const stats = useMemo(() => {
    // 1. Calculate average achievement of their own objectives
    let ownPctTotal = 0;
    ownObjectives.forEach(obj => {
      const tgt = parseFloat(obj.target) || 100;
      const progress = tgt > 0 ? (obj.achievement / tgt) * 100 : 0;
      ownPctTotal += Math.min(120, progress);
    });
    const ownAverageProgress = ownObjectives.length > 0 ? Math.round(ownPctTotal / ownObjectives.length) : 0;

    // 2. Calculate average achievement of their team's objectives
    let teamPctTotal = 0;
    teamObjectives.forEach(obj => {
      const tgt = parseFloat(obj.target) || 100;
      const progress = tgt > 0 ? (obj.achievement / tgt) * 100 : 0;
      teamPctTotal += Math.min(120, progress);
    });
    const teamAverageProgress = teamObjectives.length > 0 ? Math.round(teamPctTotal / teamObjectives.length) : 0;

    // 3. For division-specific metrics
    const divReports = newsReports.filter(r => r.employeeId === currentUser.id);
    const totalDivValue = contracts
      .filter(c => c.linkedIndicatorId === 'ind-11')
      .reduce((sum, c) => sum + c.value, 0);

    return {
      ownAverageProgress,
      teamAverageProgress,
      divReportsCount: divReports.length,
      totalDivValue
    };
  }, [ownObjectives, teamObjectives, newsReports, currentUser, contracts]);

  return (
    <div className="space-y-6 select-none">
      
      {/* Bidang Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white relative overflow-hidden">
        {/* Decorative backdrop patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase font-mono">
                Selamat Datang di Portal Bidang
              </span>
              <h1 className="text-xl font-bold tracking-tight">{currentUser.name}</h1>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>NIP. {currentEmployee?.nip || 'Simulator NIP'} • Divisi <strong>{activeDivision}</strong></span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex flex-col md:items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Dashboard Bidang Aktif</span>
            <span className="text-sm font-extrabold text-indigo-400 mt-0.5 tracking-wide">
              {activeDivision.toUpperCase()}
            </span>
            <span className="text-[9px] text-slate-500 font-mono mt-1">Tahun Anggaran 2026</span>
          </div>
        </div>
      </div>

      {/* Overview Division Metrics Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Progres Kerja Individu</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 font-mono">{stats.ownAverageProgress}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rerata SKP</span>
            </div>
            <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.ownAverageProgress)}%` }} />
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Progres Kinerja Tim Divisi</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 font-mono">{stats.teamAverageProgress}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rerata PK Bidang</span>
            </div>
            <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, stats.teamAverageProgress)}%` }} />
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Division specific quick stat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            {activeDivision === 'Pemberitaan' || activeDivision === 'Konten Media Baru' ? (
              <>
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Publikasi Konten Saya</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-800 font-mono">{stats.divReportsCount}</span>
                  <span className="text-xs text-slate-400">Terbit Bulan Ini</span>
                </div>
                <p className="text-[10px] text-slate-500">Mendukung otomatisasi cascade stasiun</p>
              </>
            ) : activeDivision === 'Layanan Pengembangan Usaha' ? (
              <>
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Kontrak Mitra Aktif</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-800 font-mono">Rp {stats.totalDivValue}Jt</span>
                  <span className="text-xs text-slate-400">Total Potensi</span>
                </div>
                <p className="text-[10px] text-slate-500">Realisasi dihitung otomatis masuk PNBP</p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Sistem Kerja Terverifikasi</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-emerald-600 font-mono">AKTIF</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Sinkronisasi 2026
                </p>
              </>
            )}
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            {activeDivision === 'Pemberitaan' || activeDivision === 'Konten Media Baru' ? (
              <Share2 className="w-6 h-6" />
            ) : activeDivision === 'Layanan Pengembangan Usaha' ? (
              <Handshake className="w-6 h-6" />
            ) : (
              <Settings className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* Target & Perjanjian Kerja Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Sasaran Kinerja Individu (SKP Pegawai) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                Sasaran Kinerja Individu (SKP Anda)
              </h2>
              <p className="text-[11px] text-slate-400">Kontrak target pribadi yang harus Anda penuhi tahun ini.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">Pegawai</span>
          </div>

          <div className="space-y-4">
            {ownObjectives.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Belum ada Perjanjian Kinerja Individu yang didelegasikan untuk akun Anda.
              </div>
            ) : (
              ownObjectives.map((obj) => {
                const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                return (
                  <div key={obj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                        <h3 className="text-xs font-bold text-slate-700 mt-1 leading-normal">{obj.indicatorName}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-medium">Realisasi / Target</span>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">
                          {obj.achievement} {obj.unit} / {obj.target} {obj.unit}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Persentase Ketercapaian</span>
                        <span className="font-extrabold text-emerald-600 font-mono">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Perjanjian Kinerja Tim / Bidang (Cascade Reference) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-indigo-600" />
                Sasaran Kinerja Bidang ({activeDivision})
              </h2>
              <p className="text-[11px] text-slate-400">Target Ketua Tim / Koordinator sebagai rujukan cascading Anda.</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">Ketua Tim</span>
          </div>

          <div className="space-y-4">
            {teamObjectives.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Belum ada Perjanjian Kinerja tingkat Bidang yang dimuat.
              </div>
            ) : (
              teamObjectives.map((obj) => {
                const pct = parseFloat(obj.target) > 0 ? Math.round((obj.achievement / parseFloat(obj.target)) * 100) : 0;
                return (
                  <div key={obj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">ID: {obj.id}</span>
                        <h3 className="text-xs font-bold text-slate-700 mt-1 leading-normal">{obj.indicatorName}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-medium">Realisasi / Target</span>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">
                          {obj.achievement} {obj.unit} / {obj.target} {obj.unit}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Persentase Ketercapaian Tim</span>
                        <span className="font-extrabold text-indigo-600 font-mono">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Information Traceability Card */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-2">
        <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
          Mekanisme Cascading & Penyelarasan Kinerja
        </h4>
        <p className="leading-relaxed text-[11px]">
          Target individu Anda (SKP Pegawai) diselaraskan secara vertikal dengan Sasaran Kinerja Bidang (Ketua Tim). Setiap realisasi atau laporan pekerjaan yang Anda masukkan di portal ini (misalnya jumlah rilis berita atau publikasi media) akan dihitung secara langsung dan otomatis mengalir naik (cascade) meningkatkan capaian tim divisi, dan akhirnya berkontribusi penuh bagi Indeks Kinerja Utama (IKU) Kepala Stasiun.
        </p>
      </div>

    </div>
  );
}
