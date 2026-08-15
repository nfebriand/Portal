const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');
const e = code.indexOf('{/* Delegation Form Modal */}');
code = code.substring(0, e) + '          </div>\n        </div>\n      )}\n      ' + code.substring(e);
fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
