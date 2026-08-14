const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const calculationLogic = `
  // KMB Shared Indicators Calculation
  const kmbSharedIndicators = React.useMemo(() => {
    let indicators: any[] = [];
    let sum = 0;
    
    // Group support by division
    let siaranCount = 0;
    let siaranSum = 0;
    let beritaCount = 0;
    let beritaSum = 0;

    agreements.forEach(ag => {
      if (!ag.objectives) return;
      ag.objectives.forEach(obj => {
        if (obj.supportedByKMB) {
          const targetVal = parseFloat(obj.target) || 100;
          const pct = targetVal > 0 ? Math.min(100, Math.round((obj.achievement / targetVal) * 100)) : 0;
          
          indicators.push({ ...obj, _pct: pct, division: ag.level });
          sum += pct;

          if (ag.level.includes('Siaran')) {
            siaranCount++;
            siaranSum += pct;
          } else if (ag.level.includes('Pemberitaan')) {
            beritaCount++;
            beritaSum += pct;
          }
        }
      });
    });

    const average = indicators.length > 0 ? Math.round(sum / indicators.length) : 0;
    const siaranAverage = siaranCount > 0 ? Math.round(siaranSum / siaranCount) : 0;
    const beritaAverage = beritaCount > 0 ? Math.round(beritaSum / beritaCount) : 0;

    return { indicators, average, siaranAverage, beritaAverage };
  }, [agreements]);
`;

code = code.replace(
  "  // Mode visualisasi target PK per divisi",
  calculationLogic + "\n  // Mode visualisasi target PK per divisi"
);

if (!code.includes("import React")) {
  code = "import React from 'react';\n" + code;
}

code = code.replace(
  /<Pie\n\s*data=\{(?:[^}]+)\}\n\s*cx="50%"\n\s*cy="50%"\n\s*startAngle=\{180\}\n\s*endAngle=\{0\}\n\s*innerRadius=\{50\}\n\s*outerRadius=\{70\}\n\s*dataKey="value"/g,
  `<Pie
                          data={[
                            { name: 'Capaian', value: kmbSharedIndicators.average },
                            { name: 'Sisa', value: 100 - kmbSharedIndicators.average }
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={50}
                          outerRadius={70}
                          dataKey="value"`
);

code = code.replace(
  /<span className="text-3xl font-black text-white font-mono">88\.5<span className="text-sm text-slate-400">%<\/span><\/span>/,
  `<span className="text-3xl font-black text-white font-mono">{kmbSharedIndicators.average}<span className="text-sm text-slate-400">%</span></span>`
);

code = code.replace(
  /<span className="text-xs font-black text-emerald-400">85%<\/span>/,
  `<span className="text-xs font-black text-emerald-400">{kmbSharedIndicators.siaranAverage}%</span>`
);

code = code.replace(
  /<span className="text-xs font-black text-emerald-400">92%<\/span>/,
  `<span className="text-xs font-black text-emerald-400">{kmbSharedIndicators.beritaAverage}%</span>`
);

fs.writeFileSync('src/components/DashboardBidangView.tsx', code);
