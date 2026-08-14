const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Remove the wrongly inserted code at the top
const badCode = `// KMB (Shared Indicators - Option 1)    let kmbObjectives: any[] = [];    let kmbSum = 0;    agreements.forEach(ag => {      if (!ag.objectives) return;      ag.objectives.forEach(obj => {        if (obj.supportedByKMB) {          kmbObjectives.push(obj);          const targetVal = parseFloat(obj.target) || 100;          kmbSum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;        }      });    });    const kmbPct = kmbObjectives.length > 0 ? Math.round(kmbSum / kmbObjectives.length) : 0;`;
code = code.replace(badCode, "");

// Now do the correct replacement
code = code.replace(
  /\/\/ KMB\s+const kmbAg = agreements.find\([^;]+;\s+const kmbObjectives = kmbAg \? kmbAg.objectives : \[\];\s+let kmbSum = 0;\s+kmbObjectives.forEach\(obj => \{\s+const targetVal = parseFloat\(obj.target\) \|\| 100;\s+kmbSum \+= targetVal > 0 \? \(obj.achievement \/ targetVal\) \* 100 : 0;\s+\}\);\s+const kmbPct = kmbObjectives.length > 0 \? Math.round\(kmbSum \/ kmbObjectives.length\) : 0;/g,
  `// KMB (Shared Indicators - Option 1)
    let kmbObjectives: any[] = [];
    let kmbSum = 0;
    agreements.forEach(ag => {
      if (!ag.objectives) return;
      ag.objectives.forEach(obj => {
        if (obj.supportedByKMB) {
          kmbObjectives.push(obj);
          const targetVal = parseFloat(obj.target) || 100;
          kmbSum += targetVal > 0 ? (obj.achievement / targetVal) * 100 : 0;
        }
      });
    });
    const kmbPct = kmbObjectives.length > 0 ? Math.round(kmbSum / kmbObjectives.length) : 0;`
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
