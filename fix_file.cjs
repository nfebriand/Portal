const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const start = code.indexOf('const { ownObjectives, teamObjectives } = useMemo(() => {');
const end = code.indexOf('}, [divisionAgreements, currentUser]);');
console.log(code.substring(start, end + 40));
