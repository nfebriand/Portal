import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import RekapitulasiKepegawaian from './kepegawaian/RekapitulasiKepegawaian';
import EmployeeModalForm from './kepegawaian/EmployeeModalForm';
import EmployeeDetailDrawer from './kepegawaian/EmployeeDetailDrawer';
import { computeEmployeeAnnualTrainings, formatIndonesianDate } from './kepegawaian/PelatihanTahunanTracker';
import { 
  BarChart3, 
  Users, 
  Award, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock, 
  Filter, 
  Building2, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Layers,
  Sparkles
} from 'lucide-react';

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
  } | null;
}

export default function EmployeeAdminView({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  currentUser
}: EmployeeAdminViewProps) {
  const currentYear = new Date().getFullYear();

  // 1. Primary Navigation Sub-menu: 'rekapitulasi' | 'pengaturan' | 'pelatihan40jam'
  // Default is 'rekapitulasi' as explicitly requested!
  const [activeSubMenu, setActiveSubMenu] = useState<'rekapitulasi' | 'pengaturan' | 'pelatihan40jam'>('rekapitulasi');

  // Selected Employee for Detail Drawer & Modal Form
  const [selectedDrawerEmp, setSelectedDrawerEmp] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Filters for Database View
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivFilter, setSelectedDivFilter] = useState('Semua');
  const [selectedJabatanFilter, setSelectedJabatanFilter] = useState('Semua');
  const [selectedJalurFilter, setSelectedJalurFilter] = useState('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua');

  // Training Matrix Year Filter
  const [matrixYear, setMatrixYear] = useState<number>(currentYear);
  const [matrixComplianceFilter, setMatrixComplianceFilter] = useState<'Semua' | 'Memenuhi' | 'Belum'>('Semua');

  // Delete Confirmation State
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  // Format Full Name with Titles
  const formatFullName = (emp: Employee) => {
    let full = emp.nama;
    if (emp.gelarDepan) full = `${emp.gelarDepan} ${full}`;
    if (emp.gelarBelakang) full = `${full}, ${emp.gelarBelakang}`;
    return full;
  };

  // Filtered List for Table in Pengaturan Pegawai Tab
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        emp.nama.toLowerCase().includes(q) ||
        (emp.nip && emp.nip.includes(q)) ||
        (emp.nik && emp.nik.includes(q)) ||
        (emp.surel && emp.surel.toLowerCase().includes(q)) ||
        (emp.jabatan && emp.jabatan.toLowerCase().includes(q));

      const matchDiv = selectedDivFilter === 'Semua' || emp.divisi === selectedDivFilter;
      const matchJabatan = selectedJabatanFilter === 'Semua' || (emp.jabatan || 'staf').toLowerCase() === selectedJabatanFilter.toLowerCase();
      const matchJalur = selectedJalurFilter === 'Semua' || (emp.jenisJabatan || 'fungsional').toLowerCase() === selectedJalurFilter.toLowerCase();
      const matchStatus = selectedStatusFilter === 'Semua' || (emp.status || 'aktif').toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchSearch && matchDiv && matchJabatan && matchJalur && matchStatus;
    });
  }, [employees, searchQuery, selectedDivFilter, selectedJabatanFilter, selectedJalurFilter, selectedStatusFilter]);

  // Filtered List for Pelatihan 40 Jam Matrix Tab
  const trainingMatrixList = useMemo(() => {
    return employees.map(emp => {
      const annuals = computeEmployeeAnnualTrainings(emp);
      const yearData = annuals[matrixYear] || {
        year: matrixYear,
        totalHours: 0,
        trainings: [],
        isCompliant: false,
        percentage: 0,
        remainingHours: 40
      };
      return {
        emp,
        yearData
      };
    }).filter(({ emp, yearData }) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        emp.nama.toLowerCase().includes(q) ||
        (emp.nip && emp.nip.includes(q)) ||
        (emp.divisi && emp.divisi.toLowerCase().includes(q));

      const matchDiv = selectedDivFilter === 'Semua' || emp.divisi === selectedDivFilter;
      const matchComp = 
        matrixComplianceFilter === 'Semua' ||
        (matrixComplianceFilter === 'Memenuhi' && yearData.isCompliant) ||
        (matrixComplianceFilter === 'Belum' && !yearData.isCompliant);

      return matchSearch && matchDiv && matchComp;
    });
  }, [employees, matrixYear, searchQuery, selectedDivFilter, matrixComplianceFilter]);

  // Action: Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  // Action: Open Modal for Edit
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  // Action: Save from Modal
  const handleSaveModal = (savedEmp: Employee) => {
    if (editingEmployee) {
      onUpdateEmployee(savedEmp);
    } else {
      onAddEmployee(savedEmp);
    }
  };

  // Action: Delete
  const handleConfirmDelete = () => {
    if (deletingEmpId) {
      onDeleteEmployee(deletingEmpId);
      setDeletingEmpId(null);
      if (selectedDrawerEmp?.id === deletingEmpId) {
        setSelectedDrawerEmp(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Navigation Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-mono border border-indigo-100">
              MODUL ADMINISTRASI KEPEGAWAIAN
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              DATABASE LIVE FIRESTORE
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Manajemen Sumber Daya Manusia Terpadu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data identitas, pendidikan, kompetensi, pelatihan 40 jam/tahun, dan kredensial user login.
          </p>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubMenu('rekapitulasi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubMenu === 'rekapitulasi'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Rekapitulasi Kepegawaian</span>
          </button>

          <button
            onClick={() => setActiveSubMenu('pengaturan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubMenu === 'pengaturan'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Pengaturan Pegawai ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveSubMenu('pelatihan40jam')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubMenu === 'pelatihan40jam'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Kepatuhan Pelatihan 40 Jam</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: REKAPITULASI KEPEGAWAIAN (DEFAULT VIEW) */}
      {activeSubMenu === 'rekapitulasi' && (
        <RekapitulasiKepegawaian
          employees={employees}
          onSelectEmployee={(emp) => setSelectedDrawerEmp(emp)}
          onOpenAddModal={handleOpenAddModal}
          onNavigateToSettingsTab={() => setActiveSubMenu('pengaturan')}
        />
      )}

      {/* VIEW 2: PENGATURAN PEGAWAI (DATABASE & PENGATURAN LENGKAP) */}
      {activeSubMenu === 'pengaturan' && (
        <div className="space-y-4">
          
          {/* Operations Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, NIP, NIK, surel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              {/* Filter Divisi */}
              <select
                value={selectedDivFilter}
                onChange={(e) => setSelectedDivFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="Semua">Semua Bidang</option>
                <option value="Tata Usaha / Umum">Tata Usaha / Umum</option>
                <option value="Siaran">Siaran</option>
                <option value="Pemberitaan">Pemberitaan</option>
                <option value="Teknologi dan Media Baru">Teknologi dan Media Baru</option>
                <option value="Konten Media Baru">Konten Media Baru</option>
                <option value="Layanan Pengembangan Usaha">Layanan Pengembangan Usaha</option>
              </select>

              {/* Filter Jabatan */}
              <select
                value={selectedJabatanFilter}
                onChange={(e) => setSelectedJabatanFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="Semua">Semua Jabatan</option>
                <option value="staf">Staf</option>
                <option value="pengelola">Pengelola</option>
                <option value="admin bidang">Admin Bidang</option>
                <option value="ketua bidang">Ketua Bidang</option>
                <option value="kepala satker">Kepala Satker</option>
              </select>

              {/* Filter Jalur */}
              <select
                value={selectedJalurFilter}
                onChange={(e) => setSelectedJalurFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="Semua">Semua Jalur</option>
                <option value="fungsional">Fungsional</option>
                <option value="struktural">Struktural</option>
              </select>

              {/* Filter Status */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="Semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="pindah">Pindah</option>
                <option value="keluar">Keluar</option>
              </select>
            </div>

            {/* Add Employee Button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pegawai Baru</span>
            </button>

          </div>

          {/* Employee Database Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Nama Pegawai & NIP</th>
                    <th className="px-4 py-3">NIK & Kontak</th>
                    <th className="px-4 py-3">Bidang / Unit Kerja</th>
                    <th className="px-4 py-3">Jabatan & Jalur</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pendidikan & Kompetensi</th>
                    <th className="px-4 py-3">Role Login</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                        Tidak ada data pegawai yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Nama & NIP */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                              {emp.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{formatFullName(emp)}</p>
                              <p className="text-[10px] text-slate-400 font-mono">NIP: {emp.nip || '-'}</p>
                            </div>
                          </div>
                        </td>

                        {/* NIK & Kontak */}
                        <td className="px-4 py-3">
                          <p className="font-mono text-slate-700 text-[11px]">{emp.nik || '-'}</p>
                          <p className="text-[10px] text-slate-400">{emp.noHp || emp.surel || '-'}</p>
                        </td>

                        {/* Bidang */}
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">{emp.divisi}</span>
                        </td>

                        {/* Jabatan & Jalur */}
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 capitalize block">{emp.jabatan || 'Staf'}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase inline-block">
                              {emp.jenisJabatan || 'Fungsional'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            (emp.status || 'aktif').toLowerCase() === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (emp.status || 'aktif').toLowerCase() === 'pindah'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {emp.status || 'Aktif'}
                          </span>
                        </td>

                        {/* Pendidikan & Kompetensi */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-700 text-[11px]">{emp.jenjangPendidikan || 'S1'}</p>
                          <p className="text-[10px] text-indigo-600 font-medium">
                            {emp.kompetensi?.length || 0} Kompetensi • {emp.riwayatPelatihan?.length || 0} Pelatihan
                          </p>
                        </td>

                        {/* Role Login */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px]">
                            {emp.loginRole || 'Staff'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedDrawerEmp(emp)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Lihat Detail Lengkap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(emp)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Pengaturan Pegawai"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingEmpId(emp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Pegawai"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: KEPATUHAN PELATIHAN 40 JAM PER TAHUN MATRIX */}
      {activeSubMenu === 'pelatihan40jam' && (
        <div className="space-y-4">
          
          {/* Header Controls for Matrix */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Matriks Kepatuhan Pengembangan Kompetensi (Min. 40 Jam / Tahun)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Evaluasi pemenuhan target tahunan berdasarkan riwayat pelatihan terverifikasi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[currentYear, currentYear - 1, currentYear - 2].map(yr => (
                  <button
                    key={yr}
                    onClick={() => setMatrixYear(yr)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      matrixYear === yr
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tahun {yr}
                  </button>
                ))}
              </div>

              {/* Filter Compliance */}
              <select
                value={matrixComplianceFilter}
                onChange={(e) => setMatrixComplianceFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="Semua">Semua Status Kepatuhan</option>
                <option value="Memenuhi">Memenuhi (≥ 40 Jam)</option>
                <option value="Belum">Belum Memenuhi (&lt; 40 Jam)</option>
              </select>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Nama Pegawai & NIP</th>
                    <th className="px-4 py-3">Bidang / Unit Kerja</th>
                    <th className="px-4 py-3">Status Kepatuhan Thn {matrixYear}</th>
                    <th className="px-4 py-3">Tanggal Tercapai 40 Jam</th>
                    <th className="px-4 py-3">Total Jam Tercapai</th>
                    <th className="px-4 py-3">Progres (Target: 40 Jam)</th>
                    <th className="px-4 py-3">Jumlah Pelatihan</th>
                    <th className="px-4 py-3 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingMatrixList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                        Tidak ada data pelatihan pada tahun {matrixYear} yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    trainingMatrixList.map(({ emp, yearData }) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{formatFullName(emp)}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NIP: {emp.nip || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">{emp.divisi}</span>
                        </td>
                        <td className="px-4 py-3">
                          {yearData.isCompliant ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Memenuhi (≥ 40 JP)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Kurang {yearData.remainingHours} JP
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {yearData.isCompliant && yearData.tanggalTercapai40Jam ? (
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-emerald-800 text-[11px] flex items-center gap-1 font-mono">
                                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                {formatIndonesianDate(yearData.tanggalTercapai40Jam)}
                              </span>
                              {yearData.pelatihanTercapai40Jam && (
                                <span className="text-[10px] text-slate-500 line-clamp-1 italic max-w-[180px]" title={yearData.pelatihanTercapai40Jam}>
                                  {yearData.pelatihanTercapai40Jam}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono italic">Belum Tercapai</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-black font-mono text-slate-800">
                            {yearData.totalHours} <span className="text-[10px] font-normal text-slate-400">/ 40 JP</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                yearData.isCompliant
                                  ? 'bg-emerald-500'
                                  : yearData.totalHours > 20
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${yearData.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                            {yearData.percentage}% Tercapai
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {yearData.trainings.length} Kegiatan
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedDrawerEmp(emp)}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Lihat Rincian
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Employee Modal Form (6 Tabs) */}
      <EmployeeModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={editingEmployee}
        onSave={handleSaveModal}
        currentUser={currentUser}
      />

      {/* Employee Detail Drawer */}
      <EmployeeDetailDrawer
        isOpen={!!selectedDrawerEmp}
        onClose={() => setSelectedDrawerEmp(null)}
        employee={selectedDrawerEmp}
        onEdit={(emp) => {
          setSelectedDrawerEmp(null);
          handleOpenEditModal(emp);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingEmpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Pegawai</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data pegawai ini beserta seluruh riwayat pendidikan, pelatihan, kompetensi, dan akun login-nya?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingEmpId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
