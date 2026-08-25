import React, { useState } from 'react';
import { Employee } from '../../types';
import PelatihanTahunanTracker from './PelatihanTahunanTracker';
import { 
  X, 
  User, 
  GraduationCap, 
  Award, 
  Sparkles, 
  Clock, 
  KeyRound, 
  Edit3, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Heart, 
  ShieldCheck, 
  Briefcase,
  Layers,
  Building2
} from 'lucide-react';

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export default function EmployeeDetailDrawer({
  employee,
  isOpen,
  onClose,
  onEdit
}: EmployeeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  if (!isOpen || !employee) return null;

  const formatFullName = () => {
    let full = employee.nama;
    if (employee.gelarDepan) full = `${employee.gelarDepan} ${full}`;
    if (employee.gelarBelakang) full = `${full}, ${employee.gelarBelakang}`;
    return full;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-start shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase font-mono ${
                (employee.status || 'aktif').toLowerCase() === 'aktif'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                Status: {employee.status || 'Aktif'}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-[11px] text-slate-300 capitalize font-mono">
                {employee.jenisJabatan || 'Fungsional'}
              </span>
            </div>
            <h3 className="text-lg font-black text-white">{formatFullName()}</h3>
            <p className="text-xs text-slate-400 font-mono">NIP: {employee.nip || '-'} • NIK: {employee.nik || '-'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(employee)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6 Tabs Navigator */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2 flex gap-1.5 overflow-x-auto shrink-0 select-none">
          {[
            { id: 1, label: 'Identitas', icon: User },
            { id: 2, label: 'Pendidikan', icon: GraduationCap },
            { id: 3, label: 'Pelatihan', icon: Award },
            { id: 4, label: 'Kompetensi', icon: Sparkles },
            { id: 5, label: '40 Jam/Thn', icon: Clock },
            { id: 6, label: 'User Login', icon: KeyRound }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x shrink-0 ${
                  isActive
                    ? 'bg-white text-indigo-700 border-slate-200 -mb-px font-black shadow-2xs'
                    : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: IDENTITAS */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jabatan</span>
                  <span className="text-xs font-bold text-slate-800 capitalize">{employee.jabatan || 'Staf'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jalur Kepegawaian</span>
                  <span className="text-xs font-bold text-indigo-700 uppercase">{employee.jenisJabatan || 'Fungsional'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Bidang / Unit Kerja</span>
                  <span className="text-xs font-bold text-slate-800">{employee.divisi}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pendidikan Terakhir</span>
                  <span className="text-xs font-bold text-slate-800">{employee.jenjangPendidikan || 'S1'}</span>
                </div>
              </div>

              {/* Personal Info Group */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Informasi Pribadi & Kontak
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold text-slate-800">
                      {employee.tempatLahir || '-'}, {employee.tanggalLahir || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Golongan Darah</span>
                    <span className="font-bold text-rose-600">{employee.golDarah || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Surel (Email)</span>
                    <span className="font-medium text-slate-800">{employee.surel || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">No. HP / WhatsApp</span>
                    <span className="font-medium text-slate-800">{employee.noHp || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Alamat</span>
                    <span className="font-medium text-slate-800 text-right max-w-[240px]">
                      {employee.alamat || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDIDIKAN */}
          {activeTab === 2 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Riwayat Pendidikan Formal ({employee.riwayatPendidikan?.length || 0})
              </h5>

              {(!employee.riwayatPendidikan || employee.riwayatPendidikan.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-6 text-center bg-slate-50 rounded-xl">
                  Belum ada data riwayat pendidikan.
                </p>
              ) : (
                employee.riwayatPendidikan.map((edu, i) => (
                  <div key={edu.id || i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
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
                      <p className="text-[10px] text-slate-400 font-mono">No. Ijazah: {edu.nomorIjazah}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PELATIHAN */}
          {activeTab === 3 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                Riwayat Pelatihan / Diklat ({employee.riwayatPelatihan?.length || 0})
              </h5>

              {(!employee.riwayatPelatihan || employee.riwayatPelatihan.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-6 text-center bg-slate-50 rounded-xl">
                  Belum ada data riwayat pelatihan.
                </p>
              ) : (
                employee.riwayatPelatihan.map((tr, i) => {
                  const isJP = tr.jenisPerhitungan !== 'Non JP';
                  return (
                    <div key={tr.id || i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs">{tr.namaPelatihan}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isJP ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold text-[10px] border border-indigo-200">
                              {tr.durasiJam} JP (Dihitung 40 Jam)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-300">
                              {tr.durasiJam} Jam (Non JP)
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <strong>Penyelenggara:</strong> {tr.penyelenggara} • <strong>Tahun:</strong> {tr.tahun} ({tr.kategori || 'Teknis'})
                      </p>
                      {tr.nomorSertifikat && (
                        <p className="text-[10px] text-slate-400 font-mono">No. Sertifikat: {tr.nomorSertifikat}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: KOMPETENSI */}
          {activeTab === 4 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Daftar Kompetensi Keahlian ({employee.kompetensi?.length || 0})
              </h5>

              {(!employee.kompetensi || employee.kompetensi.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-6 text-center bg-slate-50 rounded-xl">
                  Belum ada data kompetensi.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {employee.kompetensi.map((c, i) => (
                    <div key={c.id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{c.namaKompetensi}</span>
                        <span className="text-[10px] text-slate-500">Kategori: {c.kategori}</span>
                        {c.sertifikasi && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            Sertifikasi: {c.sertifikasi} ({c.tahunPerolehan || '-'})
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                        {c.tingkatKemahiran}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PELATIHAN 40 JAM PER TAHUN */}
          {activeTab === 5 && (
            <div className="space-y-3">
              <PelatihanTahunanTracker employee={employee} />
            </div>
          )}

          {/* TAB 6: PENGATURAN USER LOGIN */}
          {activeTab === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  Hak Akses Akun & Kredensial
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Role Hak Akses</span>
                    <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                      {employee.loginRole || 'Staff'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Username Login</span>
                    <span className="font-mono font-bold text-slate-800">
                      {employee.username || employee.nip || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Status Akses Akun</span>
                    <span className={`font-bold ${employee.isLoginActive !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {employee.isLoginActive !== false ? '✓ Aktif' : '✗ Non-Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
