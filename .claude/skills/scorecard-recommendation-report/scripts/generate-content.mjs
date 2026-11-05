// Turns a resolved scorecard submission (see fetch-submission.mjs output) into
// the fully-written content for the recommendation report: an executive
// summary, per-category evidence + recommended fixes, a "bright spot"
// callout, and a sequenced roadmap. All copy is generated mechanically from
// the data so the same submission always produces the same report.
//
// Usage: node generate-content.mjs --in submission.json [--out content.json]

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { band, CATEGORY_PRIORITY, CATEGORY_WHY } from './question-bank.mjs';

const SOCIAL_HOSTS = ['instagram.com', 'facebook.com', 'tiktok.com', 'linktr.ee', 'wa.me', 'twitter.com', 'x.com'];

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function looksLikeSocialLinkNotASite(website) {
  if (!website) return true;
  return SOCIAL_HOSTS.some(h => website.toLowerCase().includes(h));
}

export function buildContent(sub) {
  const categories = sub.categoryScores.map(c => {
    const qs = sub.answers.filter(a => a.category === c.name);
    return {
      name: c.name,
      pct: c.pct,
      band: band(c.pct),
      evidence: qs.map(q => q.label).filter(Boolean),
      fixes: qs
        .filter(q => q.points < 3)
        .map(q => {
          const bank = QUESTIONS_BY_TEXT[q.question];
          return bank ? bank.fix : null;
        })
        .filter(Boolean),
    };
  });

  const sorted = [...categories].sort((a, b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakestPct = sorted[sorted.length - 1].pct;
  const weakest = categories.filter(c => c.pct === weakestPct);

  // Bright spot: the single highest-scoring individual answer across the
  // whole survey (a perfect 3/3), used to call out a real strength even
  // when every category average is still low.
  let brightSpot = null;
  const perfectAnswers = sub.answers.filter(a => a.points === 3 && a.label);
  if (perfectAnswers.length > 0) {
    const a = perfectAnswers[0];
    brightSpot = {
      question: a.question,
      label: a.label,
      category: a.category,
    };
  }

  const noRealSite = looksLikeSocialLinkNotASite(sub.website);

  // Only claim the missing site "compounds" a gap in categories that are
  // actually weak for this prospect — don't hardcode Message Clarity and
  // Funnel Readiness as if every no-website business is weak in both.
  const siteDependentGaps = ['Message Clarity', 'Funnel Readiness']
    .map(name => categories.find(c => c.name === name))
    .filter(c => c && c.pct < 70);

  const noSiteSentence = noRealSite
    ? siteDependentGaps.length > 0
      ? `There's currently no dedicated website or landing page — just a social profile — which compounds the gap${siteDependentGaps.length > 1 ? 's' : ''} in ${joinList(siteDependentGaps.map(c => c.name.toLowerCase()))} below.`
      : `There's currently no dedicated website or landing page — just a social profile — worth fixing before sending any paid traffic somewhere.`
    : null;

  const execSummary = [
    `${sub.businessName || 'This business'} scored ${sub.score}/100 — ${sub.tier} tier. ${sub.tierDesc}`,
    weakest.length > 1
      ? `The steepest gaps are in ${joinList(weakest.map(c => c.name))} (all ${weakestPct}%), while ${strongest.name} is the clearest strength at ${strongest.pct}%.`
      : `The steepest gap is ${weakest[0].name} at ${weakestPct}%, while ${strongest.name} is the clearest strength at ${strongest.pct}%.`,
    noSiteSentence,
  ].filter(Boolean).join(' ');

  // Sequenced roadmap: fixed priority order, skip categories already strong
  // (70%+), and always gate paid media behind everything else.
  const roadmap = CATEGORY_PRIORITY
    .map(name => categories.find(c => c.name === name))
    .filter(c => c && c.pct < 70)
    .map((c, i) => ({
      step: i + 1,
      title: c.name,
      pct: c.pct,
      action: c.fixes[0] || `Strengthen ${c.name.toLowerCase()} before moving on.`,
      why: CATEGORY_WHY[c.name],
    }));

  const budgetNote = `None of the early roadmap steps require ad spend — they're offer, page, and process work. ` +
    `That makes the ${sub.budgetLabel} budget go further: money saved by not running ads against a weak funnel is exactly ` +
    `what funds a real paid test once the roadmap reaches Paid Media Readiness.`;

  return {
    ...sub,
    categories,
    strongest,
    weakest,
    brightSpot,
    noRealSite,
    execSummary,
    roadmap,
    budgetNote,
  };
}

// Build a question-text -> {fix} lookup once, from the same bank used by
// fetch-submission.mjs, without re-importing QUESTIONS twice.
import { QUESTIONS } from './question-bank.mjs';
const QUESTIONS_BY_TEXT = Object.fromEntries(QUESTIONS.map(q => [q.q, q]));

function joinList(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// --- CLI ---
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inPath = getArg('in');
  const outPath = getArg('out');
  const raw = inPath ? fs.readFileSync(inPath, 'utf8') : fs.readFileSync(0, 'utf8');
  const sub = JSON.parse(raw);
  const content = buildContent(sub);
  const json = JSON.stringify(content, null, 2);
  if (outPath) {
    fs.writeFileSync(outPath, json);
  } else {
    console.log(json);
  }
}
