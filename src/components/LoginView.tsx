import React, { useState, FormEvent } from 'react';
import bgLogin from '../assets/images/bg_login_rri_1786536696501.jpg';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Employee } from '../types';
import PetaKomandoLogo from './PetaKomandoLogo';
import { mapEmployeeToAppRole, normalizeCredential } from '../utils/roleHelper';

interface LoginViewProps {
  employees: Employee[];
  onLogin: (user: { id: string; name: string; role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; division?: string; photo?: string }) => void;
  namaInstansi: string;
  kepalaStasiunUsername?: string;
  kepalaStasiunPassword?: string;
  kepalaStasiunNama?: string;
  loginLogoUrl?: string;
  appLogoUrl?: string;
}

export default function LoginView({ 
  employees, 
  onLogin, 
  namaInstansi, 
  kepalaStasiunUsername, 
  kepalaStasiunPassword, 
  kepalaStasiunNama,
  loginLogoUrl,
  appLogoUrl
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleManualLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('NIK / NIP / Username wajib diisi');
      return;
    }

    const rawInput = username.trim();
    const normalizedTarget = normalizeCredential(rawInput.replace(/@portal/i, ''));
    const inputLower = rawInput?.toLowerCase();

    // Check if it's the master Superadmin credential
    if ((normalizedTarget === '1871102702910001' || inputLower === 'superadmin') && password === 'orange@dan') {
      onLogin({
        id: 'superadmin',
        name: 'Superadmin Portal',
        role: 'Superadmin',
        division: 'Tata Usaha / Umum'
      });
      return;
    }

    // Try finding in employees collection
    const foundEmp = employees.find(emp => {
      const empUsername = normalizeCredential(emp.username);
      const empNip = normalizeCredential(emp.nip);
      const empNik = normalizeCredential(emp.nik);
      const empSurel = (emp.surel || '')?.toLowerCase().trim();
      const empNama = normalizeCredential(emp.nama);

      return (
        (empUsername && empUsername === normalizedTarget) ||
        (empNip && empNip === normalizedTarget) ||
        (empNik && empNik === normalizedTarget) ||
        (empSurel && empSurel === inputLower) ||
        (empNama && empNama === normalizedTarget)
      );
    });

    if (foundEmp) {
      if (foundEmp.isLoginActive === false) {
        setError('Akun pegawai ini berstatus non-aktif. Hubungi Admin Kepegawaian.');
        return;
      }

      const empStatus = (foundEmp.status || 'aktif')?.toLowerCase();
      if (empStatus === 'keluar' || empStatus === 'pindah') {
        setError('Akun pegawai ini telah keluar atau pindah tugas.');
        return;
      }

      // Strict password check: must match the configured employee password (defaults to 'password123' if not yet customized)
      const expectedPassword = foundEmp.password || 'password123';
      if (password !== expectedPassword) {
        setError('Kata sandi salah. Silakan periksa kembali.');
        return;
      }

      // Map loginRole to application role with complete hierarchy
      const assignedRole = mapEmployeeToAppRole(foundEmp);

      onLogin({
        id: foundEmp.id,
        name: `${foundEmp.gelarDepan ? foundEmp.gelarDepan + ' ' : ''}${foundEmp.nama}${foundEmp.gelarBelakang ? ', ' + foundEmp.gelarBelakang : ''}`,
        role: assignedRole,
        division: foundEmp.divisi
      });
    } else {
      setError('Akun tidak ditemukan atau kata sandi salah. Silakan periksa kembali.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20" 
        style={{ backgroundImage: `url(${bgLogin})` }} 
      />
      <div className="absolute inset-0 bg-slate-950/80 z-0" />
      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sleek Centered Login Box */}
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 shadow-2xl backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          {loginLogoUrl ? (
            <img 
              src={loginLogoUrl} 
              alt="Logo Peta Komando" 
              className="max-h-20 max-w-[280px] w-auto h-auto object-contain drop-shadow-md mx-auto"
              onError={(e) => {
                // If custom image fails to load, gracefully hide it and let container look neat
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : appLogoUrl ? (
            <div className="flex items-center justify-center gap-3">
              <img 
                src={appLogoUrl} 
                alt="Logo Peta Komando" 
                className="w-12 h-12 object-contain drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-left">
                <h1 className="text-lg font-black uppercase tracking-wider text-cyan-400 font-mono leading-none">PETA KOMANDO</h1>
                <p className="text-[10px] font-bold text-slate-300 tracking-tight">RRI BANDAR LAMPUNG</p>
              </div>
            </div>
          ) : (
            <PetaKomandoLogo size="md" className="max-w-[280px]" />
          )}
          <p className="text-[11px] text-slate-400 font-medium">Sistem Monitoring & Evaluasi Kinerja Terpadu</p>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">NIK / NIP / Username</label>
            <input
              type="text"
              placeholder="Masukkan NIP atau Nama Anda"
              value={username || ""}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-98"
          >
            <Key className="w-4 h-4" /> Masuk ke Portal
          </button>
        </form>



      </div>

      {/* Simple Footer */}
      <div className="mt-8 text-[10px] text-slate-600 font-mono text-center z-10">
        © 2026 RRI Bandar Lampung • Sistem Kinerja Digital
      </div>
    </div>
  );
}
