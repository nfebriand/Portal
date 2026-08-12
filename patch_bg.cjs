const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const helper = `
const getDivisionBgImage = (key: string) => {
  switch (key) {
    case 'Pemberitaan': return bgPemberitaan;
    case 'Teknologi dan Media Baru': return bgTmb;
    case 'Layanan Pengembangan Usaha': return bgLpu;
    case 'Konten Media Baru': return bgKmb;
    case 'Siaran': return bgSiaran;
    case 'Tata Usaha / Umum': return bgTu;
    default: return '';
  }
};
`;

code = code.replace(/export default function DashboardView/, helper + '\nexport default function DashboardView');
fs.writeFileSync('src/components/DashboardView.tsx', code);
