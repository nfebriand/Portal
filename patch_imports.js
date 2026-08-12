const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const imports = `import bgPemberitaan from '../assets/images/bg_pemberitaan_1786536281249.jpg';
import bgTmb from '../assets/images/bg_tmb_1786536298066.jpg';
import bgLpu from '../assets/images/bg_lpu_1786536319133.jpg';
import bgKmb from '../assets/images/bg_kmb_1786536334535.jpg';
import bgSiaran from '../assets/images/bg_siaran_1786536353427.jpg';
import bgTu from '../assets/images/bg_tu_1786536368415.jpg';`;

code = code.replace(/import React/, imports + '\nimport React');
fs.writeFileSync('src/components/DashboardView.tsx', code);
