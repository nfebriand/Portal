const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const newTable = `              {/* DAFTAR INDIKATOR KMB */}
              {kmbSharedIndicators.indicators.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-700/50 relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Tabel Referensi Ketercapaian
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Daftar seluruh indikator (termasuk Level 3) yang didukung oleh Konten Media Baru.</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th className="px-4 py-3">Nama Indikator</th>
                            <th className="px-4 py-3">Pemilik PK / Level</th>
                            <th className="px-4 py-3 text-center">Bobot</th>
                            <th className="px-4 py-3 text-right">Target vs Realisasi</th>
                            <th className="px-4 py-3 text-right">Status Capaian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {kmbSharedIndicators.indicators.map((ind, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-xs whitespace-normal" title={ind.indicatorName}>
                                  {ind.indicatorName}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-indigo-300">{ind.employeeName}</span>
                                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">{ind.division}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                                  {ind.weight}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="font-mono text-[10px]">
                                  <span className="text-white">{ind.achievement}</span>
                                  <span className="text-slate-500 mx-1">/</span>
                                  <span className="text-slate-400">{ind.target} {ind.unit}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                    <div 
                                      className={\`h-full rounded-full \${ind._pct >= 100 ? 'bg-emerald-400' : ind._pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}\`} 
                                      style={{ width: \`\${Math.min(100, ind._pct)}%\` }} 
                                    />
                                  </div>
                                  <span className={\`font-black font-mono w-9 text-right \${ind._pct >= 100 ? 'text-emerald-400' : ind._pct >= 50 ? 'text-amber-400' : 'text-rose-400'}\`}>
                                    {ind._pct}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}`;

const regex = /\{\/\* DAFTAR INDIKATOR KMB \*\/\}[\s\S]*?(?=<\/div>\n\s*\)\}\n\n\s*\{\/\* Metric 1 \*\/)/;

code = code.replace(regex, newTable + '\n            ');

fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
