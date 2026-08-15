const fs = require('fs');
const code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');
const s = code.indexOf("{activeTab === 'summary' && (");
const e = code.indexOf('{/* Delegation Form Modal */}');
const chunk = code.substring(s, e);
const openDivs = (chunk.match(/<div[\s>]/g) || []).length;
const closeDivs = (chunk.match(/<\/div>/g) || []).length;
console.log("Open:", openDivs, "Close:", closeDivs);
