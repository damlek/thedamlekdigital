// Turns Whisper word timestamps (words.json) into caption chunks (captions.js),
// correcting words Whisper misheard. Run: node ads/scorecard/video/build-captions.js
const fs = require('fs');
const path = require('path');
const words = require('./words.json');

// start time -> corrected text ('' drops the word, '+' merges into previous word)
const FIX = {
  '0.96': 'your', '3.22': 'budget', '16.08': 'leads', '17.16': 'get',
  '25.94': 'built', '26.26': 'a free', '72.30': '', '73.54': '', '26.58': 'tool', '27.96': "it's", '28.70': 'Growth', '29.52': 'Readiness', '30.10': 'Scorecard.',
  '32.62': '30', '35.06': 'about', '35.12': '', '37.80': 'your', '40.64': 'funnel,', '40.90': '', '43.84': 'your',
  '45.90': 'a', '46.18': 'score', '55.86': 'So', '59.06': "that's", '61.60': 'the',
  '67.20': 'where', '68.08': '+', '73.66': 'thedamlekdigital.com/scorecard',
  '73.86': '', '75.26': '', '75.54': '', '76.24': '', '76.60': '', '80.42': 'comment', '84.78': 'where',
};

const toks = [];
for (const w of words) {
  const key = w.timestamp[0].toFixed(2);
  let text = w.text.trim();
  if (key in FIX) text = FIX[key];
  if (text === '') continue;
  if (text === '+') { const p = toks[toks.length - 1]; p.w += w.text.trim(); p.e = w.timestamp[1]; continue; }
  toks.push({ w: text, s: w.timestamp[0], e: w.timestamp[1] });
}

// start times where a new phrase begins (Whisper drops most punctuation)
const BREAK = new Set(['2.96','4.76','7.10','8.24','12.36','23.18','9.44','10.96','13.84','15.72','18.50','20.22','22.12','24.16','25.46','27.00','27.96','31.64','33.94','34.76','36.48','37.80','39.76','41.66','43.70','45.22','46.54','48.22','49.78','51.46','53.20','55.86','57.64','59.06','60.66','61.28','62.28','64.20','65.64','67.20','68.28','69.78','70.68','72.60','77.60','79.82','81.54','82.74','84.78']);
const chunks = [];
let cur = null;
for (const t of toks) {
  const isUrl = t.w.includes('.com');
  const brk = !cur || isUrl || cur.isUrl || cur.words.length >= 7 || BREAK.has(t.s.toFixed(2));
  if (brk) { cur = { words: [], isUrl }; chunks.push(cur); }
  cur.words.push(t);
}
const out = chunks.map((c, i) => {
  const s = c.words[0].s - 0.08;
  const lastEnd = c.words[c.words.length - 1].e;
  const next = chunks[i + 1] ? chunks[i + 1].words[0].s - 0.08 : lastEnd + 0.6;
  return { s: +s.toFixed(2), e: +Math.min(next, lastEnd + 0.6).toFixed(2), words: c.words.map(w => ({ w: w.w.replace(/[,]$/, ''), s: w.s })) };
});
fs.writeFileSync(path.join(__dirname, 'captions.js'), 'window.CAPS = ' + JSON.stringify(out) + ';\n');
console.log(out.map(c => c.s.toFixed(1) + '  ' + c.words.map(w => w.w).join(' ')).join('\n'));
