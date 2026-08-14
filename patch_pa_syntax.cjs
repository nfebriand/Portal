const fs = require('fs');
let code = fs.readFileSync('src/components/PerformanceAgreementView.tsx', 'utf8');

code = code.replace(
  /\{canEditAgreement\(l2.agreement.level\) && \(\n\s*\{canEditAgreement\(l2.agreement.level\) && \(/g,
  `{canEditAgreement(l2.agreement.level) && (`
);

code = code.replace(
  /<button\n\s*onClick=\{\(\) => handleDeleteIndicator\(l2.agreement.id, l2Id\)\}\n\s*className="p-1 hover:bg-rose-50 text-rose-500 rounded-md"\n\s*>\n\s*<Trash2 className="w-3 h-3" \/>\n\s*<\/button>\n\s*\)\}/g,
  `<button
                                        onClick={() => handleDeleteIndicator(l2.agreement.id, l2Id)}
                                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-md"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>`
);

fs.writeFileSync('src/components/PerformanceAgreementView.tsx', code);
