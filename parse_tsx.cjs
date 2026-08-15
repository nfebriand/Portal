const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const s = code.indexOf('teamObjectives.map((obj, idx) => {');
const e = code.indexOf('              )}', s);
console.log(code.substring(s, s+2000));
