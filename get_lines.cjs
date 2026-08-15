const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');
const s = code.indexOf("activeTab === 'delegation'");
console.log("Index 1:", s);
if (s !== -1) {
  const s2 = code.indexOf("activeTab === 'delegation'", s + 1);
  console.log("Index 2:", s2);
  if (s2 !== -1) {
    console.log(code.substring(s2 - 50, s2 + 100));
  }
}
