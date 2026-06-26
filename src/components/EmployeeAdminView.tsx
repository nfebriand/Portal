import React, { useState } from 'react';
import { Employee } from '../types';
import SignaturePad from './SignaturePad';
import { Search, UserPlus, Trash2, Edit2, Check, X, ShieldAlert, BadgeInfo, Phone, MapPin, Eye, FileDigit, Landmark, GraduationCap } from 'lucide-react';

interface EmployeeAdminViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  currentUser?: {
    id: string;
    name: string;
    role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin';
    division?: string;
    photo?: string;
  } | null;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces', // Female Professional
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces', // Male Professional
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces', // Female Tech
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces', // Male Tech
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces', // Female Exec
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces'  // Male Exec
];

export default function EmployeeAdminView({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  currentUser
}: EmployeeAdminViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivFilter, setSelectedDivFilter] = useState('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Form State
  const [formNIK, setFormNIK] = useState('');
  const [formNIP, setFormNIP] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formGelarDepan, setFormGelarDepan] = useState('');
  const [formGelarBelakang, setFormGelarBelakang] = useState('');
  const [formPendidikan, setFormPendidikan] = useState<'SMA' | 'D3' | 'S1' | 'S2' | 'S3'>('S1');
  const [formDivisi, setFormDivisi] = useState<Employee['divisi']>('Siaran');
  const [formGender, setFormGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formAlamat, setFormAlamat] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formFoto, setFormFoto] = useState(PRESET_AVATARS[0]);
  const [formTtd, setFormTtd] = useState('');
  const [formRole, setFormRole] = useState<'Staff' | 'Ketua Bidang' | 'Superadmin'>('Staff');
  const [formIsEditor, setFormIsEditor] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Trigger editing state
  const startEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormNIK(emp.nik);
    setFormNIP(emp.nip);
    setFormNama(emp.nama);
    setFormGelarDepan(emp.gelarDepan);
    setFormGelarBelakang(emp.gelarBelakang);
    setFormPendidikan(emp.jenjangPendidikan);
    setFormDivisi(emp.divisi);
    setFormGender(emp.jenisKelamin);
    setFormAlamat(emp.alamat);
    setFormNoHp(emp.noHp);
    setFormFoto(emp.foto);
    setFormTtd(emp.ttdElektronik);
    setFormRole(emp.role || 'Staff');
    setFormIsEditor(emp.isEditor || false);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Trigger empty form state
  const startCreate = () => {
    setEditingEmployee(null);
    setFormNIK('');
    setFormNIP('');
    setFormNama('');
    setFormGelarDepan('');
    setFormGelarBelakang('');
    setFormPendidikan('S1');
    setFormDivisi('Siaran');
    setFormGender('Laki-laki');
    setFormAlamat('');
    setFormNoHp('');
    setFormFoto(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setFormTtd('');
    setFormRole('Staff');
    setFormIsEditor(false);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Basic Validation Rules in Indonesian
    if (!formNIK.match(/^\d{16}$/)) {
      errors.nik = "NIK harus berisi tepat 16 digit angka.";
    }
    if (!formNIP.match(/^\d{18}$/)) {
      errors.nip = "NIP harus berisi tepat 18 digit angka.";
    }
    if (!formNama.trim()) {
      errors.nama = "Nama lengkap harus diisi.";
    }
    if (!formAlamat.trim()) {
      errors.alamat = "Alamat domisili harus diisi.";
    }
    if (!formNoHp.match(/^(\+62|62|0)8[1-9][0-9]{6,11}$/)) {
      errors.noHp = "No HP/WA tidak valid (Contoh: 081234567890).";
    }
    if (!formTtd) {
      errors.ttd = "Tanda tangan digital harus diisi.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const employeeData: Employee = {
      id: editingEmployee ? editingEmployee.id : Math.random().toString(36).substr(2, 9),
      nik: formNIK,
      nip: formNIP,
      nama: formNama,
      gelarDepan: formGelarDepan,
      gelarBelakang: formGelarBelakang,
      jenjangPendidikan: formPendidikan,
      divisi: formDivisi,
      jenisKelamin: formGender,
      alamat: formAlamat,
      noHp: formNoHp,
      foto: formFoto,
      ttdElektronik: formTtd,
      role: formRole || editingEmployee?.role || 'Staff',
      isEditor: formIsEditor !== undefined ? formIsEditor : editingEmployee?.isEditor || false,
      createdAt: editingEmployee ? editingEmployee.createdAt : new Date().toISOString()
    };

    if (editingEmployee) {
      onUpdateEmployee(employeeData);
      // Update viewing detail if currently selected
      if (viewingEmployee?.id === editingEmployee.id) {
        setViewingEmployee(employeeData);
      }
    } else {
      onAddEmployee(employeeData);
    }

    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setFormFoto(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Format Nama Lengkap Gelar
  const formatFullName = (emp: Employee) => {
    let full = emp.nama;
    if (emp.gelarDepan) full = `${emp.gelarDepan} ${full}`;
    if (emp.gelarBelakang) full = `${full}, ${emp.gelarBelakang}`;
    return full;
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = 
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.includes(searchQuery) ||
      emp.nip.includes(searchQuery);
    
    const matchDiv = selectedDivFilter === 'Semua' || emp.divisi === selectedDivFilter;
    return matchSearch && matchDiv;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Columns - Employee Database List */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Table Operations Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Landmark className="w-4.5 h-4.5 text-slate-500" />
              Database Kepegawaian ({filteredEmployees.length})
            </h2>
            <button
              onClick={startCreate}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Pegawai Baru
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari NIK, NIP, atau nama pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-slate-400 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs transition-all text-slate-800"
              />
            </div>

            {/* Division Filter */}
            <select
              value={selectedDivFilter}
              onChange={(e) => setSelectedDivFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-hidden"
            >
              <option value="Semua">Semua Divisi</option>
              <option value="Tata Usaha / Umum">Tata Usaha / Umum</option>
              <option value="Siaran">Siaran</option>
              <option value="Pemberitaan">Pemberitaan</option>
              <option value="Teknologi dan Media Baru">Teknologi dan Media Baru</option>
              <option value="Konten Media Baru">Konten Media Baru</option>
              <option value="Layanan Pengembangan Usaha">Layanan Pengembangan Usaha</option>
            </select>
          </div>
        </div>

        {/* Employee List Grid/List for Mobile compatibility */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">NIK / NIP</th>
                  <th className="px-5 py-3">Divisi</th>
                  <th className="px-5 py-3">Pendidikan</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                      Tidak ada data pegawai ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        viewingEmployee?.id === emp.id ? 'bg-slate-50' : ''
                      }`}
                      onClick={() => setViewingEmployee(emp)}
                    >
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img 
                          src={emp.foto} 
                          alt={emp.nama} 
                          className="w-9 h-9 rounded-full object-cover border border-slate-100 bg-slate-50 shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-800 text-xs">{formatFullName(emp)}</p>
                            {emp.role === 'Superadmin' && (
                              <span className="text-[8px] bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold px-1 py-0.2 rounded-sm uppercase tracking-tight">Super</span>
                            )}
                            {emp.role === 'Ketua Bidang' && (
                              <span className="text-[8px] bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-1 py-0.2 rounded-sm uppercase tracking-tight">Ketua</span>
                            )}
                            {emp.isEditor && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold px-1 py-0.2 rounded-sm uppercase tracking-tight">Editor</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.jenisKelamin}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        <p className="font-medium text-[10px]">NIK: {emp.nik}</p>
                        <p className="text-[10px] text-slate-400">NIP: {emp.nip}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${
                          emp.divisi === 'Teknologi dan Media Baru' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          emp.divisi === 'Siaran' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          emp.divisi === 'Pemberitaan' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          emp.divisi === 'Konten Media Baru' ? 'bg-violet-50 text-violet-700 border border-violet-100' :
                          emp.divisi === 'Layanan Pengembangan Usaha' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {emp.divisi}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-700">{emp.jenjangPendidikan}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          title="Lihat Detail Kartu"
                          className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEdit(emp)}
                          title="Edit Pegawai"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          title="Hapus Pegawai"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive card list */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic text-xs">
                Tidak ada data pegawai ditemukan.
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div 
                  key={emp.id} 
                  className={`p-4 space-y-3 cursor-pointer ${
                    viewingEmployee?.id === emp.id ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => setViewingEmployee(emp)}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={emp.foto} 
                      alt={emp.nama} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-slate-800 text-xs truncate">{formatFullName(emp)}</p>
                        {emp.role === 'Superadmin' && (
                          <span className="text-[8px] bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold px-1 rounded-sm uppercase tracking-tight">Super</span>
                        )}
                        {emp.role === 'Ketua Bidang' && (
                          <span className="text-[8px] bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-1 rounded-sm uppercase tracking-tight">Ketua</span>
                        )}
                        {emp.isEditor && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold px-1 rounded-sm uppercase tracking-tight">Editor</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">{emp.divisi} • {emp.jenjangPendidikan}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 font-mono text-[10px] text-slate-500">
                    <p><span className="font-semibold text-slate-700">NIK:</span> {emp.nik}</p>
                    <p><span className="font-semibold text-slate-700">NIP:</span> {emp.nip}</p>
                  </div>

                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingEmployee(emp)}
                      className="flex items-center gap-1 border border-slate-200 text-[10px] font-semibold text-slate-600 px-2 py-1 rounded-md bg-white hover:bg-slate-50"
                    >
                      <Eye className="w-3 h-3" /> Detail
                    </button>
                    <button
                      onClick={() => startEdit(emp)}
                      className="flex items-center gap-1 border border-slate-200 text-[10px] font-semibold text-indigo-600 px-2 py-1 rounded-md bg-white hover:bg-indigo-50"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="flex items-center gap-1 border border-rose-100 text-[10px] font-semibold text-rose-500 px-2 py-1 rounded-md bg-white hover:bg-rose-50"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Card / Detail / Form View */}
      <div className="space-y-6">
        
        {/* Interactive Employee ID Card Showcase */}
        {viewingEmployee && !isFormOpen && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="bg-slate-900 text-white p-4 pb-14 text-center relative">
              <div className="absolute top-3 left-3 bg-amber-500 text-[9px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                ID CARD DIGITAL
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">INSTANSI PENYIARAN RADIO</p>
              <p className="text-[10px] font-bold text-slate-500 font-mono">STASIUN UTAMA DIGITAL</p>
            </div>

            {/* Profile Placement offset */}
            <div className="-mt-11 flex flex-col items-center px-4 pb-4">
              <img 
                src={viewingEmployee.foto} 
                alt={viewingEmployee.nama} 
                className="w-22 h-22 rounded-full border-4 border-white object-cover shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <div className="text-center mt-2.5">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{formatFullName(viewingEmployee)}</h3>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{viewingEmployee.divisi}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{viewingEmployee.jenisKelamin}</p>
              </div>

              {/* Data Specifications Grid */}
              <div className="w-full mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-[11px] font-mono text-slate-600">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">NIP</span>
                  <span className="font-semibold text-slate-800">{viewingEmployee.nip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">NIK</span>
                  <span className="font-semibold text-slate-800">{viewingEmployee.nik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">PENDIDIKAN</span>
                  <span className="font-bold text-slate-800">{viewingEmployee.jenjangPendidikan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">NO HP/WA</span>
                  <span className="font-semibold text-slate-800">{viewingEmployee.noHp}</span>
                </div>
                <div className="flex flex-col pt-1.5 border-t border-dashed border-slate-200">
                  <span className="font-bold text-slate-400">ALAMAT DOMISILI</span>
                  <span className="text-slate-700 not-italic font-sans mt-0.5 text-[10px] line-clamp-2">{viewingEmployee.alamat}</span>
                </div>
              </div>

              {/* Special Superadmin Authority Section */}
              {currentUser?.role === 'Superadmin' && (
                <div className="w-full mt-4 bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 space-y-2.5 text-left">
                  <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider font-sans">Superadmin Authority</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-indigo-500 font-sans block">Atur Peran Akses</label>
                    <div className="flex gap-1">
                      {(['Staff', 'Ketua Bidang', 'Superadmin'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const updated = { ...viewingEmployee, role: r };
                            onUpdateEmployee(updated);
                            setViewingEmployee(updated);
                          }}
                          className={`flex-1 text-[9px] font-bold py-1 px-1 rounded-md transition-colors ${
                            (viewingEmployee.role || 'Staff') === r
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-indigo-700 border border-indigo-200/60 hover:bg-indigo-50/50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-indigo-100/50">
                    <span className="text-[9px] font-bold text-indigo-900">Hak Akses Editor</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...viewingEmployee, isEditor: !viewingEmployee.isEditor };
                        onUpdateEmployee(updated);
                        setViewingEmployee(updated);
                      }}
                      className={`text-[9px] font-bold py-0.5 px-2.5 rounded-md transition-all ${
                        viewingEmployee.isEditor
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {viewingEmployee.isEditor ? '✓ Editor' : 'Bukan Editor'}
                    </button>
                  </div>
                </div>
              )}

              {/* Electronic Signature display inside card */}
              <div className="w-full mt-4 flex flex-col items-center justify-center p-2.5 border border-slate-100 rounded-xl bg-slate-50/30">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Tanda Tangan Digital</p>
                {viewingEmployee.ttdElektronik ? (
                  <img 
                    src={viewingEmployee.ttdElektronik} 
                    alt="TTD" 
                    className="max-h-12 max-w-full object-contain mix-blend-multiply py-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <p className="text-[10px] text-rose-500 italic mt-1">Belum Terdaftar</p>
                )}
                <div className="w-24 border-t border-slate-200 mt-1" />
                <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">TERVERTIFIKASI SISTEM</p>
              </div>
            </div>

            <div className="bg-slate-50 p-2 text-[10px] text-slate-400 text-center font-mono border-t border-slate-100">
              ID Generated: {viewingEmployee.id}
            </div>
          </div>
        )}

        {/* Form Modal/Collapsible View */}
        {isFormOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  {editingEmployee ? "Edit Data Pegawai" : "Registrasi Pegawai Baru"}
                </h3>
                <p className="text-[10px] text-slate-300">Harap lengkapi semua parameter wajib.</p>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setEditingEmployee(null); }}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              {/* Form NIK & NIP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">NIK (16 Digit)*</label>
                  <input
                    type="text"
                    value={formNIK}
                    onChange={(e) => setFormNIK(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="Contoh: 3171010..."
                    className={`w-full bg-slate-50/50 border rounded-lg px-2.5 py-1.5 text-xs focus:bg-white ${
                      formErrors.nik ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.nik && <p className="text-[9px] text-rose-500 font-medium">{formErrors.nik}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">NIP (18 Digit)*</label>
                  <input
                    type="text"
                    value={formNIP}
                    onChange={(e) => setFormNIP(e.target.value.replace(/\D/g, '').slice(0, 18))}
                    placeholder="Contoh: 199508..."
                    className={`w-full bg-slate-50/50 border rounded-lg px-2.5 py-1.5 text-xs focus:bg-white ${
                      formErrors.nip ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.nip && <p className="text-[9px] text-rose-500 font-medium">{formErrors.nip}</p>}
                </div>
              </div>

              {/* Gelar Depan, Nama, Gelar Belakang */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Gelar Depan</label>
                  <input
                    type="text"
                    value={formGelarDepan}
                    onChange={(e) => setFormGelarDepan(e.target.value)}
                    placeholder="Dr."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:bg-white"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nama Lengkap*</label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Nanda Febriand"
                    className={`w-full bg-slate-50/50 border rounded-lg px-2.5 py-1.5 text-xs focus:bg-white ${
                      formErrors.nama ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.nama && <p className="text-[9px] text-rose-500 font-medium">{formErrors.nama}</p>}
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Gelar Blk.</label>
                  <input
                    type="text"
                    value={formGelarBelakang}
                    onChange={(e) => setFormGelarBelakang(e.target.value)}
                    placeholder="M.T."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:bg-white"
                  />
                </div>
              </div>

              {/* Gender & Pendidikan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Jenis Kelamin</label>
                  <div className="flex gap-2 text-xs">
                    {['Laki-laki', 'Perempuan'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormGender(g as any)}
                        className={`flex-1 border rounded-lg py-1.5 font-medium transition-colors ${
                          formGender === g 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pendidikan*</label>
                  <select
                    value={formPendidikan}
                    onChange={(e) => setFormPendidikan(e.target.value as any)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white text-slate-700"
                  >
                    <option value="SMA">SMA / Sederajat</option>
                    <option value="D3">D3 Akademi</option>
                    <option value="S1">S1 Sarjana</option>
                    <option value="S2">S2 Magister</option>
                    <option value="S3">S3 Doktor</option>
                  </select>
                </div>
              </div>

              {/* Divisi & No HP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Divisi Kerja*</label>
                  <select
                    value={formDivisi}
                    onChange={(e) => setFormDivisi(e.target.value as any)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white text-slate-700"
                  >
                    <option value="Tata Usaha / Umum">Tata Usaha / Umum</option>
                    <option value="Siaran">Siaran</option>
                    <option value="Pemberitaan">Pemberitaan</option>
                    <option value="Teknologi dan Media Baru">Teknologi dan Media Baru</option>
                    <option value="Konten Media Baru">Konten Media Baru</option>
                    <option value="Layanan Pengembangan Usaha">Layanan Pengembangan Usaha</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">No HP / WhatsApp*</label>
                  <input
                    type="text"
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    placeholder="Contoh: 081234..."
                    className={`w-full bg-slate-50/50 border rounded-lg px-2.5 py-1.5 text-xs focus:bg-white ${
                      formErrors.noHp ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.noHp && <p className="text-[9px] text-rose-500 font-medium">{formErrors.noHp}</p>}
                </div>
              </div>

              {/* Alamat */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Alamat Lengkap Domisili*</label>
                <textarea
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  rows={2}
                  placeholder="Ketik alamat lengkap domisili saat ini..."
                  className={`w-full bg-slate-50/50 border rounded-lg px-2.5 py-1.5 text-xs focus:bg-white ${
                    formErrors.alamat ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
                {formErrors.alamat && <p className="text-[9px] text-rose-500 font-medium">{formErrors.alamat}</p>}
              </div>

              {/* Role & Editor Controls for Admin Form */}
              {currentUser?.role === 'Superadmin' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Peran Sistem (Akses)*</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:bg-white"
                    >
                      <option value="Staff">Staff / Pegawai</option>
                      <option value="Ketua Bidang">Ketua Bidang / Tim</option>
                      <option value="Superadmin">Superadmin</option>
                    </select>
                  </div>

                  <div className="space-y-1 flex flex-col justify-center">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Status Editor</label>
                    <button
                      type="button"
                      onClick={() => setFormIsEditor(!formIsEditor)}
                      className={`w-full py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                        formIsEditor 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {formIsEditor ? '✓ Status Editor: YA' : 'Status Editor: TIDAK'}
                    </button>
                  </div>
                </div>
              )}

              {/* Foto Profile Upload / Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Foto Profil Pegawai</label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <img 
                    src={formFoto} 
                    alt="Preview" 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1.5">
                    {/* Presets Grid */}
                    <div className="flex gap-1.5">
                      {PRESET_AVATARS.map((av, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormFoto(av)}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                            formFoto === av ? 'border-indigo-600 scale-105' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img src={av} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    {/* File Upload Trigger */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SignaturePad Integration */}
              <div className="pt-2">
                <SignaturePad
                  value={formTtd}
                  onChange={(dataUrl) => setFormTtd(dataUrl)}
                  height={110}
                  label="Tanda Tangan Elektronik (Wajib)*"
                />
                {formErrors.ttd && <p className="text-[9px] text-rose-500 font-medium mt-1">{formErrors.ttd}</p>}
              </div>

              {/* Save Controls */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingEmployee(null); }}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-xl text-xs transition-colors shadow-xs"
                >
                  {editingEmployee ? "Simpan Perubahan" : "Registrasi Pegawai"}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Empty State Instruction */}
        {!viewingEmployee && !isFormOpen && (
          <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <BadgeInfo className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">Klik nama pegawai pada tabel database untuk menampilkan Kartu Identitas Digital, rincian kualifikasi, serta validitas Tanda Tangan Elektronik.</p>
          </div>
        )}

      </div>
    </div>
  );
}
