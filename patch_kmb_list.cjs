const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const tableCode = `
              {/* DAFTAR INDIKATOR KMB */}
              {kmbSharedIndicators.indicators.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50 relative z-10">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Rincian Ketercapaian Indikator
                  </h3>
                  <div className="space-y-2">
                    {kmbSharedIndicators.indicators.map((ind, idx) => (
                      <div key={idx} className="bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 tracking-wider">
                               {ind.division}
                             </span>
                           </div>
                           <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">{ind.indicatorName}</p>
                        </div>
                        <div className="shrink-0 sm:text-right flex sm:block items-center justify-between">
                          <p className="text-[10px] text-slate-400 sm:mb-1 font-mono">
                            {ind.achievement} / {ind.target} <span className="text-[9px]">{ind.unit}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 sm:w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: \`\${Math.min(100, ind._pct)}%\` }} />
                            </div>
                            <span className="text-xs font-black text-white font-mono w-8 text-right">{ind._pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
`;

code = code.replace(
  /<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}\n\n\s*\{\/\* Metric 1 \*\/\}/g,
  `</div>\n              </div>\n` + tableCode + `\n\n            {/* Metric 1 */}`
);

fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
