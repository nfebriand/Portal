import React, { useState, useEffect, useMemo } from 'react';
import { 
  Employee, 
  EducationHistory, 
  TrainingHistory, 
  EmployeeCompetency 
} from '../../types';
import PelatihanTahunanTracker, { computeEmployeeAnnualTrainings } from './PelatihanTahunanTracker';
import { 
  X, 
  User, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Clock, 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  Calendar, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface EmployeeModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null; // If null => create new employee
  onSave: (employee: Employee) => void;
  currentUser?: any;
  canDelete?: boolean;
}

export default function EmployeeModalForm({
  isOpen,
  onClose,
  employee,
  onSave,
  currentUser,
  canDelete = true
}: EmployeeModalFormProps) {
  const currentYear = new Date().getFullYear();

  // Active Tab within modal (1 through 6)
  const [activeFormTab, setActiveFormTab] = useState<number>(1);

  // Pagination for sublists in modal (Max 20 items per page)
  const [modalEduPage, setModalEduPage] = useState<number>(1);
  const [modalTrPage, setModalTrPage] = useState<number>(1);
  const [modalCompPage, setModalCompPage] = useState<number>(1);
  const modalItemsPerPage = 20;

  // Tab 1: Identitas Pegawai
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [nip, setNip] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [gelarDepan, setGelarDepan] = useState('');
  const [gelarBelakang, setGelarBelakang] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [surel, setSurel] = useState('');
  const [golDarah, setGolDarah] = useState<'A' | 'B' | 'AB' | 'O' | '-'>('-');
  const [jabatan, setJabatan] = useState<'staf' | 'pengelola' | 'admin bidang' | 'ketua bidang' | 'kepala satker'>('staf');
  const [jenisJabatan, setJenisJabatan] = useState<'fungsional' | 'struktural'>('fungsional');
  const [status, setStatus] = useState<'aktif' | 'pindah' | 'keluar'>('aktif');
  const [divisi, setDivisi] = useState<Employee['divisi']>('Tata Usaha / Umum');
  const [jenjangPendidikan, setJenjangPendidikan] = useState<Employee['jenjangPendidikan']>('S1');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');

  // Tab 2: Riwayat Pendidikan
  const [riwayatPendidikan, setRiwayatPendidikan] = useState<EducationHistory[]>([]);
  const [newEduJenjang, setNewEduJenjang] = useState<EducationHistory['jenjang']>('S1');
  const [newEduInstitusi, setNewEduInstitusi] = useState('');
  const [newEduJurusan, setNewEduJurusan] = useState('');
  const [newEduTahunLulus, setNewEduTahunLulus] = useState<number>(2020);
  const [newEduNoIjazah, setNewEduNoIjazah] = useState('');
  const [newEduGelar, setNewEduGelar] = useState('');
  const [showAddEduForm, setShowAddEduForm] = useState(false);

  // Tab 3: Riwayat Pelatihan
  const [riwayatPelatihan, setRiwayatPelatihan] = useState<TrainingHistory[]>([]);
  const [newTrNama, setNewTrNama] = useState('');
  const [newTrPenyelenggara, setNewTrPenyelenggara] = useState('');
  const [newTrTglMulai, setNewTrTglMulai] = useState('');
  const [newTrTglSelesai, setNewTrTglSelesai] = useState('');
  const [newTrDurasiJam, setNewTrDurasiJam] = useState<number>(20);
  const [newTrTahun, setNewTrTahun] = useState<number>(currentYear);
  const [newTrNoSertifikat, setNewTrNoSertifikat] = useState('');
  const [newTrStatus, setNewTrStatus] = useState<TrainingHistory['status']>('Selesai');
  const [newTrKategori, setNewTrKategori] = useState<TrainingHistory['kategori']>('Teknis');
  const [newTrJenisPerhitungan, setNewTrJenisPerhitungan] = useState<'JP' | 'Non JP'>('JP');
  const [showAddTrForm, setShowAddTrForm] = useState(false);

  // Tab 4: Kompetensi
  const [kompetensiList, setKompetensiList] = useState<EmployeeCompetency[]>([]);
  const [newCompNama, setNewCompNama] = useState('');
  const [newCompKategori, setNewCompKategori] = useState<EmployeeCompetency['kategori']>('Teknis');
  const [newCompLevel, setNewCompLevel] = useState<EmployeeCompetency['tingkatKemahiran']>('Menengah');
  const [newCompSertifikasi, setNewCompSertifikasi] = useState('');
  const [newCompTahun, setNewCompTahun] = useState<number>(currentYear);
  const [showAddCompForm, setShowAddCompForm] = useState(false);

  // Tab 6: Pengaturan User Login
  const [loginRole, setLoginRole] = useState<'Super Admin' | 'Kepala Satker' | 'Ketua Tim' | 'Admin Tim' | 'Staff'>('Staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginActive, setIsLoginActive] = useState(true);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync when employee prop changes
  useEffect(() => {
    if (employee) {
      setNama(employee.nama || '');
      setNik(employee.nik || '');
      setNip(employee.nip || '');
      setTempatLahir(employee.tempatLahir || '');
      setTanggalLahir(employee.tanggalLahir || '');
      setGelarDepan(employee.gelarDepan || '');
      setGelarBelakang(employee.gelarBelakang || '');
      setAlamat(employee.alamat || '');
      setNoHp(employee.noHp || '');
      setSurel(employee.surel || '');
      setGolDarah((employee.golDarah as any) || '-');
      setJabatan((employee.jabatan?.toLowerCase() as any) || 'staf');
      setJenisJabatan((employee.jenisJabatan?.toLowerCase() as any) || 'fungsional');
      setStatus((employee.status?.toLowerCase() as any) || 'aktif');
      setDivisi(employee.divisi || 'Tata Usaha / Umum');
      setJenjangPendidikan(employee.jenjangPendidikan || 'S1');
      setJenisKelamin(employee.jenisKelamin || 'Laki-laki');

      setRiwayatPendidikan(employee.riwayatPendidikan ? [...employee.riwayatPendidikan] : []);
      setRiwayatPelatihan(employee.riwayatPelatihan ? [...employee.riwayatPelatihan] : []);
      setKompetensiList(employee.kompetensi ? [...employee.kompetensi] : []);

      setLoginRole(employee.loginRole || 'Staff');
      setUsername(employee.username || employee.nip || '');
      setPassword(employee.password || 'password123');
      setIsLoginActive(employee.isLoginActive !== undefined ? employee.isLoginActive : true);
    } else {
      // Empty state for new employee
      setNama('');
      setNik('');
      setNip('');
      setTempatLahir('');
      setTanggalLahir('');
      setGelarDepan('');
      setGelarBelakang('');
      setAlamat('');
      setNoHp('');
      setSurel('');
      setGolDarah('-');
      setJabatan('staf');
      setJenisJabatan('fungsional');
      setStatus('aktif');
      setDivisi('Tata Usaha / Umum');
      setJenjangPendidikan('S1');
      setJenisKelamin('Laki-laki');

      setRiwayatPendidikan([]);
      setRiwayatPelatihan([]);
      setKompetensiList([]);

      setLoginRole('Staff');
      setUsername('');
      setPassword('password123');
      setIsLoginActive(true);
    }
    setActiveFormTab(1);
    setModalEduPage(1);
    setModalTrPage(1);
    setModalCompPage(1);
    setFormErrors({});
  }, [employee, isOpen]);

  const totalModalEduPages = Math.max(1, Math.ceil(riwayatPendidikan.length / modalItemsPerPage));
  const paginatedModalEdu = useMemo(() => {
    const start = (modalEduPage - 1) * modalItemsPerPage;
    return riwayatPendidikan.slice(start, start + modalItemsPerPage);
  }, [riwayatPendidikan, modalEduPage, modalItemsPerPage]);

  const totalModalTrPages = Math.max(1, Math.ceil(riwayatPelatihan.length / modalItemsPerPage));
  const paginatedModalTr = useMemo(() => {
    const start = (modalTrPage - 1) * modalItemsPerPage;
    return riwayatPelatihan.slice(start, start + modalItemsPerPage);
  }, [riwayatPelatihan, modalTrPage, modalItemsPerPage]);

  const totalModalCompPages = Math.max(1, Math.ceil(kompetensiList.length / modalItemsPerPage));
  const paginatedModalComp = useMemo(() => {
    const start = (modalCompPage - 1) * modalItemsPerPage;
    return kompetensiList.slice(start, start + modalItemsPerPage);
  }, [kompetensiList, modalCompPage, modalItemsPerPage]);

  // Construct dummy temp employee object for real-time calculation in tab 5
  const tempEmployeeForCalculation: Employee = useMemo(() => {
    return {
      id: employee?.id || 'temp',
      nik,
      nip,
      nama,
      gelarDepan,
      gelarBelakang,
      alamat,
      noHp,
      surel,
      golDarah,
      jabatan,
      jenisJabatan,
      status,
      jenjangPendidikan,
      divisi,
      jenisKelamin,
      riwayatPendidikan,
      riwayatPelatihan,
      kompetensi: kompetensiList,
      loginRole,
      username,
      password,
      isLoginActive,
      createdAt: employee?.createdAt || new Date().toISOString()
    };
  }, [
    employee,
    nik,
    nip,
    nama,
    gelarDepan,
    gelarBelakang,
    alamat,
    noHp,
    surel,
    golDarah,
    jabatan,
    jenisJabatan,
    status,
    jenjangPendidikan,
    divisi,
    jenisKelamin,
    riwayatPendidikan,
    riwayatPelatihan,
    kompetensiList,
    loginRole,
    username,
    password,
    isLoginActive
  ]);

  if (!isOpen) return null;

  // Add Education Handler
  const handleAddEducation = () => {
    if (!newEduInstitusi.trim() || !newEduJurusan.trim()) {
      alert('Nama Institusi dan Jurusan wajib diisi.');
      return;
    }
    const newEdu: EducationHistory = {
      id: `edu-${Date.now()}`,
      jenjang: newEduJenjang,
      institusi: newEduInstitusi,
      jurusan: newEduJurusan,
      tahunLulus: Number(newEduTahunLulus) || 2020,
      nomorIjazah: newEduNoIjazah,
      gelar: newEduGelar
    };
    setRiwayatPendidikan([...riwayatPendidikan, newEdu]);
    setNewEduInstitusi('');
    setNewEduJurusan('');
    setNewEduNoIjazah('');
    setNewEduGelar('');
    setShowAddEduForm(false);
  };

  const handleDeleteEducation = (id: string) => {
    setRiwayatPendidikan(riwayatPendidikan.filter(e => e.id !== id));
  };

  // Add Training Handler
  const handleAddTraining = () => {
    if (!newTrNama.trim() || !newTrPenyelenggara.trim()) {
      alert('Nama Pelatihan dan Penyelenggara wajib diisi.');
      return;
    }
    const newTr: TrainingHistory = {
      id: `tr-${Date.now()}`,
      namaPelatihan: newTrNama,
      penyelenggara: newTrPenyelenggara,
      tanggalMulai: newTrTglMulai,
      tanggalSelesai: newTrTglSelesai,
      durasiJam: Number(newTrDurasiJam) || 0,
      tahun: Number(newTrTahun) || currentYear,
      nomorSertifikat: newTrNoSertifikat,
      status: newTrStatus,
      kategori: newTrKategori,
      jenisPerhitungan: newTrJenisPerhitungan
    };
    setRiwayatPelatihan([...riwayatPelatihan, newTr]);
    setNewTrNama('');
    setNewTrPenyelenggara('');
    setNewTrTglMulai('');
    setNewTrTglSelesai('');
    setNewTrDurasiJam(20);
    setNewTrNoSertifikat('');
    setNewTrJenisPerhitungan('JP');
    setShowAddTrForm(false);
  };

  const handleDeleteTraining = (id: string) => {
    setRiwayatPelatihan(riwayatPelatihan.filter(t => t.id !== id));
  };

  // Add Competency Handler
  const handleAddCompetency = () => {
    if (!newCompNama.trim()) {
      alert('Nama Kompetensi wajib diisi.');
      return;
    }
    const newComp: EmployeeCompetency = {
      id: `comp-${Date.now()}`,
      namaKompetensi: newCompNama,
      kategori: newCompKategori,
      tingkatKemahiran: newCompLevel,
      sertifikasi: newCompSertifikasi,
      tahunPerolehan: Number(newCompTahun) || currentYear
    };
    setKompetensiList([...kompetensiList, newComp]);
    setNewCompNama('');
    setNewCompSertifikasi('');
    setShowAddCompForm(false);
  };

  const handleDeleteCompetency = (id: string) => {
    setKompetensiList(kompetensiList.filter(c => c.id !== id));
  };

  // Save Final Employee Data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!nama.trim()) errors.nama = 'Nama lengkap wajib diisi.';
    if (!nip.trim()) errors.nip = 'NIP wajib diisi.';
    if (!nik.trim()) errors.nik = 'NIK wajib diisi.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActiveFormTab(1);
      return;
    }

    const payload: Employee = {
      id: employee ? employee.id : `emp-${Date.now()}`,
      nik: nik.trim(),
      nip: nip.trim(),
      nama: nama.trim(),
      tempatLahir: tempatLahir.trim(),
      tanggalLahir,
      gelarDepan: gelarDepan.trim(),
      gelarBelakang: gelarBelakang.trim(),
      alamat: alamat.trim(),
      noHp: noHp.trim(),
      surel: surel.trim(),
      golDarah,
      jabatan,
      jenisJabatan,
      status,
      jenjangPendidikan,
      divisi,
      jenisKelamin,
      riwayatPendidikan,
      riwayatPelatihan,
      kompetensi: kompetensiList,
      loginRole,
      username: username.trim() || nip.trim(),
      password: password || 'password123',
      isLoginActive,
      createdAt: employee ? employee.createdAt : new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
              PENGATURAN DATA PEGAWAI
            </span>
            <h3 className="text-base font-black text-white">
              {employee ? `Edit Pegawai: ${employee.nama}` : 'Registrasi Pegawai Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Tabs Navigation */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-6 pt-3 flex gap-2 overflow-x-auto shrink-0 select-none">
          {[
            { id: 1, label: '1. Identitas Pegawai', icon: User },
            { id: 2, label: '2. Riwayat Pendidikan', icon: GraduationCap },
            { id: 3, label: '3. Riwayat Pelatihan', icon: Award },
            { id: 4, label: '4. Kompetensi', icon: Sparkles },
            { id: 5, label: '5. Pelatihan 40 Jam/Thn', icon: Clock },
            { id: 6, label: '6. Pengaturan User Login', icon: KeyRound }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeFormTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFormTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x shrink-0 ${
                  isActive
                    ? 'bg-white text-indigo-700 border-slate-200 -mb-px shadow-2xs font-extrabold'
                    : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: IDENTITAS PEGAWAI */}
          {activeFormTab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Data Identitas Pegawai
                </h4>
              </div>

              {/* NIK & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Nomor Induk Kependudukan (NIK - 16 Digit) *
                  </label>
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="Contoh: 1871021503750002"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                  {formErrors.nik && <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{formErrors.nik}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    NIP / No. Pegawai (18 Digit) *
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 18))}
                    placeholder="Contoh: 197503151998031001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                  {formErrors.nip && <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{formErrors.nip}</p>}
                </div>
              </div>

              {/* Gelar Depan, Nama Lengkap, Gelar Belakang */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Gelar Depan</label>
                  <input
                    type="text"
                    value={gelarDepan}
                    onChange={(e) => setGelarDepan(e.target.value)}
                    placeholder="Contoh: Drs. / Ir. / Dr."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600 font-bold"
                  />
                  {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{formErrors.nama}</p>}
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Gelar Belakang</label>
                  <input
                    type="text"
                    value={gelarBelakang}
                    onChange={(e) => setGelarBelakang(e.target.value)}
                    placeholder="Contoh: M.Si. / S.Kom."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder="Contoh: Bandar Lampung"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600 text-slate-700"
                  />
                </div>
              </div>

              {/* Surel, No HP & Golongan Darah */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Surel (Email Pegawai)</label>
                  <input
                    type="email"
                    value={surel}
                    onChange={(e) => setSurel(e.target.value)}
                    placeholder="nama.pegawai@rri.go.id"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Golongan Darah</label>
                  <select
                    value={golDarah}
                    onChange={(e) => setGolDarah(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="-">- Pilih -</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>

              {/* Jabatan, Fungsional/Struktural, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div>
                  <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                    Jabatan Pegawai *
                  </label>
                  <select
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value as any)}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="staf">Staf</option>
                    <option value="pengelola">Pengelola</option>
                    <option value="admin bidang">Admin Bidang</option>
                    <option value="ketua bidang">Ketua Bidang</option>
                    <option value="kepala satker">Kepala Satker</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                    Jenis Jabatan *
                  </label>
                  <div className="flex gap-2">
                    {['fungsional', 'struktural'].map(jj => (
                      <button
                        key={jj}
                        type="button"
                        onClick={() => setJenisJabatan(jj as any)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                          jenisJabatan === jj
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {jj}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                    Status Pegawai *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600 capitalize"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pindah">Pindah</option>
                    <option value="keluar">Keluar</option>
                  </select>
                </div>
              </div>

              {/* Divisi, Pendidikan & Jenis Kelamin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Divisi / Bidang Kerja</label>
                  <select
                    value={divisi}
                    onChange={(e) => setDivisi(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="Tata Usaha / Umum">Tata Usaha / Umum</option>
                    <option value="Siaran">Siaran</option>
                    <option value="Pemberitaan">Pemberitaan</option>
                    <option value="Teknologi dan Media Baru">Teknologi dan Media Baru</option>
                    <option value="Konten Media Baru">Konten Media Baru</option>
                    <option value="Layanan Pengembangan Usaha">Layanan Pengembangan Usaha</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Pendidikan Terakhir</label>
                  <select
                    value={jenjangPendidikan}
                    onChange={(e) => setJenjangPendidikan(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="SMA">SMA / Sederajat</option>
                    <option value="D3">D3 Akademi</option>
                    <option value="S1">S1 Sarjana</option>
                    <option value="S2">S2 Magister</option>
                    <option value="S3">S3 Doktor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    {['Laki-laki', 'Perempuan'].map(jk => (
                      <button
                        key={jk}
                        type="button"
                        onClick={() => setJenisKelamin(jk as any)}
                        className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          jenisKelamin === jk
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {jk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Alamat Lengkap Domisili</label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  placeholder="Masukkan alamat tempat tinggal..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

            </div>
          )}

          {/* TAB 2: RIWAYAT PENDIDIKAN */}
          {activeFormTab === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Riwayat Pendidikan Formal ({riwayatPendidikan.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEduForm(!showAddEduForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddEduForm ? 'Tutup Form' : 'Tambah Pendidikan'}</span>
                </button>
              </div>

              {/* Add Edu Inline Box */}
              {showAddEduForm && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-800">Input Riwayat Pendidikan Baru</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Jenjang</label>
                      <select
                        value={newEduJenjang}
                        onChange={(e) => setNewEduJenjang(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="SMA">SMA / SMK</option>
                        <option value="D3">D3</option>
                        <option value="D4">D4</option>
                        <option value="S1">S1 Sarjana</option>
                        <option value="S2">S2 Magister</option>
                        <option value="S3">S3 Doktor</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Institusi / Universitas *</label>
                      <input
                        type="text"
                        value={newEduInstitusi}
                        onChange={(e) => setNewEduInstitusi(e.target.value)}
                        placeholder="Universitas Indonesia"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Program Studi / Jurusan *</label>
                      <input
                        type="text"
                        value={newEduJurusan}
                        onChange={(e) => setNewEduJurusan(e.target.value)}
                        placeholder="Ilmu Komunikasi"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tahun Lulus</label>
                      <input
                        type="number"
                        value={newEduTahunLulus}
                        onChange={(e) => setNewEduTahunLulus(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nomor Ijazah</label>
                      <input
                        type="text"
                        value={newEduNoIjazah}
                        onChange={(e) => setNewEduNoIjazah(e.target.value)}
                        placeholder="UI/IKOM/2012/..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Gelar Diperoleh</label>
                      <input
                        type="text"
                        value={newEduGelar}
                        onChange={(e) => setNewEduGelar(e.target.value)}
                        placeholder="S.Sos."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEduForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-xs"
                    >
                      Simpan Pendidikan
                    </button>
                  </div>
                </div>
              )}

              {/* Edu List */}
              {riwayatPendidikan.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Belum ada data riwayat pendidikan. Klik "Tambah Pendidikan" di atas untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paginatedModalEdu.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[10px]">
                            {edu.jenjang}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{edu.institusi}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          <strong>Jurusan:</strong> {edu.jurusan} {edu.gelar ? `(${edu.gelar})` : ''} • <strong>Lulus:</strong> {edu.tahunLulus}
                        </p>
                        {edu.nomorIjazah && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            No. Ijazah: {edu.nomorIjazah}
                          </p>
                        )}
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(edu.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Pagination Controls for Edu */}
                  {totalModalEduPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <p className="text-[11px] text-slate-500">
                        Hal. {modalEduPage} dari {totalModalEduPages} ({riwayatPendidikan.length} total)
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModalEduPage(p => Math.max(1, p - 1))}
                          disabled={modalEduPage === 1}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" /> Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalEduPage(p => Math.min(totalModalEduPages, p + 1))}
                          disabled={modalEduPage === totalModalEduPages}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          Next <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RIWAYAT PELATIHAN */}
          {activeFormTab === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Riwayat Pelatihan / Diklat / Bimtek ({riwayatPelatihan.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTrForm(!showAddTrForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddTrForm ? 'Tutup Form' : 'Tambah Pelatihan'}</span>
                </button>
              </div>

              {/* Add Training Inline Box */}
              {showAddTrForm && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-800">Input Data Pelatihan Baru</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Diklat / Pelatihan / Workshop *</label>
                      <input
                        type="text"
                        value={newTrNama}
                        onChange={(e) => setNewTrNama(e.target.value)}
                        placeholder="Pelatihan Kepemimpinan Administrator (PKA)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Penyelenggara *</label>
                      <input
                        type="text"
                        value={newTrPenyelenggara}
                        onChange={(e) => setNewTrPenyelenggara(e.target.value)}
                        placeholder="Pusdiklat RRI / LAN"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Jenis Jam *</label>
                      <select
                        value={newTrJenisPerhitungan}
                        onChange={(e) => setNewTrJenisPerhitungan(e.target.value as 'JP' | 'Non JP')}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                          newTrJenisPerhitungan === 'JP'
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-300 text-slate-600'
                        }`}
                      >
                        <option value="JP">JP (Dihitung 40 Jam)</option>
                        <option value="Non JP">Non JP (Tidak Dihitung)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Durasi ({newTrJenisPerhitungan === 'JP' ? 'JP' : 'Jam'}) *</label>
                      <input
                        type="number"
                        value={newTrDurasiJam}
                        onChange={(e) => setNewTrDurasiJam(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tahun Pelaksanaan *</label>
                      <input
                        type="number"
                        value={newTrTahun}
                        onChange={(e) => setNewTrTahun(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Kategori</label>
                      <select
                        value={newTrKategori}
                        onChange={(e) => setNewTrKategori(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="Teknis">Teknis</option>
                        <option value="Manajerial">Manajerial</option>
                        <option value="Fungsional">Fungsional</option>
                        <option value="Sosial Kultural">Sosial Kultural</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Status</label>
                      <select
                        value={newTrStatus}
                        onChange={(e) => setNewTrStatus(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="Selesai">Selesai</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Sedang Berjalan">Sedang Berjalan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={newTrTglMulai}
                        onChange={(e) => setNewTrTglMulai(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={newTrTglSelesai}
                        onChange={(e) => setNewTrTglSelesai(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nomor Sertifikat</label>
                      <input
                        type="text"
                        value={newTrNoSertifikat}
                        onChange={(e) => setNewTrNoSertifikat(e.target.value)}
                        placeholder="LAN-2026-..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTrForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTraining}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-xs"
                    >
                      Simpan Pelatihan
                    </button>
                  </div>
                </div>
              )}

              {/* Training List */}
              {riwayatPelatihan.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Belum ada data riwayat pelatihan. Klik "Tambah Pelatihan" di atas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paginatedModalTr.map((tr) => {
                    const isJP = tr.jenisPerhitungan !== 'Non JP';
                    return (
                      <div
                        key={tr.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">{tr.namaPelatihan}</span>
                            {isJP ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-black text-[10px] border border-indigo-200">
                                {tr.durasiJam} JP (Dihitung 40 Jam)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
                                {tr.durasiJam} Jam (Non JP)
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                              Tahun {tr.tahun}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            <strong>Penyelenggara:</strong> {tr.penyelenggara} • <strong>Kategori:</strong> {tr.kategori || '-'}
                          </p>
                          {tr.nomorSertifikat && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              No. Sertifikat: {tr.nomorSertifikat}
                            </p>
                          )}
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTraining(tr.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination Controls for Training */}
                  {totalModalTrPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <p className="text-[11px] text-slate-500">
                        Hal. {modalTrPage} dari {totalModalTrPages} ({riwayatPelatihan.length} total)
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModalTrPage(p => Math.max(1, p - 1))}
                          disabled={modalTrPage === 1}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" /> Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalTrPage(p => Math.min(totalModalTrPages, p + 1))}
                          disabled={modalTrPage === totalModalTrPages}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          Next <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KOMPETENSI */}
          {activeFormTab === 4 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Daftar Kompetensi & Sertifikasi Keahlian ({kompetensiList.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCompForm(!showAddCompForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddCompForm ? 'Tutup Form' : 'Tambah Kompetensi'}</span>
                </button>
              </div>

              {/* Add Comp Inline Box */}
              {showAddCompForm && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-800">Input Data Kompetensi Baru</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Kompetensi / Keahlian *</label>
                      <input
                        type="text"
                        value={newCompNama}
                        onChange={(e) => setNewCompNama(e.target.value)}
                        placeholder="Produksi Siaran Digital / Pemancar FM / Akuntansi SAKIP"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Kategori</label>
                      <select
                        value={newCompKategori}
                        onChange={(e) => setNewCompKategori(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="Teknis">Teknis</option>
                        <option value="Manajerial">Manajerial</option>
                        <option value="Digital & IT">Digital & IT</option>
                        <option value="Sosial Kultural">Sosial Kultural</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tingkat Kemahiran</label>
                      <select
                        value={newCompLevel}
                        onChange={(e) => setNewCompLevel(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="Dasar">Dasar</option>
                        <option value="Menengah">Menengah</option>
                        <option value="Lanjutan">Lanjutan</option>
                        <option value="Ahli">Ahli</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Sertifikasi Kompetensi (Opsional)</label>
                      <input
                        type="text"
                        value={newCompSertifikasi}
                        onChange={(e) => setNewCompSertifikasi(e.target.value)}
                        placeholder="Sertifikasi BNSP Penyiar Madya"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tahun Perolehan</label>
                      <input
                        type="number"
                        value={newCompTahun}
                        onChange={(e) => setNewCompTahun(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCompForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCompetency}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-xs"
                    >
                      Simpan Kompetensi
                    </button>
                  </div>
                </div>
              )}

              {/* Comp List */}
              {kompetensiList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Belum ada data kompetensi. Klik "Tambah Kompetensi" di atas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginatedModalComp.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl flex justify-between items-start shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">{comp.namaKompetensi}</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                              {comp.tingkatKemahiran}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Kategori: {comp.kategori}
                          </p>
                          {comp.sertifikasi && (
                            <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {comp.sertifikasi} ({comp.tahunPerolehan || '-'})
                            </p>
                          )}
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCompetency(comp.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls for Competency */}
                  {totalModalCompPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <p className="text-[11px] text-slate-500">
                        Hal. {modalCompPage} dari {totalModalCompPages} ({kompetensiList.length} total)
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModalCompPage(p => Math.max(1, p - 1))}
                          disabled={modalCompPage === 1}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" /> Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalCompPage(p => Math.min(totalModalCompPages, p + 1))}
                          disabled={modalCompPage === totalModalCompPages}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          Next <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RIWAYAT PELATIHAN TAHUNAN MINIMAL 40 JAM PER TAHUN (TERHUBUNG KE NO 3) */}
          {activeFormTab === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 text-xs flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                <p>
                  Bagian ini <strong>terhubung otomatis</strong> dengan data di <strong>Tab 3 (Riwayat Pelatihan)</strong> untuk menghitung total akumulasi jam pelajaran per tahun dan memverifikasi batas minimal 40 Jam/Tahun.
                </p>
              </div>

              <PelatihanTahunanTracker employee={tempEmployeeForCalculation} />
            </div>
          )}

          {/* TAB 6: PENGATURAN USER LOGIN */}
          {activeFormTab === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Pengaturan Kredensial & Hak Akses Login
                </h4>
              </div>

              {/* Role Akses (Super Admin, Kepala Satker, Ketua Tim, Admin Tim, Staff) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Pilih Role Akses Sistem:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Super Admin', 'Kepala Satker', 'Ketua Tim', 'Admin Tim', 'Staff'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setLoginRole(r)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        loginRole === r
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Username Login (Default: NIP / Surel)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={nip || "Masukkan username"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Pegawai dapat masuk menggunakan NIP, NIK, Surel, atau username ini.</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Default kata sandi baru: <code>password123</code></p>
                </div>
              </div>

              {/* Status Akun Aktif Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status Akses Login Pegawai</span>
                  <span className="text-[10px] text-slate-500">
                    Jika dinonaktifkan, akun ini tidak akan dapat login ke sistem portal.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoginActive(!isLoginActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isLoginActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  {isLoginActive ? '✓ Akun Aktif' : '✗ Non-Aktif'}
                </button>
              </div>

            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Harap pastikan semua tab data terisi dengan akurat sebelum menyimpan.
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {employee ? 'Simpan Perubahan Pegawai' : 'Registrasi Pegawai'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
