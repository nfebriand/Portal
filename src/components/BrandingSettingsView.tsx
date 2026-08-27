import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  initDriveAuth, 
  uploadImageToGoogleDrive, 
  getDriveAccessToken,
  DriveUploadResult
} from '../lib/googleDrive';
import PetaKomandoLogo from './PetaKomandoLogo';
import PetaKomandoIcon from './PetaKomandoIcon';
import { 
  Cloud, 
  Upload, 
  Check, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon, 
  Sparkles, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Eye,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { User } from 'firebase/auth';

interface BrandingSettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function BrandingSettingsView({
  settings,
  onUpdateSettings,
}: BrandingSettingsViewProps) {
  // Google Drive Authentication State
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Local Branding Form State
  const [appLogoUrl, setAppLogoUrl] = useState<string>(settings.appLogoUrl || '');
  const [appLogoDriveId, setAppLogoDriveId] = useState<string>(settings.appLogoDriveId || '');
  const [appLogoDriveLink, setAppLogoDriveLink] = useState<string>(settings.appLogoDriveLink || '');

  const [loginLogoUrl, setLoginLogoUrl] = useState<string>(settings.loginLogoUrl || '');
  const [loginLogoDriveId, setLoginLogoDriveId] = useState<string>(settings.loginLogoDriveId || '');
  const [loginLogoDriveLink, setLoginLogoDriveLink] = useState<string>(settings.loginLogoDriveLink || '');

  const [splashLogoUrl, setSplashLogoUrl] = useState<string>(settings.splashLogoUrl || '');
  const [splashLogoDriveId, setSplashLogoDriveId] = useState<string>(settings.splashLogoDriveId || '');
  const [splashLogoDriveLink, setSplashLogoDriveLink] = useState<string>(settings.splashLogoDriveLink || '');

  // Uploading state per asset
  const [uploadingTarget, setUploadingTarget] = useState<'appLogo' | 'loginLogo' | 'splashLogo' | null>(null);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File input refs
  const appLogoInputRef = useRef<HTMLInputElement>(null);
  const loginLogoInputRef = useRef<HTMLInputElement>(null);
  const splashLogoInputRef = useRef<HTMLInputElement>(null);

  // Initialize Drive Auth Listener
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => {
        setDriveUser(user);
        setIsDriveConnected(true);
        setAuthError(null);
      },
      () => {
        setDriveUser(null);
        setIsDriveConnected(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Update local state if settings prop changes
  useEffect(() => {
    setAppLogoUrl(settings.appLogoUrl || '');
    setAppLogoDriveId(settings.appLogoDriveId || '');
    setAppLogoDriveLink(settings.appLogoDriveLink || '');

    setLoginLogoUrl(settings.loginLogoUrl || '');
    setLoginLogoDriveId(settings.loginLogoDriveId || '');
    setLoginLogoDriveLink(settings.loginLogoDriveLink || '');

    setSplashLogoUrl(settings.splashLogoUrl || '');
    setSplashLogoDriveId(settings.splashLogoDriveId || '');
    setSplashLogoDriveLink(settings.splashLogoDriveLink || '');
  }, [settings]);

  // Handle Google Drive Connect
  const handleConnectDrive = async () => {
    try {
      setIsConnectingDrive(true);
      setAuthError(null);
      const res = await connectGoogleDrive();
      setDriveUser(res.user);
      setIsDriveConnected(true);
    } catch (err: any) {
      console.error('Connect Drive Error:', err);
      setAuthError(err.message || 'Gagal menghubungkan Google Drive.');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  // Handle Google Drive Disconnect
  const handleDisconnectDrive = async () => {
    try {
      await disconnectGoogleDrive();
      setDriveUser(null);
      setIsDriveConnected(false);
    } catch (err: any) {
      console.error('Disconnect Drive Error:', err);
    }
  };

  // Copy to clipboard helper
  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Process File Upload for a target asset
  const handleProcessFile = async (
    file: File, 
    target: 'appLogo' | 'loginLogo' | 'splashLogo'
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    setUploadingTarget(target);
    setUploadProgressMsg('Membaca file gambar lokal...');

    try {
      // First read local data URL for instant display
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = await getDriveAccessToken();
      const targetName = 
        target === 'appLogo' ? `PetaKomando_Logo_Kecil_${Date.now()}.${file.name.split('.').pop()}` :
        target === 'loginLogo' ? `PetaKomando_Logo_Login_${Date.now()}.${file.name.split('.').pop()}` :
        `PetaKomando_Splash_Screen_${Date.now()}.${file.name.split('.').pop()}`;

      if (token && isDriveConnected) {
        setUploadProgressMsg('Mengunggah ke Google Drive Anda...');
        const driveResult: DriveUploadResult = await uploadImageToGoogleDrive(file, targetName, token);

        if (target === 'appLogo') {
          setAppLogoUrl(dataUrl); // Data URL or Drive direct URL
          setAppLogoDriveId(driveResult.fileId);
          setAppLogoDriveLink(driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.fileId}/view`);
          
          // Auto-save
          const updated = {
            ...settings,
            appLogoUrl: dataUrl,
            appLogoDriveId: driveResult.fileId,
            appLogoDriveLink: driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.fileId}/view`,
          };
          onUpdateSettings(updated);
        } else if (target === 'loginLogo') {
          setLoginLogoUrl(dataUrl);
          setLoginLogoDriveId(driveResult.fileId);
          setLoginLogoDriveLink(driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.fileId}/view`);
          
          const updated = {
            ...settings,
            loginLogoUrl: dataUrl,
            loginLogoDriveId: driveResult.fileId,
            loginLogoDriveLink: driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.fileId}/view`,
          };
          onUpdateSettings(updated);
        } else if (target === 'splashLogo') {
          setSplashLogoUrl(dataUrl);
          setSplashLogoDriveId(driveResult.fileId);
          setSplashLogoDriveLink(driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.fileId}/view`);
          
          const updated = {
            ...settings,
            splashLogoUrl: dataUrl,
            splashLogoDriveId: driveResult.fileId,
            splashLogoDriveLink: driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.fileId}/view`,
          };
          onUpdateSettings(updated);
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        // Fallback: Local Data URL if not yet connected to Google Drive
        if (target === 'appLogo') {
          setAppLogoUrl(dataUrl);
          const updated = { ...settings, appLogoUrl: dataUrl };
          onUpdateSettings(updated);
        } else if (target === 'loginLogo') {
          setLoginLogoUrl(dataUrl);
          const updated = { ...settings, loginLogoUrl: dataUrl };
          onUpdateSettings(updated);
        } else if (target === 'splashLogo') {
          setSplashLogoUrl(dataUrl);
          const updated = { ...settings, splashLogoUrl: dataUrl };
          onUpdateSettings(updated);
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      alert(`Gagal mengunggah gambar: ${error.message || error}`);
    } finally {
      setUploadingTarget(null);
      setUploadProgressMsg('');
    }
  };

  // Reset target asset to default
  const handleResetAsset = (target: 'appLogo' | 'loginLogo' | 'splashLogo') => {
    if (target === 'appLogo') {
      setAppLogoUrl('');
      setAppLogoDriveId('');
      setAppLogoDriveLink('');
      const updated = {
        ...settings,
        appLogoUrl: '',
        appLogoDriveId: '',
        appLogoDriveLink: '',
      };
      onUpdateSettings(updated);
    } else if (target === 'loginLogo') {
      setLoginLogoUrl('');
      setLoginLogoDriveId('');
      setLoginLogoDriveLink('');
      const updated = {
        ...settings,
        loginLogoUrl: '',
        loginLogoDriveId: '',
        loginLogoDriveLink: '',
      };
      onUpdateSettings(updated);
    } else if (target === 'splashLogo') {
      setSplashLogoUrl('');
      setSplashLogoDriveId('');
      setSplashLogoDriveLink('');
      const updated = {
        ...settings,
        splashLogoUrl: '',
        splashLogoDriveId: '',
        splashLogoDriveLink: '',
      };
      onUpdateSettings(updated);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Explicit Save All Changes
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      appLogoUrl,
      appLogoDriveId,
      appLogoDriveLink,
      loginLogoUrl,
      loginLogoDriveId,
      loginLogoDriveLink,
      splashLogoUrl,
      splashLogoDriveId,
      splashLogoDriveLink,
    };
    onUpdateSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold tracking-wider uppercase">
              <Cloud className="w-3.5 h-3.5" />
              <span>INTEGRASI GOOGLE DRIVE & BRANDING</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Kustomisasi Logo & Layar Aplikasi Peta Komando
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Ganti logo kecil header/sidebar, logo utama halaman login, dan tampilan splash screen. Berkas yang Anda unggah otomatis disimpan di Google Drive Anda dan disinkronkan ke seluruh sistem Peta Komando.
            </p>
          </div>

          {/* Google Drive Status Widget */}
          <div className="shrink-0 bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Status Google Drive</span>
              {isDriveConnected ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Belum Terhubung
                </span>
              )}
            </div>

            {isDriveConnected && driveUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {driveUser.photoURL ? (
                    <img src={driveUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-cyan-400" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-bold">
                      {driveUser.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{driveUser.displayName || 'Google User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{driveUser.email}</p>
                  </div>
                </div>
                <button
                  id="btn-disconnect-google-drive"
                  onClick={handleDisconnectDrive}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  Putuskan Akun Drive
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  id="btn-connect-google-drive"
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isConnectingDrive ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>Hubungkan Google Drive</span>
                    </>
                  )}
                </button>
                {authError && (
                  <p className="text-[10px] text-rose-400 font-medium">{authError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Save Banner */}
      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Pengaturan Branding Berhasil Disimpan & Diterapkan!</p>
              <p className="text-[11px] text-emerald-700">Logo dan splash screen baru telah aktif pada seluruh tampilan Peta Komando.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold">AKTIF</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LOGO KECIL APLIKASI (Sidebar Header & Mobile Top Header)                */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-cyan-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">1. Logo Kecil Aplikasi (App Icon)</h3>
              <p className="text-[11px] text-slate-500">Digunakan pada sudut atas Sidebar Desktop dan Header Navigasi Mobile.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {appLogoUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                <ImageIcon className="w-3 h-3" />
                Logo Kustom Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                Logo Default (Peta Komando Icon)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Live Previews */}
          <div className="md:col-span-5 space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pratinjau Nyata (Sidebar & Header)
            </label>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-[10px] font-mono text-slate-400">Pratinjau Tema Gelap (Sidebar):</p>
              <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <div className="shrink-0 p-1 bg-slate-950 rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-500/10 flex items-center justify-center w-11 h-11 overflow-hidden">
                  {appLogoUrl ? (
                    <img 
                      src={appLogoUrl} 
                      alt="Logo Kecil" 
                      className="w-9 h-9 object-contain rounded-lg"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <PetaKomandoIcon size={38} className="animate-pulse" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono">Peta Komando</h4>
                  <p className="text-[10px] font-extrabold text-slate-200 tracking-tight">RRI BANDAR LAMPUNG</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="md:col-span-7 space-y-3.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Unggah Berkas Logo Kecil
            </label>

            {/* Drop / Select Zone */}
            <div 
              onClick={() => appLogoInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                uploadingTarget === 'appLogo'
                  ? 'border-cyan-500 bg-cyan-50/50'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30'
              }`}
            >
              <input 
                ref={appLogoInputRef}
                type="file" 
                accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0], 'appLogo');
                  }
                }}
              />
              {uploadingTarget === 'appLogo' ? (
                <>
                  <RefreshCw className="w-6 h-6 text-cyan-600 animate-spin" />
                  <p className="text-xs font-bold text-cyan-800">{uploadProgressMsg}</p>
                </>
              ) : (
                <>
                  <div className="p-2.5 bg-white shadow-xs rounded-xl text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik atau seret file gambar logo kecil ke sini
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Rekomendasi rasio 1:1 (Persegi/Transparan), PNG/SVG/JPG maks 5MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* URL or Google Drive Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Atau tempelkan URL / link gambar langsung"
                  value={appLogoUrl || ''}
                  onChange={(e) => setAppLogoUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                />
                {appLogoUrl && (
                  <button
                    type="button"
                    onClick={() => handleResetAsset('appLogo')}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all cursor-pointer"
                    title="Hapus dan kembalikan ke logo default"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {appLogoDriveLink && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-mono truncate">{appLogoDriveLink}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(appLogoDriveLink, 'appLogo')}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                      title="Salin tautan Google Drive"
                    >
                      {copiedId === 'appLogo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={appLogoDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded-md"
                      title="Buka di Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LOGO HALAMAN LOGIN (Branding Utama Login)                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">2. Logo Halaman Login</h3>
              <p className="text-[11px] text-slate-500">Logo utama yang ditampilkan tepat di atas formulir login pengguna.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loginLogoUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                <ImageIcon className="w-3 h-3" />
                Logo Login Kustom Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                Logo Default (Peta Komando Vector)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Live Preview Login Card */}
          <div className="md:col-span-5 space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pratinjau Nyata (Halaman Login)
            </label>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-[10px] font-mono text-slate-400">Pratinjau Kotak Login:</p>
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center space-y-2 flex flex-col items-center justify-center min-h-[110px]">
                {loginLogoUrl ? (
                  <img 
                    src={loginLogoUrl} 
                    alt="Logo Login" 
                    className="max-h-16 max-w-[240px] w-auto h-auto object-contain drop-shadow-md mx-auto"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <PetaKomandoLogo size="md" className="max-w-[220px]" />
                )}
                <p className="text-[9px] text-slate-400 font-medium">Sistem Monitoring & Evaluasi Kinerja Terpadu</p>
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="md:col-span-7 space-y-3.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Unggah Berkas Logo Halaman Login
            </label>

            {/* Drop / Select Zone */}
            <div 
              onClick={() => loginLogoInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                uploadingTarget === 'loginLogo'
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30'
              }`}
            >
              <input 
                ref={loginLogoInputRef}
                type="file" 
                accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0], 'loginLogo');
                  }
                }}
              />
              {uploadingTarget === 'loginLogo' ? (
                <>
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-indigo-800">{uploadProgressMsg}</p>
                </>
              ) : (
                <>
                  <div className="p-2.5 bg-white shadow-xs rounded-xl text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik atau seret file gambar logo login ke sini
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Rekomendasi rasio memanjang 3:1 (misal 400x133px atau 600x200px), transparan PNG/SVG
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* URL or Google Drive Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Atau tempelkan URL gambar logo login"
                  value={loginLogoUrl || ''}
                  onChange={(e) => setLoginLogoUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                />
                {loginLogoUrl && (
                  <button
                    type="button"
                    onClick={() => handleResetAsset('loginLogo')}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all cursor-pointer"
                    title="Hapus dan kembalikan ke logo default"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {loginLogoDriveLink && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-mono truncate">{loginLogoDriveLink}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(loginLogoDriveLink, 'loginLogo')}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                      title="Salin tautan Google Drive"
                    >
                      {copiedId === 'loginLogo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={loginLogoDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded-md"
                      title="Buka di Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LOGO & BANNER SPLASH SCREEN (Layar Sinkronisasi & Pemuatan)            */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-cyan-300 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">3. Logo & Banner Splash Screen</h3>
              <p className="text-[11px] text-slate-500">Tampilan visual utama saat aplikasi sedang memuat & menghubungkan basis data.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {splashLogoUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                <ImageIcon className="w-3 h-3" />
                Splash Screen Kustom Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                Splash Screen Default
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Live Preview Splash Screen */}
          <div className="md:col-span-5 space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pratinjau Nyata (Layar Pemuatan)
            </label>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-[10px] font-mono text-slate-400">Pratinjau Splash Container:</p>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center space-y-2 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-transparent to-indigo-500/10 animate-pulse" />
                {splashLogoUrl ? (
                  <img 
                    src={splashLogoUrl} 
                    alt="Splash Screen" 
                    className="relative z-10 max-h-24 max-w-full w-auto h-auto object-contain rounded-lg drop-shadow-2xl mx-auto"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <PetaKomandoLogo size="md" className="relative z-10 max-w-[240px]" />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[9px] font-mono font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  SINKRONISASI REAL-TIME
                </span>
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="md:col-span-7 space-y-3.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Unggah Berkas Splash Screen
            </label>

            {/* Drop / Select Zone */}
            <div 
              onClick={() => splashLogoInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                uploadingTarget === 'splashLogo'
                  ? 'border-cyan-500 bg-cyan-50/50'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30'
              }`}
            >
              <input 
                ref={splashLogoInputRef}
                type="file" 
                accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0], 'splashLogo');
                  }
                }}
              />
              {uploadingTarget === 'splashLogo' ? (
                <>
                  <RefreshCw className="w-6 h-6 text-cyan-600 animate-spin" />
                  <p className="text-xs font-bold text-cyan-800">{uploadProgressMsg}</p>
                </>
              ) : (
                <>
                  <div className="p-2.5 bg-white shadow-xs rounded-xl text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik atau seret file gambar splash screen ke sini
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Rekomendasi rasio horizontal besar (misal 600x200px atau banner resolusi tinggi)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* URL or Google Drive Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Atau tempelkan URL gambar splash screen"
                  value={splashLogoUrl || ''}
                  onChange={(e) => setSplashLogoUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                />
                {splashLogoUrl && (
                  <button
                    type="button"
                    onClick={() => handleResetAsset('splashLogo')}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all cursor-pointer"
                    title="Hapus dan kembalikan ke splash screen default"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {splashLogoDriveLink && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-mono truncate">{splashLogoDriveLink}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(splashLogoDriveLink, 'splashLogo')}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                      title="Salin tautan Google Drive"
                    >
                      {copiedId === 'splashLogo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={splashLogoDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded-md"
                      title="Buka di Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Save Button Card */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Simpan & Terapkan Perubahan Branding</p>
            <p className="text-[11px] text-slate-500">Perubahan akan langsung diperbarui ke Firestore & Cloud SQL secara permanen.</p>
          </div>
        </div>

        <button
          id="btn-save-branding-settings"
          type="button"
          onClick={() => handleSaveAll()}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Tersimpan & Diterapkan</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Simpan & Terapkan ke Peta Komando</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
