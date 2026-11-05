// Looks up a Growth Readiness Scorecard submission by email and resolves each
// raw answer (a point value 0-3) back to the option label the prospect saw,
// using the question bank. Prints one JSON object to stdout.
//
// Usage: node fetch-submission.mjs --email someone@example.com

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { QUESTIONS, getTier, BUDGET_LABELS } from './question-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');

try {
  process.loadEnvFile(path.join(projectRoot, '.env.local'));
} catch {
  // .env.local not present — fall back to whatever is already in process.env
}

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const email = getArg('email');
if (!email) {
  console.error('Usage: node fetch-submission.mjs --email someone@example.com');
  process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error(
    'Missing SUPABASE_URL / SUPABASE_SERVICE_KEY.\n' +
    'Add them to .env.local at the project root (see .env.local.example) — ' +
    'these are the same values already set in the Vercel project.'
  );
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data, error } = await supabase
  .from('scorecard_submissions')
  .select('*')
  .ilike('email', email.trim())
  .order('created_at', { ascending: false });

if (error) {
  console.error('Supabase query failed:', error.message);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.error(`No scorecard submission found for "${email}".`);
  process.exit(1);
}

// Most recent submission for this email.
const sub = data[0];

function resolveLabel(category, question, points) {
  const match = QUESTIONS.find(q => q.cat === category && q.q === question);
  if (!match) return null;
  const opt = match.opts.find(o => o.p === points);
  return opt ? opt.l : null;
}

const answers = (sub.answers || []).map(a => ({
  category: a.category,
  question: a.question,
  points: a.points,
  maxPoints: 3,
  label: resolveLabel(a.category, a.question, a.points),
}));

const tier = getTier(sub.score);

const result = {
  name: (sub.name || '').trim(),
  email: sub.email,
  businessName: (sub.business_name || '').trim(),
  website: sub.website || null,
  budget: sub.budget,
  budgetLabel: BUDGET_LABELS[sub.budget] || sub.budget,
  score: sub.score,
  tier: sub.tier || tier.name,
  tierHeadline: tier.headline,
  tierDesc: tier.desc,
  categoryScores: sub.category_scores,
  answers,
  submittedAt: sub.created_at,
  otherSubmissionsCount: data.length - 1,
};

console.log(JSON.stringify(result, null, 2));
