import React, { useState, FormEvent } from 'react';
import { Radio, ShieldCheck, Key, UserCheck, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Employee } from '../types';

interface LoginViewProps {
  employees: Employee[];
  onLogin: (user: { id: string; name: string; role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; division?: string; photo?: string }) => void;
  namaInstansi: string;
}

export default function LoginView({ employees, onLogin, namaInstansi }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSimulator, setShowSimulator] = useState(false);

  const quickRoles = [
    {
      id: 'kepala',
      name: 'Drs. H. Mulyadi Kusuma, M.M.',
      role: 'Kepala' as const,
      roleDisplay: 'Kepala Stasiun',
      division: 'Pimpinan',
      badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'emp-1', // Heru
      name: 'Heru Prasetyo, M.Si.',
      role: 'Staff' as const,
      roleDisplay: 'Staff Pemberitaan',
      division: 'Pemberitaan',
      badgeColor: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'emp-2', // Siti
      name: 'Siti Rahmawati, S.I.Kom.',
      role: 'Staff' as const,
      roleDisplay: 'Staff Konten Media Baru',
      division: 'Konten Media Baru',
      badgeColor: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'emp-3', // Andi
      name: 'Andi Wijaya, M.T.',
      role: 'Staff' as const,
      roleDisplay: 'Staff Teknologi & Media Baru',
      division: 'Teknologi dan Media Baru',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'emp-4', // Dewi
      name: 'Dewi Lestari, S.E.',
      role: 'Staff' as const,
      roleDisplay: 'Staff Tata Usaha / Umum',
      division: 'Tata Usaha / Umum',
      badgeColor: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'emp-5', // Rizky
      name: 'Rizky Syahputra, A.Md.',
      role: 'Staff' as const,
      roleDisplay: 'Staff Layanan Pengembangan Usaha',
      division: 'Layanan Pengembangan Usaha',
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces'
    }
  ];

  const handleManualLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('NIK / NIP / Username wajib diisi');
      return;
    }

    // Check if it's the hidden Superadmin
    if (username === '1871102702910001' && password === 'orange@dan') {
      onLogin({
        id: 'superadmin',
        name: 'Superadmin Portal',
        role: 'Superadmin',
        division: 'Tata Usaha / Umum',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces'
      });
      return;
    }

    // Check if it's Kepala
    if (username.toLowerCase() === 'kepala' || username === '196501012026121001') {
      onLogin({
        id: 'kepala',
        name: 'Drs. H. Mulyadi Kusuma, M.M.',
        role: 'Kepala',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces'
      });
      return;
    }

    // Try finding in employees
    const foundEmp = employees.find(
      emp => emp.nip === username || emp.nik === username || emp.nama.toLowerCase().includes(username.toLowerCase())
    );

    if (foundEmp) {
      onLogin({
        id: foundEmp.id,
        name: `${foundEmp.gelarDepan ? foundEmp.gelarDepan + ' ' : ''}${foundEmp.nama}${foundEmp.gelarBelakang ? ', ' + foundEmp.gelarBelakang : ''}`,
        role: foundEmp.role || 'Staff',
        division: foundEmp.divisi,
        photo: foundEmp.foto
      });
    } else {
      setError('Akun tidak ditemukan atau kata sandi salah. Silakan periksa kembali.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sleek Centered Login Box */}
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 shadow-2xl backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">PORTAL KOMANDO</span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">RRI Bandar Lampung</h1>
          </div>
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
              value={username}
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
                value={password}
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

        {/* Collapsible Simulator Segment */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            type="button"
            className="w-full flex items-center justify-between text-[10px] font-semibold text-slate-500 hover:text-indigo-400 uppercase tracking-wider transition-colors"
          >
            <span>Simulasi Masuk Cepat</span>
            <span className="font-mono text-xs">{showSimulator ? '▲' : '▼'}</span>
          </button>

          {showSimulator && (
            <div className="mt-3 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {quickRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onLogin({
                    id: role.id,
                    name: role.name,
                    role: role.role,
                    division: role.division !== 'Pimpinan' ? role.division : undefined,
                    photo: role.photo
                  })}
                  className="flex items-center gap-2.5 p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800/50 rounded-xl transition-all text-left group"
                >
                  <img
                    src={role.photo}
                    alt={role.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-bold text-slate-300 truncate group-hover:text-indigo-400 transition-colors">{role.name}</h3>
                    <span className="text-[8px] text-slate-500 font-medium tracking-tight block">{role.roleDisplay}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Simple Footer */}
      <div className="mt-8 text-[10px] text-slate-600 font-mono text-center z-10">
        © 2026 RRI Bandar Lampung • Sistem Kinerja Digital
      </div>
    </div>
  );
}
