const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// For metric cards on the top (around line 464)
code = code.replace(
  /\/\/ KMB\n\s*const kmbAg = agreements.find\(ag => ag.id === 'pk-default-katim-konten' \|\| ag.level.includes\('Konten Media Baru'\)\);\n\s*const kmbObjectives = kmbAg \? kmbAg.objectives : \[\];\n\s*let kmbSum = 0;\n\s*kmbObjectives.forEach\(obj => \{\n\s*const targetVal = parseFloat\(obj.target\) || 100;\n\s*kmbSum \+= targetVal > 0 \? \(obj.achievement \/ targetVal\) \* 100 : 0;\n\s*\}\);\n\s*const kmbPct = kmbObjectives.length > 0 \? Math.round\(kmbSum \/ kmbObjectives.length\) : 0;/,
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

// For Capaian PK Bidang (around line 698)
code = code.replace(
  /const kmbAg = findActiveAg\('Ketua Tim Konten Media Baru'\);/,
  `const kmbAg = findActiveAg('Ketua Tim Konten Media Baru');
    // Calculate shared KMB percentage for Capaian PK Bidang section
    let sharedKmbObjectives: any[] = [];
    let sharedKmbSum = 0;
    currentPeriodAgreements.forEach(ag => {
      if (!ag.objectives) return;
      ag.objectives.forEach(obj => {
        if (obj.supportedByKMB) {
          sharedKmbObjectives.push(obj);
          sharedKmbSum += obj._computedPct !== undefined ? obj._computedPct : 0;
        }
      });
    });
    const sharedKmbPct = sharedKmbObjectives.length > 0 ? Math.round(sharedKmbSum / sharedKmbObjectives.length) : 0;`
);

code = code.replace(
  /key: 'Konten Media Baru',\n\s*name: 'Konten Media Baru \(KMB\)',\n\s*level: 'Ketua Tim Konten Media Baru',\n\s*agreement: kmbAg,\n\s*pic: kmbAg\?.assignedToName \|\| 'Ketua Tim KMB',\n\s*status: kmbAg\?.status \|\| 'Draft',\n\s*percentage: getAvgPercentage\(kmbAg\),/,
  `key: 'Konten Media Baru',
        name: 'Konten Media Baru (KMB)',
        level: 'Ketua Tim Konten Media Baru',
        agreement: kmbAg, // Kept for reference but not strictly needed for percentage
        pic: kmbAg?.assignedToName || 'Siti Rahmawati, S.I.Kom.',
        status: sharedKmbObjectives.length > 0 ? 'Aktif (Agregasi)' : 'Menunggu Dukungan',
        percentage: sharedKmbPct,`
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
