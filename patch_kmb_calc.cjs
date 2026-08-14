const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

code = code.replace(
  /indicators\.push\(\{ \.\.\.obj, _pct: pct, division: ag\.level \}\);/,
  `indicators.push({ ...obj, _pct: pct, division: ag.level, employeeName: ag.assignedToName });`
);

fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
