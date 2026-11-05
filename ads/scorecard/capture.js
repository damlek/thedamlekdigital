// Renders the scorecard flyers to PNG. Run from the repo root: node ads/scorecard/capture.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

  for (const name of ['sc1-warning', 'sc2-score', 'sc3-familiar']) {
    const url = 'file://' + path.join(__dirname, name + '.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const outPath = path.join(outDir, `thedamlek-scorecard-${name}-1080x1350.png`);
    await page.screenshot({ path: outPath });
    console.log('✓ ' + path.basename(outPath));
  }

  await browser.close();
})();
