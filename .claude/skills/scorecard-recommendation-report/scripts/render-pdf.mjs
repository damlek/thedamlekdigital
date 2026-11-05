// Renders an HTML file to PDF using the project's existing puppeteer
// dependency (same one capture.js uses for the ad image exports).
//
// Usage: node render-pdf.mjs --in report.html --out report.pdf

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const inPath = getArg('in');
const outPath = getArg('out');
if (!inPath || !outPath) {
  console.error('Usage: node render-pdf.mjs --in report.html --out report.pdf');
  process.exit(1);
}

const url = pathToFileURL(path.resolve(inPath)).href;

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' },
  });
  console.log(outPath);
} finally {
  await browser.close();
}
