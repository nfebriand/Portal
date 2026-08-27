import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Megaphone, 
  ExternalLink, 
  Calendar, 
  User, 
  Building2, 
  Image as ImageIcon,
  CheckCircle2,
  Tv,
  Radio,
  FileText,
  Share2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PromotionActivity } from '../types';
import { calculateTotalMediaItems } from '../utils/syncPromotionAchievements';

interface PromotionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  indicatorName?: string;
  periodLabel: string;
  promotions: PromotionActivity[];
  targetValue?: string | number;
  achievementValue?: number;
  assignedToName?: string;
  division?: string;
}

export default function PromotionDetailModal({
  isOpen,
  onClose,
  title,
  indicatorName,
  periodLabel,
  promotions = [],
  targetValue,
  achievementValue,
  assignedToName,
  division
}: PromotionDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [selectedPhotoPromo, setSelectedPhotoPromo] = useState<PromotionActivity | null>(null);

  // Available unique divisions in promotions
  const divisions = useMemo(() => {
    const set = new Set<string>();
    promotions.forEach(p => {
      if (p.divisi) set.add(p.divisi);
    });
    return Array.from(set);
  }, [promotions]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      const matchesSearch = 
        !searchTerm.trim() ||
        (p.namaKegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.creatorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.divisi || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDiv = divisionFilter === 'all' || p.divisi === divisionFilter;

      return matchesSearch && matchesDiv;
    });
  }, [promotions, searchTerm, divisionFilter]);

  // Aggregate Media Totals
  const mediaTotals = useMemo(() => {
    let baliho = 0;
    let spanduk = 0;
    let videotron = 0;
    let umbulUmbul = 0;
    let pamflet = 0;
    let yt = 0;
    let ig = 0;
    let tiktok = 0;
    let fb = 0;
    let eFlyer = 0;

    filteredPromotions.forEach(p => {
      baliho += Number(p.baliho || 0);
      spanduk += Number(p.spanduk || 0);
      videotron += Number(p.videotron || 0);
      umbulUmbul += Number(p.umbulUmbul || 0);
      pamflet += Number(p.pamflet || 0);
      yt += Number(p.yt || 0);
      ig += Number(p.ig || 0);
      tiktok += Number(p.tiktok || 0);
      fb += Number(p.fb || 0);
      eFlyer += Number(p.eFlyer || 0);
    });

    const outdoor = baliho + spanduk + videotron + umbulUmbul + pamflet;
    const multiplatform = yt + ig + tiktok + fb + eFlyer;
    const grandTotal = outdoor + multiplatform;

    return {
      baliho, spanduk, videotron, umbulUmbul, pamflet,
      yt, ig, tiktok, fb, eFlyer,
      outdoor, multiplatform, grandTotal
    };
  }, [filteredPromotions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white flex justify-between items-start gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 tracking-wider flex items-center gap-1 font-mono">
                <Megaphone className="w-3 h-3 text-indigo-300" />
                Rincian Eviden Kegiatan Promosi
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
              {division && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-800/80 text-indigo-200 border border-indigo-700/50 font-mono flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {division}
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

        {/* Quick Stats & Metrics Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-slate-600 font-semibold">Total Kegiatan Promosi:</span>
                <span className="font-black text-indigo-900 text-sm font-mono">{filteredPromotions.length} Kegiatan</span>
              </div>

              {targetValue !== undefined && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-500 font-medium">Target PK:</span>
                  <span className="font-extrabold text-slate-800 font-mono">{targetValue} Kegiatan</span>
                </div>
              )}

              {achievementValue !== undefined && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <span className="text-emerald-700 font-semibold">Realisasi Capaian:</span>
                  <span className="font-black text-emerald-800 font-mono">{achievementValue} Kegiatan</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                <span>Media Luar Ruang: <strong>{mediaTotals.outdoor}</strong></span>
                <span>•</span>
                <span>Multiplatform: <strong>{mediaTotals.multiplatform}</strong></span>
                <span>•</span>
                <span className="text-indigo-700 font-bold">Total Item Media: <strong>{mediaTotals.grandTotal}</strong></span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kegiatan, divisi, creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700"
                />
              </div>

              {divisions.length > 1 && (
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Bidang</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body / Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredPromotions.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Tidak ada kegiatan promosi yang ditemukan</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Belum ada data dokumentasi promosi yang diinput untuk periode <strong className="text-slate-700">{periodLabel}</strong> ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-600 font-bold text-[10px] uppercase font-mono tracking-wider border-b border-slate-200">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3">Tanggal Kegiatan</th>
                    <th className="p-3 min-w-[200px]">Nama Kegiatan Promosi</th>
                    <th className="p-3">Bidang / Unit Kerja</th>
                    <th className="p-3 text-center">Media Luar Ruang</th>
                    <th className="p-3 text-center">Multiplatform</th>
                    <th className="p-3 text-center">Total Media</th>
                    <th className="p-3">Penanggung Jawab</th>
                    <th className="p-3 text-center">Eviden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredPromotions.map((promo, idx) => {
                    const outdoorCount = 
                      Number(promo.baliho || 0) +
                      Number(promo.spanduk || 0) +
                      Number(promo.videotron || 0) +
                      Number(promo.umbulUmbul || 0) +
                      Number(promo.pamflet || 0);

                    const multiCount = 
                      Number(promo.yt || 0) +
                      Number(promo.ig || 0) +
                      Number(promo.tiktok || 0) +
                      Number(promo.fb || 0) +
                      Number(promo.eFlyer || 0);

                    const totalMedia = outdoorCount + multiCount;

                    return (
                      <tr key={promo.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-3 text-center font-mono text-[11px] font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        <td className="p-3 whitespace-nowrap text-[11px] text-slate-600 font-mono">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            {promo.tanggal || '-'}
                          </div>
                        </td>

                        <td className="p-3 min-w-[200px]">
                          <p className="font-bold text-slate-800 leading-snug" title={promo.namaKegiatan}>
                            {promo.namaKegiatan}
                          </p>
                          {promo.keterangan && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                              {promo.keterangan}
                            </p>
                          )}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            {promo.divisi || 'Layanan Pengembangan Usaha'}
                          </span>
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[140px] mx-auto">
                            {promo.baliho > 0 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold font-mono">Baliho:{promo.baliho}</span>}
                            {promo.spanduk > 0 && <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[9px] font-bold font-mono">Spanduk:{promo.spanduk}</span>}
                            {promo.videotron > 0 && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-bold font-mono">Videotron:{promo.videotron}</span>}
                            {promo.umbulUmbul > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold font-mono">Umbul²:{promo.umbulUmbul}</span>}
                            {promo.pamflet > 0 && <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[9px] font-bold font-mono">Pamflet:{promo.pamflet}</span>}
                            {outdoorCount === 0 && <span className="text-[10px] text-slate-300 font-mono">0</span>}
                          </div>
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[140px] mx-auto">
                            {promo.yt > 0 && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold font-mono">YT:{promo.yt}</span>}
                            {promo.ig > 0 && <span className="px-1.5 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 rounded text-[9px] font-bold font-mono">IG:{promo.ig}</span>}
                            {promo.tiktok > 0 && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded text-[9px] font-bold font-mono">TikTok:{promo.tiktok}</span>}
                            {promo.fb > 0 && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold font-mono">FB:{promo.fb}</span>}
                            {promo.eFlyer > 0 && <span className="px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded text-[9px] font-bold font-mono">Flyer:{promo.eFlyer}</span>}
                            {multiCount === 0 && <span className="text-[10px] text-slate-300 font-mono">0</span>}
                          </div>
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100/70 text-indigo-800 font-mono">
                            {totalMedia} spot
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap text-slate-700 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{promo.creatorName || 'Tim Promosi'}</span>
                          </div>
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {promo.fotoDokumentasi && (
                              <button
                                type="button"
                                onClick={() => setSelectedPhotoPromo(promo)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold transition-all border border-amber-200 cursor-pointer"
                                title="Lihat Foto Dokumentasi"
                              >
                                <ImageIcon className="w-3 h-3" />
                                Foto
                              </button>
                            )}

                            {promo.linkDokumentasi ? (
                              <a
                                href={promo.linkDokumentasi}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all border border-indigo-200"
                                title="Buka Link Google Drive Eviden"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Link Eviden
                              </a>
                            ) : !promo.fotoDokumentasi && (
                              <span className="text-[10px] text-slate-300 italic">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <p className="text-[11px] text-slate-400 font-medium">
            Terintegrasi otomatis dengan sistem Manajemen & Rekapitulasi Dokumentasi Promosi.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Lightbox / Foto Modal */}
      {selectedPhotoPromo && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full border border-slate-200 shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-white">{selectedPhotoPromo.namaKegiatan}</h4>
                <p className="text-[10px] text-slate-400 font-mono">{selectedPhotoPromo.tanggal} • {selectedPhotoPromo.divisi || 'Promosi'}</p>
              </div>
              <button 
                onClick={() => setSelectedPhotoPromo(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={selectedPhotoPromo.fotoDokumentasi} 
                alt={selectedPhotoPromo.namaKegiatan} 
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
            {selectedPhotoPromo.linkDokumentasi && (
              <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
                <a
                  href={selectedPhotoPromo.linkDokumentasi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Link Dokumen Lengkap
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
