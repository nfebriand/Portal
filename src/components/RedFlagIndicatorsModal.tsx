import { AlertTriangle, X, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getGaugeColorByPercentage } from '../utils/colors';
import IndicatorTitleDisplay from './IndicatorTitleDisplay';

export interface RedFlagIndicatorItem {
  id: string;
  indicatorName: string;
  divisionName: string;
  assignedToName: string;
  level: string;
  target: string;
  achievement: number;
  unit: string;
  percentage: number;
  agreementId?: string;
  rawObjective?: any;
}

interface RedFlagIndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: RedFlagIndicatorItem[];
  periodLabel: string;
  onViewDetail?: (indicator: RedFlagIndicatorItem) => void;
}

export default function RedFlagIndicatorsModal({
  isOpen,
  onClose,
  indicators,
  periodLabel,
  onViewDetail
}: RedFlagIndicatorsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-linear-to-r from-rose-600 via-rose-700 to-rose-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20">
              <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  Sistem Peringatan Dini (Early Warning)
                </span>
                <span className="text-[10px] font-bold text-rose-100 font-mono">
                  Periode: {periodLabel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Daftar Indikator Kinerja Red-Flag / Tertinggal ({indicators.length})
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Info Banner */}
        <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Indikator berikut memiliki realisasi <strong>di bawah 50% (kategori Merah/Kritis)</strong> terhadap target periode berjalan dan memerlukan intervensi/akselerasi dari pimpinan serta ketua tim terkait.
            </span>
          </div>
        </div>

        {/* Modal Body / Indicators List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {indicators.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">Kondisi Luar Biasa! Tidak Ada Indikator Red-Flag</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Seluruh indikator kinerja pada periode {periodLabel} berhasil mencapai realisasi di atas ambang batas kritis (≥ 50%).
                </p>
              </div>
            </div>
          ) : (
            indicators.map((item, idx) => {
              const gaugeColor = getGaugeColorByPercentage(item.percentage);

              return (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl border border-rose-200 bg-white hover:bg-rose-50/20 hover:border-rose-300 transition-all shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                          {item.divisionName}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 font-mono">
                          Level: {item.level}
                        </span>
                        <span className="text-[9px] font-bold text-indigo-600 font-mono">
                          PIC: {item.assignedToName}
                        </span>
                      </div>
                      <IndicatorTitleDisplay
                        title={item.indicatorName}
                        className="text-sm font-extrabold text-slate-800 leading-snug block"
                        subClassName="text-xs text-rose-700/80 font-semibold block mt-0.5"
                      />
                    </div>

                    {/* Percentage Badge */}
                    <div className="flex items-center gap-2 self-start shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-black text-rose-600 font-mono leading-none block">
                          {item.percentage}%
                        </span>
                        <span className="text-[8px] font-bold text-rose-700 uppercase tracking-wider font-mono">
                          Deviasi Kritis
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Target Realisasi details */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%`, backgroundColor: gaugeColor }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 gap-2">
                      <div className="flex items-center gap-3">
                        <span>
                          Target Periode: <strong className="text-slate-800 font-bold">{item.target}</strong>
                        </span>
                        <span>
                          Realisasi: <strong className="text-rose-600 font-bold">{item.achievement} {item.unit}</strong>
                        </span>
                      </div>

                      {onViewDetail && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewDetail(item);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Lihat Rincian Bidang <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">
            Total {indicators.length} indikator memerlukan percepatan
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
