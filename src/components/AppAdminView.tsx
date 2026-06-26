import React, { useState } from 'react';
import { AppSettings, InstitutionalIdentity, Employee } from '../types';
import SignaturePad from './SignaturePad';
import { Building, Award, PenTool, Check, FileText, Phone, MapPin, Printer } from 'lucide-react';

interface AppAdminViewProps {
  settings: AppSettings;
  identity: InstitutionalIdentity;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateIdentity: (identity: InstitutionalIdentity) => void;
  employees?: Employee[];
}

export default function AppAdminView({
  settings,
  identity,
  onUpdateSettings,
  onUpdateIdentity,
  employees = []
}: AppAdminViewProps) {
  const formatFullName = (emp: Employee) => {
    let full = emp.nama;
    if (emp.gelarDepan) full = `${emp.gelarDepan} ${full}`;
    if (emp.gelarBelakang) full = `${full}, ${emp.gelarBelakang}`;
    return full;
  };

  // General Settings Local State
  const [instansiNama, setInstansiNama] = useState(settings.namaInstansi);
  const [instansiAlamat, setInstansiAlamat] = useState(settings.alamat);
  const [instansiNoTelp, setInstansiNoTelp] = useState(settings.noTelp);
  const [isSavedSettings, setIsSavedSettings] = useState(false);

  // Institutional Identity Local State
  const [stasiunNama, setStasiunNama] = useState(identity.kepalaStasiunNama);
  const [stasiunTtd, setStasiunTtd] = useState(identity.kepalaStasiunTtd);
  const [stasiunPassword, setStasiunPassword] = useState(identity.kepalaStasiunPassword || 'kepala');

  const [bidangNama, setBidangNama] = useState(identity.kepalaBidangNama);
  const [bidangTtd, setBidangTtd] = useState(identity.kepalaBidangTtd);

  const [timSiaranNama, setTimSiaranNama] = useState(identity.ketuaTimSiaranNama || '');
  const [timSiaranTtd, setTimSiaranTtd] = useState(identity.ketuaTimSiaranTtd || '');

  const [timPemberitaanNama, setTimPemberitaanNama] = useState(identity.ketuaTimPemberitaanNama || '');
  const [timPemberitaanTtd, setTimPemberitaanTtd] = useState(identity.ketuaTimPemberitaanTtd || '');

  const [timTeknikNama, setTimTeknikNama] = useState(identity.ketuaTimTeknikNama || '');
  const [timTeknikTtd, setTimTeknikTtd] = useState(identity.ketuaTimTeknikTtd || '');

  const [timKontenNama, setTimKontenNama] = useState(identity.ketuaTimKontenNama || '');
  const [timKontenTtd, setTimKontenTtd] = useState(identity.ketuaTimKontenTtd || '');

  const [timLayananNama, setTimLayananNama] = useState(identity.ketuaTimLayananNama || '');
  const [timLayananTtd, setTimLayananTtd] = useState(identity.ketuaTimLayananTtd || '');
  
  const [isSavedKepala, setIsSavedKepala] = useState(false);
  const [isSavedKabidKatim, setIsSavedKabidKatim] = useState(false);

  // Save General settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      namaInstansi: instansiNama,
      alamat: instansiAlamat,
      noTelp: instansiNoTelp
    });
    setIsSavedSettings(true);
    setTimeout(() => setIsSavedSettings(false), 2000);
  };

  // Save Kepala Stasiun Identity
  const handleSaveKepala = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentity({
      ...identity,
      kepalaStasiunNama: stasiunNama,
      kepalaStasiunTtd: stasiunTtd,
      kepalaStasiunPassword: stasiunPassword,
    });
    setIsSavedKepala(true);
    setTimeout(() => setIsSavedKepala(false), 2000);
  };

  // Save Kabid / Katim Identity
  const handleSaveKabidKatim = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentity({
      ...identity,
      kepalaBidangNama: bidangNama,
      kepalaBidangTtd: bidangTtd,
      ketuaTimSiaranNama: timSiaranNama,
      ketuaTimSiaranTtd: timSiaranTtd,
      ketuaTimPemberitaanNama: timPemberitaanNama,
      ketuaTimPemberitaanTtd: timPemberitaanTtd,
      ketuaTimTeknikNama: timTeknikNama,
      ketuaTimTeknikTtd: timTeknikTtd,
      ketuaTimKontenNama: timKontenNama,
      ketuaTimKontenTtd: timKontenTtd,
      ketuaTimLayananNama: timLayananNama,
      ketuaTimLayananTtd: timLayananTtd
    });
    setIsSavedKabidKatim(true);
    setTimeout(() => setIsSavedKabidKatim(false), 2000);
  };

  // Mock document printable
  const handlePrintMock = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Settings Panel */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* General Application Settings Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Building className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pengaturan Umum Aplikasi</h2>
              <p className="text-[10px] text-slate-400">Identitas umum instansi/lembaga penyiaran.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nama Instansi / Lembaga</label>
              <input
                type="text"
                value={instansiNama}
                onChange={(e) => setInstansiNama(e.target.value)}
                placeholder="Contoh: RRI Stasiun Pemancar Utama"
                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nomor Telepon</label>
                <input
                  type="text"
                  value={instansiNoTelp}
                  onChange={(e) => setInstansiNoTelp(e.target.value)}
                  placeholder="Contoh: (021) 123456"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Alamat Instansi</label>
                <input
                  type="text"
                  value={instansiAlamat}
                  onChange={(e) => setInstansiAlamat(e.target.value)}
                  placeholder="Jl. Radio Pemancar No. 45, Jakarta"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                {isSavedSettings ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Berhasil Disimpan
                  </>
                ) : (
                  "Simpan Pengaturan Umum"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 1: Pengaturan Kepala Stasiun */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pengaturan Kepala Stasiun</h2>
              <p className="text-[10px] text-slate-400">Kelola nama, tanda tangan, dan kata sandi akun Kepala Stasiun.</p>
            </div>
          </div>

          <form onSubmit={handleSaveKepala} className="space-y-4">
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setStasiunNama(formatFullName(emp));
                          setStasiunTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={stasiunNama}
                      onChange={(e) => setStasiunNama(e.target.value)}
                      placeholder="Budi Rahardjo, M.Sn."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kata Sandi Akun Kepala</label>
                    <input
                      type="text"
                      value={stasiunPassword}
                      onChange={(e) => setStasiunPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold font-mono"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={stasiunTtd}
                  onChange={(dataUrl) => setStasiunTtd(dataUrl)}
                  height={135}
                  label="Tanda Tangan Kepala Stasiun"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                {isSavedKepala ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Berhasil Menyimpan Pengaturan Kepala
                  </>
                ) : (
                  "Simpan Pengaturan Kepala Stasiun"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Pengaturan Kabid / Katim */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pengaturan Kabid & Ketua Tim (Katim)</h2>
              <p className="text-[10px] text-slate-400">Kelola nama pejabat dan tanda tangan elektronik Kepala Bidang dan Ketua Tim.</p>
            </div>
          </div>

          <form onSubmit={handleSaveKabidKatim} className="space-y-5">
            
            {/* 2. Kepala Bidang Tata Usaha */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kepala Bidang Tata Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setBidangNama(formatFullName(emp));
                          setBidangTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={bidangNama}
                      onChange={(e) => setBidangNama(e.target.value)}
                      placeholder="Ir. H. Ahmad Fauzi, M.T."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={bidangTtd}
                  onChange={(dataUrl) => setBidangTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Kepala Bidang Tata Usaha"
                />
              </div>
            </div>

            {/* 3. Ketua Tim Siaran */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Siaran</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimSiaranNama(formatFullName(emp));
                          setTimSiaranTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timSiaranNama}
                      onChange={(e) => setTimSiaranNama(e.target.value)}
                      placeholder="Rina Kartika, S.Sos."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timSiaranTtd}
                  onChange={(dataUrl) => setTimSiaranTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Siaran"
                />
              </div>
            </div>

            {/* 4. Ketua Tim Pemberitaan */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Pemberitaan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimPemberitaanNama(formatFullName(emp));
                          setTimPemberitaanTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timPemberitaanNama}
                      onChange={(e) => setTimPemberitaanNama(e.target.value)}
                      placeholder="Fahri Hamzah, M.I.Kom."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timPemberitaanTtd}
                  onChange={(dataUrl) => setTimPemberitaanTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Pemberitaan"
                />
              </div>
            </div>

            {/* 5. Ketua Tim Teknologi dan Media Baru */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">5</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Teknologi dan Media Baru</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimTeknikNama(formatFullName(emp));
                          setTimTeknikTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timTeknikNama}
                      onChange={(e) => setTimTeknikNama(e.target.value)}
                      placeholder="Andi Wijaya, M.T."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timTeknikTtd}
                  onChange={(dataUrl) => setTimTeknikTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Teknologi & Media Baru"
                />
              </div>
            </div>

            {/* 6. Ketua Tim Konten Media Baru */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">6</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Konten Media Baru</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimKontenNama(formatFullName(emp));
                          setTimKontenTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timKontenNama}
                      onChange={(e) => setTimKontenNama(e.target.value)}
                      placeholder="Siti Rahmawati, S.I.Kom."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timKontenTtd}
                  onChange={(dataUrl) => setTimKontenTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Konten Media Baru"
                />
              </div>
            </div>

            {/* 7. Ketua Tim Layanan Pengembangan Usaha */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">7</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ketua Tim Layanan Pengembangan Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih dari Data Pegawai</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) {
                          setTimLayananNama(formatFullName(emp));
                          setTimLayananTtd(emp.ttdElektronik);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{formatFullName(emp)} ({emp.divisi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar (Kustom)</label>
                    <input
                      type="text"
                      value={timLayananNama}
                      onChange={(e) => setTimLayananNama(e.target.value)}
                      placeholder="Budi Santoso, S.E., M.M."
                      className="w-full bg-white border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <SignaturePad
                  value={timLayananTtd}
                  onChange={(dataUrl) => setTimLayananTtd(dataUrl)}
                  height={100}
                  label="Tanda Tangan Ketua Tim Layanan Pengembangan Usaha"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
              >
                {isSavedKabidKatim ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Berhasil Menyimpan Pengaturan Kabid/Katim
                  </>
                ) : (
                  "Simpan Pengaturan Kabid / Katim"
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Right Column - Live Official Document Signing Preview */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Simulasi Dokumen Resmi (Live SK)
          </h2>
          <button
            onClick={handlePrintMock}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] px-2.5 py-1.5 border border-slate-200 rounded-lg transition-all"
          >
            <Printer className="w-3 h-3" />
            Cetak Mock
          </button>
        </div>

        {/* Paper Mockup style container */}
        <div className="bg-amber-50/20 border border-amber-100 p-6 sm:p-8 rounded-2xl shadow-xs space-y-6 max-w-full overflow-hidden text-slate-800 select-none">
          
          {/* Letter Head (Kop Surat) */}
          <div className="text-center border-b-2 border-double border-slate-800 pb-3 space-y-1">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">KOP INSTANSI PENYIARAN RESMI</h4>
            <h3 className="text-xs font-bold uppercase text-slate-800 leading-tight">{instansiNama || 'NAMA INSTANSI'}</h3>
            <div className="flex justify-center items-center gap-3 text-[9px] text-slate-500 font-medium flex-wrap">
              <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {instansiAlamat || 'Alamat Instansi'}</span>
              <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> Telp: {instansiNoTelp || 'Telp'}</span>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wide underline">SURAT KEPUTUSAN (SK)</p>
            <p className="text-[8px] text-slate-400 font-mono">NOMOR: 800/SK-DIR/VI/2026</p>
          </div>

          {/* Document Content */}
          <div className="space-y-2.5 text-[9px] text-justify leading-relaxed">
            <p>
              Menimbang dan mengingat demi kelancaran operasional lembaga serta optimasi mutu siaran, jajaran pimpinan yang berwenang di lingkungan <strong>{instansiNama || 'Instansi Terkait'}</strong> dengan ini memutuskan untuk melakukan pengesahan penetapan kinerja pegawai pada semester berjalan.
            </p>
            <p>
              Segala bentuk keputusan digital ini diarsipkan secara digital menggunakan instrumen penandatanganan elektronik tersertifikasi guna tahap pengembangan integrasi integrasi lanjut sistem manajemen.
            </p>
          </div>

          {/* Interactive Digital Signatures Alignment */}
          <div className="border-t border-dashed border-slate-200 pt-5 space-y-5">
            <p className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase text-center">Lembar Pengesahan Digital</p>
            
            {/* Top Official: Kepala Stasiun */}
            <div className="flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Mengetahui,</span>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Kepala Stasiun Radio</span>
              
              <div className="h-11 flex items-center justify-center my-1">
                {stasiunTtd ? (
                  <img src={stasiunTtd} alt="TTD Stasiun" className="max-h-full max-w-[120px] object-contain mix-blend-multiply" />
                ) : (
                  <span className="text-[8px] text-rose-400 italic">Belum ditandatangani</span>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-800 underline">{stasiunNama || 'Nama Belum Diatur'}</span>
              <span className="text-[7px] text-slate-400 font-mono">NIP. 197203151998031002</span>
            </div>

            {/* Sibling Officials: Kabid TU & Para Ketua Tim */}
            <div className="space-y-4 pt-1">
              {/* Kepala Bidang Tata Usaha */}
              <div className="flex flex-col items-center text-center border-b border-slate-100 pb-3">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Disetujui Oleh,</span>
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Kepala Bidang Tata Usaha</span>
                
                <div className="h-9 flex items-center justify-center my-1">
                  {bidangTtd ? (
                    <img src={bidangTtd} alt="TTD Kabid TU" className="max-h-full max-w-[100px] object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-[8px] text-rose-400 italic">Belum TTD</span>
                  )}
                </div>
                <span className="text-[8px] font-bold text-slate-800 underline truncate max-w-[180px]">{bidangNama || 'Nama Belum Diatur'}</span>
                <span className="text-[7px] text-slate-400 font-mono">NIP. 198011202005012003</span>
              </div>

              {/* Para Ketua Tim - 2x2 Grid */}
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block text-center">Diverifikasi Oleh Para Ketua Tim:</span>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  {/* Ketua Tim Siaran */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider">Ketua Tim Siaran</span>
                    <div className="h-8 flex items-center justify-center my-0.5">
                      {timSiaranTtd ? (
                        <img src={timSiaranTtd} alt="TTD Tim Siaran" className="max-h-full max-w-[80px] object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-[7px] text-rose-400 italic">Belum TTD</span>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-slate-800 underline truncate max-w-[100px]">{timSiaranNama || 'Nama Belum Diatur'}</span>
                  </div>

                  {/* Ketua Tim Pemberitaan */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider">Ketua Tim Pemberitaan</span>
                    <div className="h-8 flex items-center justify-center my-0.5">
                      {timPemberitaanTtd ? (
                        <img src={timPemberitaanTtd} alt="TTD Tim Pemberitaan" className="max-h-full max-w-[80px] object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-[7px] text-rose-400 italic">Belum TTD</span>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-slate-800 underline truncate max-w-[100px]">{timPemberitaanNama || 'Nama Belum Diatur'}</span>
                  </div>

                  {/* Ketua Tim Teknologi dan Media Baru */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider">Ketua Tim Teknologi & MB</span>
                    <div className="h-8 flex items-center justify-center my-0.5">
                      {timTeknikTtd ? (
                        <img src={timTeknikTtd} alt="TTD Tim Teknologi & MB" className="max-h-full max-w-[80px] object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-[7px] text-rose-400 italic">Belum TTD</span>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-slate-800 underline truncate max-w-[100px]">{timTeknikNama || 'Nama Belum Diatur'}</span>
                  </div>

                  {/* Ketua Tim Konten Media Baru */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider">Ketua Tim Konten MB</span>
                    <div className="h-8 flex items-center justify-center my-0.5">
                      {timKontenTtd ? (
                        <img src={timKontenTtd} alt="TTD Tim Konten MB" className="max-h-full max-w-[80px] object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-[7px] text-rose-400 italic">Belum TTD</span>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-slate-800 underline truncate max-w-[100px]">{timKontenNama || 'Nama Belum Diatur'}</span>
                  </div>

                  {/* Ketua Tim Layanan Pengembangan Usaha */}
                  <div className="flex flex-col items-center text-center col-span-2 mt-1 border-t border-slate-100/50 pt-2">
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider">Ketua Tim Layanan PU</span>
                    <div className="h-8 flex items-center justify-center my-0.5">
                      {timLayananTtd ? (
                        <img src={timLayananTtd} alt="TTD Tim Layanan PU" className="max-h-full max-w-[80px] object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-[7px] text-rose-400 italic">Belum TTD</span>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-slate-800 underline truncate max-w-[150px]">{timLayananNama || 'Nama Belum Diatur'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="text-[7px] text-slate-400 font-mono text-center border-t border-slate-100 pt-2 flex justify-between items-center">
            <span>DOKUMEN RESMI DIGITAL</span>
            <span>VERIFIED BY DIGITAL SIGNATURE PAD</span>
          </div>

        </div>
      </div>

    </div>
  );
}
