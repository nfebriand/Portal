const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove all lines containing localStorage.setItem('e_station_
code = code.replace(/.*localStorage\.setItem\('e_station_.*\n/g, '');

fs.writeFileSync('src/App.tsx', code);
