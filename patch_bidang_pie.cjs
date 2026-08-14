const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

code = code.replace(
  /<Pie\n\s*data=\{\[\n\s*\{ name: 'Capaian', value: 88\.5 \},\n\s*\{ name: 'Sisa', value: 11\.5 \}\n\s*\]\}/,
  `<Pie
                          data={[
                            { name: 'Capaian', value: kmbSharedIndicators.average },
                            { name: 'Sisa', value: 100 - kmbSharedIndicators.average }
                          ]}`
);

fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
