import fs from 'fs';

async function generate() {
  const collections = ['employees', 'settings', 'identity', 'notifications', 'contracts', 'reporterTargets', 'newsReports', 'promotions', 'agreements'];
  const fullData: any = {
    version: 1,
    data: {
      systemSeeded: true
    }
  };
  
  for (const col of collections) {
    const r = await fetch('http://localhost:3000/api/data/' + col);
    if (r.ok) {
      if (col === 'settings' || col === 'identity') {
        const arr = await r.json();
        fullData.data[col] = arr.length > 0 ? arr[0] : {};
      } else {
        fullData.data[col] = await r.json();
      }
    } else {
      fullData.data[col] = (col === 'settings' || col === 'identity') ? {} : [];
    }
  }
  
  fs.writeFileSync('Full_Backup_With_Agreements.json', JSON.stringify(fullData, null, 2));
  console.log("Created Full_Backup_With_Agreements.json");
}
generate();
