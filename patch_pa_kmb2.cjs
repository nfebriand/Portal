const fs = require('fs');
let code = fs.readFileSync('src/components/PerformanceAgreementView.tsx', 'utf8');

// For L1 (root)
code = code.replace(
  /<button\n\s*onClick=\{handleDeleteTarget\}\n\s*className="p-1\.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"\n\s*title="Hapus Target"\n\s*>\n\s*<Trash2 className="w-4 h-4" \/>\n\s*<\/button>/,
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
                              Support KMB
                            </button>
                          )}
                          <button
                            onClick={handleDeleteTarget}
                            className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hapus Target"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>`
);

// For L2
code = code.replace(
  /<button\n\s*onClick=\{\(\) => handleDeleteLevel2\(l2\.agreement\.id, l2Id\)\}\n\s*className="p-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 rounded transition-colors"\n\s*title="Hapus PK L2"\n\s*>\n\s*<Trash2 className="w-3 h-3" \/>\n\s*<\/button>/,
  `{canEditAgreement(l2.agreement.level) && (
                                      <button
                                        onClick={() => handleToggleKMBSupport(l2.agreement.id, l2Id)}
                                        className={\`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold transition-colors \${
                                          l2.indicator.supportedByKMB 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                            : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                        }\`}
                                        title="Tandai indikator ini didukung oleh KMB"
                                      >
                                        <div className={\`w-2.5 h-2.5 rounded-sm flex items-center justify-center border \${
                                          l2.indicator.supportedByKMB ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                        }\`}>
                                          {l2.indicator.supportedByKMB && <Check className="w-2 h-2" />}
                                        </div>
                                        KMB
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteLevel2(l2.agreement.id, l2Id)}
                                      className="p-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                      title="Hapus PK L2"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>`
);

fs.writeFileSync('src/components/PerformanceAgreementView.tsx', code);
