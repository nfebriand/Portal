import { Employee } from '../../types';
import { Cake, CalendarDays, Award, User, Clock } from 'lucide-react';
import { useMemo } from 'react';

interface NotifikasiSdmBidangProps {
  employees: Employee[];
}

export default function NotifikasiSdmBidang({ employees }: NotifikasiSdmBidangProps) {
  const { upcomingBirthdays, upcomingRetirements } = useMemo(() => {
    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    const birthdays: (Employee & { birthdayDate: Date; age: number; daysUntil: number })[] = [];
    const retirements: (Employee & { retirementDate: Date; daysUntil: number })[] = [];

    employees.forEach(emp => {
      if (!emp.tanggalLahir || emp.status?.toLowerCase() !== 'aktif') return;

      const birthDate = new Date(emp.tanggalLahir);
      if (isNaN(birthDate.getTime())) return;

      // 1. Calculate upcoming birthday
      const thisYearBirthday = new Date(birthDate);
      thisYearBirthday.setFullYear(today.getFullYear());
      
      // If birthday has passed this year, look at next year
      if (thisYearBirthday.getTime() < today.getTime()) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      if (thisYearBirthday.getTime() >= today.getTime() && thisYearBirthday.getTime() <= nextWeek.getTime()) {
        const age = thisYearBirthday.getFullYear() - birthDate.getFullYear();
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        birthdays.push({
          ...emp,
          birthdayDate: thisYearBirthday,
          age,
          daysUntil
        });
      }

      // 2. Calculate retirement (Assuming 58 years)
      const retirementAge = emp.jenisJabatan?.toLowerCase() === 'fungsional' ? 60 : 58;
      const retirementDate = new Date(birthDate);
      retirementDate.setFullYear(birthDate.getFullYear() + retirementAge);

      if (retirementDate.getTime() > today.getTime() && retirementDate.getTime() <= nextYear.getTime()) {
        const daysUntil = Math.ceil((retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        retirements.push({
          ...emp,
          retirementDate,
          daysUntil
        });
      }
    });

    return {
      upcomingBirthdays: birthdays.sort((a, b) => a.daysUntil - b.daysUntil),
      upcomingRetirements: retirements.sort((a, b) => a.daysUntil - b.daysUntil)
    };
  }, [employees]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Kolom Ulang Tahun */}
      <div className="bg-white rounded-2xl border border-rose-200/60 shadow-xs overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Ulang Tahun Pegawai</h3>
              <p className="text-[10px] text-rose-600">Dalam 7 hari kedepan</p>
            </div>
          </div>
          <span className="text-xs font-black text-rose-700 bg-rose-200/50 px-2.5 py-1 rounded-lg font-mono">
            {upcomingBirthdays.length} Pegawai
          </span>
        </div>
        <div className="p-0 flex-1">
          {upcomingBirthdays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CalendarDays className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs font-medium italic">Tidak ada yang berulang tahun minggu ini</p>
            </div>
          ) : (
            <ul className="divide-y divide-rose-50">
              {upcomingBirthdays.map((emp, idx) => (
                <li key={emp.id || idx} className="p-4 hover:bg-rose-50/30 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 font-bold flex-shrink-0">
                      {emp.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{emp.nama}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{emp.divisi} {emp.jabatan ? `• ${emp.jabatan}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-rose-600">{emp.age} Tahun</p>
                    <p className="text-[10px] font-semibold text-rose-500 mt-0.5">
                      {emp.daysUntil === 0 ? 'HARI INI!' : emp.daysUntil === 1 ? 'BESOK' : `${emp.daysUntil} hari lagi`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Kolom Pensiun */}
      <div className="bg-white rounded-2xl border border-amber-200/60 shadow-xs overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Masa Purna Tugas (Pensiun)</h3>
              <p className="text-[10px] text-amber-600">Dalam 1 tahun kedepan</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-200/50 px-2.5 py-1 rounded-lg font-mono">
            {upcomingRetirements.length} Pegawai
          </span>
        </div>
        <div className="p-0 flex-1">
          {upcomingRetirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <User className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs font-medium italic">Tidak ada yang pensiun tahun ini</p>
            </div>
          ) : (
            <ul className="divide-y divide-amber-50">
              {upcomingRetirements.map((emp, idx) => (
                <li key={emp.id || idx} className="p-4 hover:bg-amber-50/30 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 font-bold flex-shrink-0">
                      {emp.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{emp.nama}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{emp.jabatan || 'Pegawai'} • {emp.divisi}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-amber-700 font-mono">
                      {emp.retirementDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] font-semibold text-amber-600 mt-0.5 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(emp.daysUntil / 30)} bln lagi
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
