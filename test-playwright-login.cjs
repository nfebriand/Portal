const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => {
    localStorage.setItem('swara_current_user', JSON.stringify({
      username: 'test',
      role: 'SUPER_ADMIN',
      level: 'Kepala Stasiun',
      id: 'usr-1',
      name: 'Super Admin Test',
      isKasatker: true,
      roleDisplay: 'Kepala Stasiun'
    }));
  });
  
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const html = await page.evaluate(() => document.body.innerHTML);
  if (html.includes('style="color:red')) {
    console.log("FOUND ERROR DIV:", html.substring(html.indexOf('style="color:red'), html.indexOf('</div>', html.indexOf('style="color:red')) + 6));
  } else {
    console.log("NO ERROR DIV. HTML starts with:", html.substring(0, 100));
  }
  
  await browser.close();
})();
