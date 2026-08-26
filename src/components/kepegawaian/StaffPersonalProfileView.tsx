import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import PelatihanTahunanTracker, { computeEmployeeAnnualTrainings } from './PelatihanTahunanTracker';
import { 
  User, 
  GraduationCap, 
  Award, 
  Clock, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  Heart, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';

interface StaffPersonalProfileViewProps {
  employee: Employee;
}

export default function StaffPersonalProfileView({ employee }: StaffPersonalProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'profil' | 'pendidikan' | 'pelatihan' | 'kompetensi' | 'kepatuhan40jam'>('profil');
  const currentYear = new Date().getFullYear();

  // Pagination for Education (max 20)
  const [eduPage, setEduPage] = useState(1);
  const itemsPerPage = 20;
  const eduList = employee.riwayatPendidikan || [];
  const totalEduPages = Math.max(1, Math.ceil(eduList.length / itemsPerPage));
  const paginatedEdu = useMemo(() => {
    const start = (eduPage - 1) * itemsPerPage;
    return eduList.slice(start, start + itemsPerPage);
  }, [eduList, eduPage]);

  // Pagination for Training (max 20)
  const [trPage, setTrPage] = useState(1);
  const trList = employee.riwayatPelatihan || [];
  const totalTrPages = Math.max(1, Math.ceil(trList.length / itemsPerPage));
  const paginatedTr = useMemo(() => {
    const start = (trPage - 1) * itemsPerPage;
    return trList.slice(start, start + itemsPerPage);
  }, [trList, trPage]);

  // Pagination for Competency (max 20)
  const [compPage, setCompPage] = useState(1);
  const compList = employee.kompetensi || [];
  const totalCompPages = Math.max(1, Math.ceil(compList.length / itemsPerPage));
  const paginatedComp = useMemo(() => {
    const start = (compPage - 1) * itemsPerPage;
    return compList.slice(start, start + itemsPerPage);
  }, [compList, compPage]);

  // 40 JP compliance for current year
  const annualData = useMemo(() => {
    const computed = computeEmployeeAnnualTrainings(employee);
    return computed[currentYear] || {
      year: currentYear,
      totalHours: 0,
      trainings: [],
      isCompliant: false,
      percentage: 0,
      remainingHours: 40
    };
  }, [employee, currentYear]);

  const formatFullName = () => {
    let full = employee.nama;
    if (employee.gelarDepan) full = `${employee.gelarDepan} ${full}`;
    if (employee.gelarBelakang) full = `${full}, ${employee.gelarBelakang}`;
    return full;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {employee.foto ? (
              <img
                src={employee.foto}
                alt={employee.nama}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-200 shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                {employee.nama.charAt(0)}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  PROFIL PEGAWAI MANDIRI
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md font-mono ${
                  (employee.status || 'aktif').toLowerCase() === 'aktif'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  STATUS: {employee.status || 'Aktif'}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900">
                {formatFullName()}
              </h2>

              <p className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-slate-500">NIP: {employee.nip || '-'}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{employee.divisi}</span>
                <span>•</span>
                <span className="text-slate-600 capitalize">{employee.jabatan || 'Staf'} ({employee.jenisJabatan || 'Fungsional'})</span>
              </p>
            </div>
          </div>

          {/* Compliance Badge */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 shrink-0">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Diklat Thn {currentYear}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {annualData.totalHours}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 40 JP</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 ${
                annualData.isCompliant ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {annualData.isCompliant ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Memenuhi Target
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" /> Kurang {annualData.remainingHours} JP
                  </>
                )}
              </span>
            </div>

            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-sm font-black text-indigo-600 font-mono">
                {annualData.percentage}%
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Tercapai</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'profil', label: 'Data Diri & Identitas', icon: User },
            { id: 'pendidikan', label: `Riwayat Pendidikan (${eduList.length})`, icon: GraduationCap },
            { id: 'pelatihan', label: `Riwayat Pelatihan (${trList.length})`, icon: Award },
            { id: 'kompetensi', label: `Kompetensi & Sertifikasi (${compList.length})`, icon: Sparkles },
            { id: 'kepatuhan40jam', label: 'Kepatuhan 40 Jam / Tahun', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* 1. DATA DIRI */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              Informasi Biodata & Status Kepegawaian
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">NIK</span>
                <p className="text-xs font-mono font-bold text-slate-800">{employee.nik || '-'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">NIP</span>
                <p className="text-xs font-mono font-bold text-slate-800">{employee.nip || '-'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tempat, Tanggal Lahir</span>
                <p className="text-xs font-semibold text-slate-800">
                  {employee.tempatLahir ? `${employee.tempatLahir}, ` : ''}{employee.tanggalLahir || '-'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Jenis Kelamin / Agama</span>
                <p className="text-xs font-semibold text-slate-800">
                  {employee.jenisKelamin || '-'} • {employee.agama || '-'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Golongan Darah</span>
                <p className="text-xs font-bold text-rose-600 font-mono">{employee.golDarah || '-'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pangkat / Golongan</span>
                <p className="text-xs font-semibold text-slate-800">{employee.pangkatGolongan || '-'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Unit Kerja / Bidang</span>
                <p className="text-xs font-semibold text-slate-800">{employee.divisi}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Jabatan & Jalur</span>
                <p className="text-xs font-semibold text-slate-800 capitalize">
                  {employee.jabatan || 'Staf'} ({employee.jenisJabatan || 'Fungsional'})
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Email & No. HP</span>
                <p className="text-xs font-semibold text-slate-800">
                  {employee.surel || '-'} • {employee.noHp || '-'}
                </p>
              </div>
            </div>

            {employee.alamat && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Alamat Domisili</span>
                <p className="text-xs text-slate-700">{employee.alamat}</p>
              </div>
            )}
          </div>
        )}

        {/* 2. RIWAYAT PENDIDIKAN */}
        {activeTab === 'pendidikan' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Riwayat Pendidikan Formal ({eduList.length})
            </h3>

            {eduList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada data riwayat pendidikan yang tercatat.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedEdu.map(edu => (
                  <div key={edu.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-black text-[10px]">
                          {edu.jenjang}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{edu.institusi}</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Jurusan:</strong> {edu.jurusan} {edu.gelar ? `(${edu.gelar})` : ''} • <strong>Lulus:</strong> {edu.tahunLulus}
                      </p>
                      {edu.nomorIjazah && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          No. Ijazah: {edu.nomorIjazah}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalEduPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <p className="text-slate-500 text-[11px]">
                      Halaman {eduPage} dari {totalEduPages} ({eduList.length} total)
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEduPage(p => Math.max(1, p - 1))}
                        disabled={eduPage === 1}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" /> Prev
                      </button>
                      <button
                        onClick={() => setEduPage(p => Math.min(totalEduPages, p + 1))}
                        disabled={eduPage === totalEduPages}
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

        {/* 3. RIWAYAT PELATIHAN (PAGINATED MAX 20) */}
        {activeTab === 'pelatihan' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-indigo-600" />
              Riwayat Pelatihan & Diklat ({trList.length})
            </h3>

            {trList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada data pelatihan yang tercatat.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedTr.map(tr => {
                  const isJP = tr.jenisPerhitungan !== 'Non JP';
                  return (
                    <div key={tr.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{tr.namaPelatihan}</span>
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
                        <p className="text-xs text-slate-600">
                          <strong>Penyelenggara:</strong> {tr.penyelenggara} • <strong>Kategori:</strong> {tr.kategori || '-'}
                        </p>
                        {tr.nomorSertifikat && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            No. Sertifikat: {tr.nomorSertifikat}
                          </p>
                        )}
                        {(tr.fileSertifikat || tr.linkSertifikat) && (
                          <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                            {tr.fileSertifikat && (
                              <a
                                href={tr.fileSertifikat}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Lihat Foto/Berkas Sertifikat</span>
                              </a>
                            )}
                            {tr.linkSertifikat && (
                              <a
                                href={tr.linkSertifikat}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold hover:bg-sky-100 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Tautan Dokumen Sertifikat</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalTrPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <p className="text-slate-500 text-[11px]">
                      Halaman {trPage} dari {totalTrPages} ({trList.length} total)
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTrPage(p => Math.max(1, p - 1))}
                        disabled={trPage === 1}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" /> Prev
                      </button>
                      <button
                        onClick={() => setTrPage(p => Math.min(totalTrPages, p + 1))}
                        disabled={trPage === totalTrPages}
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

        {/* 4. KOMPETENSI (PAGINATED MAX 20) */}
        {activeTab === 'kompetensi' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Daftar Kompetensi & Sertifikasi ({compList.length})
            </h3>

            {compList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada data kompetensi yang tercatat.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginatedComp.map(comp => (
                    <div key={comp.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{comp.namaKompetensi}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                          {comp.tingkatKemahiran}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kategori: {comp.kategori}
                      </p>
                      {comp.sertifikasi && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {comp.sertifikasi} ({comp.tahunPerolehan || '-'})
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalCompPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <p className="text-slate-500 text-[11px]">
                      Halaman {compPage} dari {totalCompPages} ({compList.length} total)
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCompPage(p => Math.max(1, p - 1))}
                        disabled={compPage === 1}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" /> Prev
                      </button>
                      <button
                        onClick={() => setCompPage(p => Math.min(totalCompPages, p + 1))}
                        disabled={compPage === totalCompPages}
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

        {/* 5. KEPATUHAN 40 JAM PER TAHUN */}
        {activeTab === 'kepatuhan40jam' && (
          <PelatihanTahunanTracker employee={employee} />
        )}
      </div>
    </div>
  );
}
