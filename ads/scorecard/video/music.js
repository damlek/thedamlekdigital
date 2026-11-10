// Synthesises an original, royalty-free music bed for the promo video and writes music.wav.
// 108 BPM, C–G–Am–F, with whooshes on the scene transitions in index.html.
//   node ads/scorecard/video/music.js
const fs = require('fs');
const path = require('path');

const SR = 44100, DUR = 87.3, N = Math.ceil(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 108, BEAT = 60 / BPM, BAR = BEAT * 4;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CUTS = [6.7, 13.5, 25.2, 31.4, 36.3, 45.0, 55.7, 69.5, 79.6]; // scene changes
const FADE_OUT = 85.6;

// chord per bar: C, G, Am, F
const CHORDS = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]];
const BASS = [36, 43, 45, 41];
const chordAt = t => Math.floor(t / BAR) % 4;

// master envelope: gentle intro, fade at the end
const master = t => Math.min(1, 0.55 + t / 14) * (t > FADE_OUT ? Math.max(0, 1 - (t - FADE_OUT) / (DUR - FADE_OUT)) : 1);
// intensity layers switch on as the video builds
const drumsOn = t => t >= CUTS[0];
const hatsOn = t => t >= CUTS[1];
const snareOn = t => t >= CUTS[2];

let seed = 12345;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };

// ---- pad: detuned saws through a two-pole lowpass ----
{
  const ph = new Float64Array(18).fill(0);
  let lp1L = 0, lp2L = 0, lp1R = 0, lp2R = 0;
  const a = 1 - Math.exp(-2 * Math.PI * 900 / SR);
  for (let i = 0; i < N; i++) {
    const t = i / SR, c = chordAt(t), inBar = (t % BAR) / BAR;
    const env = Math.min(1, inBar * 6) * (inBar > 0.92 ? 1 - (inBar - 0.92) / 0.08 * 0.5 : 1);
    let sl = 0, sr = 0;
    CHORDS[c].forEach((m, k) => {
      const f = mtof(m - 12);
      [-0.12, 0, 0.12].forEach((d, j) => {
        const idx = k * 3 + j;
        ph[idx] = (ph[idx] + f * Math.pow(2, d / 12) / SR) % 1;
        const s = 2 * ph[idx] - 1;
        if (j === 0) sl += s; else if (j === 2) sr += s; else { sl += s * 0.6; sr += s * 0.6; }
      });
    });
    lp1L += a * (sl - lp1L); lp2L += a * (lp1L - lp2L);
    lp1R += a * (sr - lp1R); lp2R += a * (lp1R - lp2R);
    const g = 0.055 * env * master(t);
    L[i] += lp2L * g; R[i] += lp2R * g;
  }
}

// ---- bass: soft sine with a little saturation, eighth-note pulse ----
{
  let p = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, f = mtof(BASS[chordAt(t)]);
    p += f / SR;
    const e8 = (t % (BEAT / 2)) / (BEAT / 2);
    const env = drumsOn(t) ? Math.exp(-e8 * 2.2) : 0.55;
    const s = Math.tanh(1.6 * Math.sin(2 * Math.PI * p)) * 0.16 * env * master(t);
    L[i] += s; R[i] += s;
  }
}

// ---- pluck arpeggio on eighths ----
const addPluck = (t0, m, vol, pan) => {
  const f = mtof(m), n = Math.floor(SR * 0.6), i0 = Math.floor(t0 * SR);
  for (let k = 0; k < n && i0 + k < N; k++) {
    const tt = k / SR, env = Math.exp(-tt / 0.16) * Math.min(1, tt * 400);
    const s = (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(4 * Math.PI * f * tt)) * env * vol * master(t0);
    L[i0 + k] += s * (1 - pan); R[i0 + k] += s * (1 + pan);
  }
};
for (let t = 0; t < DUR - 1; t += BEAT / 2) {
  const step = Math.round(t / (BEAT / 2)) % 8, c = CHORDS[chordAt(t)];
  const pat = [0, 1, 2, 1, 0, 2, 1, 2][step];
  addPluck(t, c[pat] + 12, t < CUTS[0] ? 0.05 : 0.07, step % 2 ? 0.25 : -0.25);
}

// ---- drums ----
const addKick = t0 => {
  const i0 = Math.floor(t0 * SR); let p = 0;
  for (let k = 0; k < SR * 0.35 && i0 + k < N; k++) {
    const tt = k / SR, f = 45 + 95 * Math.exp(-tt * 28);
    p += f / SR;
    const s = Math.sin(2 * Math.PI * p) * Math.exp(-tt * 9) * 0.42 * master(t0);
    L[i0 + k] += s; R[i0 + k] += s;
  }
};
const addNoiseHit = (t0, dur, vol, hp, pan) => {
  const i0 = Math.floor(t0 * SR); let prev = 0, lp = 0;
  for (let k = 0; k < SR * dur && i0 + k < N; k++) {
    const tt = k / SR, x = noise();
    lp += hp * (x - lp); const h = x - lp; prev = h;
    const s = prev * Math.exp(-tt / (dur / 4)) * vol * master(t0);
    L[i0 + k] += s * (1 - pan); R[i0 + k] += s * (1 + pan);
  }
};
for (let t = 0; t < FADE_OUT + BEAT; t += BEAT) {
  const beat = Math.round(t / BEAT) % 4;
  if (drumsOn(t)) addKick(t);
  if (hatsOn(t)) { addNoiseHit(t + BEAT / 2, 0.06, 0.07, 0.6, 0.3); addNoiseHit(t, 0.04, 0.035, 0.6, -0.3); }
  if (snareOn(t) && (beat === 1 || beat === 3)) addNoiseHit(t, 0.18, 0.12, 0.15, 0);
}

// ---- whooshes into each scene change (longer riser before the big reveal) ----
const addWhoosh = (tc, len) => {
  const t0 = tc - len, i0 = Math.max(0, Math.floor(t0 * SR)); let lp = 0;
  for (let k = 0; k < SR * (len + 0.35) && i0 + k < N; k++) {
    const tt = i0 / SR + k / SR - t0, x = tt / len;
    const cutoff = 300 + 5000 * Math.min(1, x) ** 2;
    lp += (1 - Math.exp(-2 * Math.PI * cutoff / SR)) * (noise() - lp);
    const env = x < 1 ? x ** 2 : Math.exp(-(tt - len) * 14);
    const pan = Math.sin(x * Math.PI) * 0.5;
    const s = lp * env * 0.22;
    L[i0 + k] += s * (1 - pan); R[i0 + k] += s * (1 + pan);
  }
};
CUTS.forEach(tc => addWhoosh(tc, tc === 25.2 ? 1.6 : 0.5));

// ---- normalise and write 16-bit WAV ----
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(__dirname, 'music.wav'), buf);
console.log('✓ music.wav', DUR + 's');
