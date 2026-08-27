const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const html = await page.content();
  console.log('HTML CONTENT:', html.substring(0, 1000));
  await browser.close();
})();
