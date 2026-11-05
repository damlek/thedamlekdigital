const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = path.join(__dirname, 'ads', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const ads = [
    { file: 'ad1', name: 'dark-bold' },
    { file: 'ad2', name: 'orange-hero' },
    { file: 'ad3', name: 'free-offer' },
    { file: 'ad4', name: 'sage-services' },
  ];

  for (const { file, name } of ads) {
    const url = 'file://' + path.join(__dirname, 'ads', file + '.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    const outPath = path.join(outDir, `thedamlek-${name}-1080x1080.png`);
    await page.screenshot({ path: outPath });
    console.log(`✓  thedamlek-${name}-1080x1080.png`);
  }

  await browser.close();
  console.log('\nAll 4 ads saved to: ads/exports/');
})();
