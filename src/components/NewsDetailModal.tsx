import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  ExternalLink, 
  Calendar, 
  User, 
  Radio, 
  Globe, 
  Layers, 
  Filter,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { NewsReport } from '../types';

interface NewsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  indicatorName?: string;
  periodLabel: string;
  newsReports: NewsReport[];
  targetValue?: string | number;
  achievementValue?: number;
  assignedToName?: string;
}

export default function NewsDetailModal({
  isOpen,
  onClose,
  title,
  indicatorName,
  periodLabel,
  newsReports,
  targetValue,
  achievementValue,
  assignedToName
}: NewsDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredReports = useMemo(() => {
    return newsReports.filter(rep => {
      const matchesSearch = 
        !searchTerm.trim() ||
        (rep.title || "")?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        (rep.writerName || rep.reporterName || '')?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        (rep.editorName || '')?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        (rep.category || '')?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        (rep.daerah || '')?.toLowerCase().includes(searchTerm?.toLowerCase());

      const matchesType = typeFilter === 'all' || rep.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [newsReports, searchTerm, typeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex justify-between items-start gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 tracking-wider flex items-center gap-1 font-mono">
                <ListFilter className="w-3 h-3 text-indigo-300" />
                Rincian Eviden Berita
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 font-mono">
                Periode: {periodLabel}
              </span>
              {assignedToName && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white font-mono flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {assignedToName}
                </span>
              )}
            </div>
            
            <h3 className="text-base font-black text-white leading-snug">
              {title}
            </h3>
            
            {indicatorName && (
              <p className="text-xs text-indigo-200 font-medium line-clamp-2">
                <span className="font-bold text-white uppercase text-[10px] mr-1">[Indikator PK]:</span>
                {indicatorName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-500 font-medium">Total Berita Terfilter:</span>
              <span className="font-black text-slate-800 text-sm font-mono">{newsReports.length}</span>
            </div>

            {targetValue !== undefined && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <span className="text-slate-500 font-medium">Target PK:</span>
                <span className="font-extrabold text-slate-700 font-mono">{targetValue}</span>
              </div>
            )}

            {achievementValue !== undefined && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <span className="text-slate-500 font-medium">Realisasi Capaian:</span>
                <span className="font-black text-indigo-600 font-mono">{achievementValue}</span>
              </div>
            )}
          </div>

          {/* Search bar inside modal */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul, reporter, editor..."
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="Berita Online">Berita Online</option>
              <option value="Berita Ringan LPU">Berita Ringan LPU</option>
              <option value="Berita Radio">Berita Radio</option>
              <option value="Konten Siaran">Konten Siaran</option>
            </select>
          </div>
        </div>

        {/* Modal Body / Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Tidak ada berita yang ditemukan</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Belum ada rilis berita atau eviden yang diinput untuk kategori dan periode <strong className="text-slate-700">{periodLabel}</strong> ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-bold text-[10px] uppercase font-mono tracking-wider border-b border-slate-200">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3">Tanggal / Waktu</th>
                    <th className="p-3">Judul Berita & Eviden</th>
                    <th className="p-3">Jenis / Kategori</th>
                    <th className="p-3">Penulis / Reporter</th>
                    <th className="p-3">Editor</th>
                    <th className="p-3 text-center">Link Eviden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredReports.map((rep, idx) => (
                    <tr key={rep.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-3 text-center font-mono text-[11px] font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      
                      <td className="p-3 whitespace-nowrap text-[11px] text-slate-600 font-mono">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          {rep.date || '-'}
                        </div>
                        {rep.publishDateTime && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {rep.publishDateTime}
                          </div>
                        )}
                      </td>

                      <td className="p-3 min-w-[220px]">
                        <p className="font-bold text-slate-800 leading-snug line-clamp-2" title={rep.title}>
                          {rep.title}
                        </p>
                        {rep.daerah && (
                          <span className="inline-block text-[9px] font-medium text-slate-400 mt-0.5">
                            Wilayah: {rep.daerah}
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono border ${
                          rep.type === 'Berita Ringan LPU' || rep.type === 'Berita Ringan'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : rep.type === 'Berita Radio'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : rep.type === 'Konten Siaran'
                            ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {rep.type}
                        </span>
                        {rep.category && (
                          <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">
                            {rep.category}
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{rep.writerName || rep.reporterName || 'Sistem'}</span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                        {rep.editorName || '-'}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {rep.url ? (
                          <a
                            href={rep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all border border-indigo-200"
                            title="Buka Link Eviden"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Eviden
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <p className="text-[11px] text-slate-400 font-medium">
            Terintegrasi otomatis dengan database laporan berita RRI Swara.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
