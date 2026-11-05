// Renders a fully-populated content object (see generate-content.mjs) into
// the branded HTML report — same design system as thedamlekdigital's site
// (Playfair Display + DM Sans, black/orange palette from scorecard.html).
//
// Usage: node build-report.mjs --in content.json --out report.html

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

function bandClass(b) {
  return b === 'good' ? 'band-good' : b === 'mid' ? 'band-mid' : 'band-attn';
}
function scoreClass(b) {
  return b === 'good' ? 'good' : b === 'mid' ? 'mid' : 'attn';
}

function bars(categories) {
  return categories.map(c => `
    <div class="bar-row">
      <div class="bar-label">${esc(c.name)}</div>
      <div class="bar-track"><div class="bar-fill ${bandClass(c.band)} tnum" style="width:${c.pct}%"></div></div>
      <div class="bar-pct tnum">${c.pct}%</div>
    </div>`).join('');
}

function catBlock(c) {
  const evidence = c.evidence.map(e => `<li>${esc(e)}</li>`).join('');
  const fixes = c.fixes.length
    ? c.fixes.map(f => `<li>${esc(f)}</li>`).join('')
    : `<li>Already strong here — hold this steady while the rest catches up.</li>`;
  return `
  <div class="cat">
    <div class="cat-head">
      <h3>${esc(c.name)}</h3>
      <div class="cat-score ${scoreClass(c.band)}"><span class="cat-num tnum">${c.pct}</span>/100</div>
    </div>
    <div class="cat-block">
      <h4>What the answers showed</h4>
      <ul class="evidence">${evidence}</ul>
    </div>
    <div class="cat-block">
      <h4>Recommended next steps</h4>
      <ul class="fixes">${fixes}</ul>
    </div>
  </div>`;
}

function roadmapSteps(roadmap) {
  if (roadmap.length === 0) {
    return `<div class="step"><div class="step-num tnum">&#10003;</div><div><h4>Every category is already 70%+</h4><p>This business is ready to move straight to structured paid media testing.</p></div></div>`;
  }
  return roadmap.map(s => `
    <div class="step">
      <div class="step-num tnum">${String(s.step).padStart(2, '0')}</div>
      <div>
        <h4>${esc(s.title)}</h4>
        <p>${esc(s.action)}</p>
        <span class="step-why">${esc(s.why)}</span>
      </div>
    </div>`).join('');
}

function brightSpotBlock(bs) {
  if (!bs) return '';
  return `
  <div class="callout">
    <div class="eyebrow">Bright spot</div>
    <p>"${esc(bs.question)}" was answered with the top score on the scorecard: "${esc(bs.label)}" — a real strength in ${esc(bs.category)} worth building the rest of this plan on.</p>
  </div>`;
}

export function renderReport(d) {
  const websiteLine = d.website
    ? esc(d.website)
    : 'No dedicated site on file';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.businessName || d.name)} — Growth Readiness Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#FFFFFF; --paper-raised:#FFF8F4; --ink:#15130F; --ink-muted:#6B6459;
    --border:#E7E2DC; --accent:#E16638; --accent-soft:#FF9972;
    --amber:#B9862C; --amber-tint:#FBF1DF; --good:#6E8A54; --good-tint:#EEF2E7;
    --accent-tint:#FFF3EC;
  }
  *{margin:0;padding:0;box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact;}
  html{scroll-behavior:smooth;}
  @media print{ .masthead,.cta{break-inside:avoid;} .cat,.step{break-inside:avoid;} section{break-inside:avoid-page;} }
  body{ font-family:'DM Sans', sans-serif; color:var(--ink); background:var(--paper); line-height:1.6; -webkit-font-smoothing:antialiased; }
  h1,h2,h3{ font-family:'Playfair Display', Georgia, serif; font-weight:800; line-height:1.15; letter-spacing:-0.01em; text-wrap:balance; }
  .tnum{ font-variant-numeric:tabular-nums; }
  .wrap{ max-width:760px; margin:0 auto; padding:0 24px; }

  .masthead{ background:var(--ink); color:var(--paper); padding:56px 0 44px; }
  .eyebrow{ font-weight:700; font-size:12.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent-soft); margin-bottom:18px; }
  .masthead h1{ font-size:clamp(30px,4.4vw,42px); color:var(--paper); max-width:16ch; }
  .masthead-meta{ display:flex; flex-wrap:wrap; gap:28px; margin-top:28px; font-size:14px; }
  .masthead-meta div{ color:#cfc8ba; }
  .masthead-meta span{ display:block; font-weight:700; color:var(--paper); font-size:14.5px; margin-top:2px; }
  .score-panel{ display:flex; align-items:center; gap:26px; margin-top:36px; padding-top:32px; border-top:1px solid #33302a; flex-wrap:wrap; }
  .score-num{ font-family:'Playfair Display', serif; font-weight:900; font-size:76px; line-height:1; color:var(--accent-soft); }
  .score-num sub{ font-family:'DM Sans',sans-serif; font-weight:600; font-size:20px; color:#cfc8ba; }
  .tier-badge{ display:inline-block; background:var(--accent); color:#15130F; font-weight:700; font-size:12.5px; letter-spacing:0.05em; text-transform:uppercase; padding:6px 14px; border-radius:99px; margin-bottom:10px; }
  .score-tier p{ max-width:38ch; color:#cfc8ba; font-size:14.5px; }

  section{ padding:52px 0; }
  section + section{ border-top:1px solid var(--border); }
  h2{ font-size:26px; margin-bottom:16px; }
  .lede{ font-size:17px; color:var(--ink-muted); max-width:66ch; }
  p{ max-width:66ch; }
  p + p{ margin-top:14px; }

  .bars{ margin-top:30px; display:flex; flex-direction:column; gap:18px; }
  .bar-row{ display:grid; grid-template-columns:180px 1fr 64px; align-items:center; gap:14px; }
  .bar-label{ font-weight:700; font-size:14.5px; }
  .bar-track{ height:10px; background:var(--paper-raised); border:1px solid var(--border); border-radius:99px; overflow:hidden; }
  .bar-fill{ height:100%; border-radius:99px; }
  .bar-pct{ font-weight:700; font-size:14.5px; text-align:right; }
  .band-attn{ background:var(--accent); }
  .band-mid{ background:var(--amber); }
  .band-good{ background:var(--good); }
  @media (max-width:560px){ .bar-row{ grid-template-columns:1fr; gap:6px; } .bar-pct{ text-align:left; } }

  .band-key{ display:flex; gap:22px; margin-top:22px; flex-wrap:wrap; }
  .band-key div{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-muted); font-weight:600; }
  .swatch{ width:10px; height:10px; border-radius:3px; }

  .callout{ margin-top:28px; background:var(--good-tint); border:1px solid var(--good); border-radius:14px; padding:20px 24px; }
  .callout .eyebrow{ color:var(--good); margin-bottom:8px; }
  .callout p{ color:var(--ink); font-size:15px; }

  .cat{ padding:36px 0; }
  .cat + .cat{ border-top:1px solid var(--border); }
  .cat-head{ display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:6px; }
  .cat-head h3{ font-size:21px; }
  .cat-score{ font-weight:700; font-size:15px; padding:4px 12px; border-radius:99px; white-space:nowrap; }
  .cat-score.attn{ background:var(--accent-tint); color:var(--accent); }
  .cat-score.mid{ background:var(--amber-tint); color:var(--amber); }
  .cat-score.good{ background:var(--good-tint); color:var(--good); }
  .cat-num{ font-family:'Playfair Display',serif; }
  .cat-block{ margin-top:18px; }
  .cat-block h4{ font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-muted); font-weight:700; margin-bottom:10px; }
  .evidence{ list-style:none; display:flex; flex-direction:column; gap:8px; }
  .evidence li{ font-size:14.5px; color:var(--ink-muted); padding-left:18px; position:relative; }
  .evidence li::before{ content:"\\201C"; position:absolute; left:0; top:-2px; color:var(--border); font-family:'Playfair Display',serif; font-size:20px; }
  .fixes{ list-style:none; display:flex; flex-direction:column; gap:10px; }
  .fixes li{ font-size:15px; padding-left:26px; position:relative; }
  .fixes li::before{ content:"\\2192"; position:absolute; left:0; color:var(--accent); font-weight:700; }

  .roadmap{ display:flex; flex-direction:column; margin-top:30px; }
  .step{ display:grid; grid-template-columns:44px 1fr; gap:18px; padding:20px 0; }
  .step + .step{ border-top:1px solid var(--border); }
  .step-num{ font-family:'Playfair Display',serif; font-weight:900; font-size:26px; color:var(--border); }
  .step h4{ font-size:16.5px; font-weight:700; margin-bottom:4px; }
  .step p{ font-size:14.5px; color:var(--ink-muted); }
  .step-why{ display:inline-block; margin-top:8px; font-size:12.5px; font-weight:700; letter-spacing:0.03em; color:var(--accent); background:var(--accent-tint); padding:3px 10px; border-radius:6px; }

  .note{ background:var(--paper-raised); border:1px solid var(--border); border-radius:14px; padding:24px 26px; margin-top:8px; }
  .note h4{ font-size:14px; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px; color:var(--ink); }
  .note p{ font-size:14.5px; color:var(--ink-muted); }

  .cta{ background:var(--ink); color:var(--paper); padding:52px 0; text-align:left; }
  .cta h2{ color:var(--paper); font-size:26px; margin-bottom:12px; }
  .cta p{ color:#cfc8ba; font-size:15px; max-width:56ch; }

  footer{ padding:32px 0 56px; font-size:12.5px; color:var(--ink-muted); }
  footer .wrap{ display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; }
</style>
</head>
<body>

<div class="masthead">
  <div class="wrap">
    <div class="eyebrow">Growth Readiness Scorecard &middot; Recommendation Report</div>
    <h1>${esc(d.businessName || d.name)}</h1>
    <div class="masthead-meta">
      <div>Prepared for<span>${esc(d.name)}</span></div>
      <div>Submitted<span>${esc(fmtDate(d.submittedAt))}</span></div>
      <div>Monthly budget<span>${esc(d.budgetLabel)}</span></div>
      <div>Current web presence<span>${websiteLine}</span></div>
    </div>
    <div class="score-panel">
      <div class="score-num tnum">${d.score}<sub>/100</sub></div>
      <div class="score-tier">
        <div class="tier-badge">${esc(d.tier)}</div>
        <p>${esc(d.tierHeadline)}</p>
      </div>
    </div>
  </div>
</div>

<div class="wrap">

<section>
  <div class="eyebrow" style="color:var(--accent)">Where things stand</div>
  <h2>The short version</h2>
  <p class="lede">${esc(d.execSummary)}</p>

  <div class="bars">${bars(d.categories)}</div>
  <div class="band-key">
    <div><span class="swatch" style="background:var(--accent)"></span>Needs attention (0-39%)</div>
    <div><span class="swatch" style="background:var(--amber)"></span>In progress (40-69%)</div>
    <div><span class="swatch" style="background:var(--good)"></span>Strong (70%+)</div>
  </div>
  ${brightSpotBlock(d.brightSpot)}
</section>

<section>
  <div class="eyebrow" style="color:var(--accent)">Category Breakdown</div>
  <h2>What we saw, category by category</h2>
  ${d.categories.map(catBlock).join('')}
</section>

<section>
  <div class="eyebrow" style="color:var(--accent)">Sequenced Plan</div>
  <h2>What to fix, in order</h2>
  <p class="lede">Jumping straight to paid media tends to just pay to amplify the weakest link. This sequence exists so each step makes the next one more effective.</p>
  <div class="roadmap">${roadmapSteps(d.roadmap)}</div>
  <div class="note" style="margin-top:32px;">
    <h4>On the ${esc(d.budgetLabel)} budget</h4>
    <p>${esc(d.budgetNote)}</p>
  </div>
</section>

</div>

<div class="cta">
  <div class="wrap">
    <h2>Next step</h2>
    <p>A Growth Leak Audit walks through the early roadmap steps in detail with a plan built specifically around these numbers.</p>
  </div>
</div>

<footer>
  <div class="wrap">
    <div>${esc(d.businessName || d.name)} &middot; ${esc(d.email)}</div>
    <div>Growth Readiness Scorecard &middot; submitted ${esc(fmtDate(d.submittedAt))}</div>
  </div>
</footer>

</body>
</html>`;
}

// --- CLI ---
function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inPath = getArg('in');
  const outPath = getArg('out');
  if (!inPath || !outPath) {
    console.error('Usage: node build-report.mjs --in content.json --out report.html');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  fs.writeFileSync(outPath, renderReport(data));
  console.log(outPath);
}
