const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

const importStr = `import bgLogin from '../assets/images/bg_login_rri_1786536696501.jpg';`;
code = code.replace(/import \{ Key, Radio/, importStr + '\nimport { Key, Radio');

const replacement = `<div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20" 
        style={{ backgroundImage: \`url(\${bgLogin})\` }} 
      />
      <div className="absolute inset-0 bg-slate-950/80 z-0" />`;

code = code.replace(/\{.*\/\* Decorative ambient glow \*\/\}/, replacement + '\n      {/* Decorative ambient glow */}');

fs.writeFileSync('src/components/LoginView.tsx', code);
