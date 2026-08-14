const fs = require('fs');
let code = fs.readFileSync('src/components/PerformanceAgreementView.tsx', 'utf8');

// For L1 (root)
code = code.replace(
  /<button\n\s*onClick=\{\(\) => handleDeleteIndicator\(node\.agreement\.id, rootId\)\}\n\s*className="p-1\.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"\n\s*>\n\s*<Trash2 className="w-3\.5 h-3\.5" \/>\n\s*<\/button>/,
  `{canEditAgreement('Kepala Stasiun') && (
                              <button
                                onClick={() => handleToggleKMBSupport(node.agreement.id, rootId)}
                                className={\`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors \${
                                  node.root.supportedByKMB 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                }\`}
                                title="Tandai indikator ini didukung oleh KMB"
                              >
                                <div className={\`w-3 h-3 rounded flex items-center justify-center border \${
                                  node.root.supportedByKMB ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                }\`}>
                                  {node.root.supportedByKMB && <Check className="w-2.5 h-2.5" />}
                                </div>
                                Dukungan KMB
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteIndicator(node.agreement.id, rootId)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`
);

// For L2
code = code.replace(
  /<button\n\s*onClick=\{\(\) => handleDeleteIndicator\(l2\.agreement\.id, l2Id\)\}\n\s*className="p-1 hover:bg-rose-50 text-rose-500 rounded-md"\n\s*>\n\s*<Trash2 className="w-3 h-3" \/>\n\s*<\/button>/,
  `{canEditAgreement(l2.agreement.level) && (
                                        <button
                                          onClick={() => handleToggleKMBSupport(l2.agreement.id, l2Id)}
                                          className={\`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-colors \${
                                            l2.indicator.supportedByKMB 
                                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                              : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                          }\`}
                                          title="Tandai indikator ini didukung oleh KMB"
                                        >
                                          <div className={\`w-3 h-3 rounded flex items-center justify-center border \${
                                            l2.indicator.supportedByKMB ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                          }\`}>
                                            {l2.indicator.supportedByKMB && <Check className="w-2.5 h-2.5" />}
                                          </div>
                                          KMB
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteIndicator(l2.agreement.id, l2Id)}
                                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-md"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>`
);

fs.writeFileSync('src/components/PerformanceAgreementView.tsx', code);
