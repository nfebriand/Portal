const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const s = code.indexOf('{/* Metric 1 */}');
const e = code.indexOf('{/* Delegation Form Modal */}');
const toRemove = code.substring(s, e);
console.log("Removing", toRemove.length, "characters");

code = code.substring(0, s) + code.substring(e);

fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
