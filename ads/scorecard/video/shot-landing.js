// Captures the scorecard landing page at phone size for the promo video.
const p = require('puppeteer'), path = require('path');
(async () => {
  const b = await p.launch(); const pg = await b.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const url = 'file://' + path.resolve(__dirname, '../../../scorecard.html').split(path.sep).join('/');
  await pg.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('nav', e.message));
  await new Promise(r => setTimeout(r, 1500));
  await pg.screenshot({ path: path.join(__dirname, 'phone-landing.png') });
  await b.close();
})();
