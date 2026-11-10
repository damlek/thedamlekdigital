// Renders index.html frame by frame and muxes it with the voice-over.
//   node ads/scorecard/video/render.js <audio file> [--ffmpeg path] [--fps 30]
//   node ads/scorecard/video/render.js --stills 3,10,20   (preview frames as PNGs)
// Needs ffmpeg (set FFMPEG or pass --ffmpeg; `npx ffmpeg-static` gives you one).
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const stills = opt('--stills');
const fps = +opt('--fps', 30);
const ffmpeg = opt('--ffmpeg', process.env.FFMPEG || 'ffmpeg');
const audio = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const outDir = path.join(__dirname, '..', 'exports');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  const url = 'file://' + path.join(__dirname, 'index.html').split(path.sep).join('/');
  await page.goto(url + '?t=0', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });

  if (stills) {
    const dir = path.join(__dirname, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate(t => render(t), t);
      await page.screenshot({ path: path.join(dir, `t${t.toFixed(1)}.png`) });
      console.log('still', t);
    }
    await browser.close();
    return;
  }

  if (!audio) throw new Error('Pass the voice-over audio file.');
  const duration = await page.evaluate(() => DURATION);
  const total = Math.ceil(duration * fps);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'thedamlek-scorecard-promo-1080x1920.mp4');
  const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', audio,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
    '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => render(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
  await browser.close();
  console.log('✓ ' + out);
})();
