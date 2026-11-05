const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Maps a tier name to the MailerLite group ID env var that should receive the subscriber.
const TIER_GROUP_ENV = {
  'Foundation Gap':            'MAILERLITE_GROUP_FOUNDATION',
  'Growth System Gap':         'MAILERLITE_GROUP_GROWTH',
  'Scale Ready':                'MAILERLITE_GROUP_SCALE',
  'Performance Optimization':  'MAILERLITE_GROUP_PERFORMANCE',
};

async function pushToMailerLite(data) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.warn('MAILERLITE_API_KEY not set — skipping MailerLite sync');
    return;
  }

  const groupEnvName = TIER_GROUP_ENV[data.tier];
  const groupId = groupEnvName ? process.env[groupEnvName] : null;

  const weakest = (data.category_scores || [])
    .slice()
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2)
    .map(c => c.name)
    .join(', ');

  const body = {
    email: data.email,
    fields: {
      name: data.name || '',
      company: data.business_name || '',
      website: data.website || '',
      budget: data.budget || '',
      score: data.score,
      tier: data.tier,
      weakest_areas: weakest,
    },
  };

  if (groupId) body.groups = [groupId];

  const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('MailerLite error:', res.status, errText);
  }
}

const QUALIFIER_KEYS = ['current_situation', 'goal_90_days', 'main_obstacle', 'help_preference', 'anything_else'];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Keep only known qualifier keys, with bounded string lengths.
function cleanQualifiers(q) {
  if (!q || typeof q !== 'object') return null;
  const out = {};
  for (const key of QUALIFIER_KEYS) {
    const item = q[key];
    if (!item || typeof item !== 'object') continue;
    const max = key === 'anything_else' ? 1000 : 200;
    out[key] = {
      question: String(item.question || '').slice(0, 200),
      value:    String(item.value    || '').slice(0, max),
      label:    String(item.label    || '').slice(0, max),
    };
  }
  return Object.keys(out).length ? out : null;
}

// Hot lead = wants hands-on help, has $3k+/month, and isn't already at the top tier.
function isHotLead(data) {
  const help = data.qualifiers && data.qualifiers.help_preference && data.qualifiers.help_preference.value;
  const wantsHelp = help === 'dfy' || help === 'dwy';
  const bigBudget = data.budget === '3kto10k' || data.budget === 'over10k';
  return wantsHelp && bigBudget && data.score < 85;
}

function buildEmailHtml(data) {
  const weakest = (data.category_scores || [])
    .slice()
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2)
    .map(c => `${c.name} (${c.pct}%)`)
    .join(', ');

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Business Name', data.business_name],
    ['Website', data.website],
    ['Budget', data.budget],
    ['Score', `${data.score} / 100`],
    ['Tier', data.tier],
    ['Weakest Areas', weakest],
    ...QUALIFIER_KEYS.map(k => {
      const item = data.qualifiers && data.qualifiers[k];
      return [item ? item.question : k, item ? item.label : ''];
    }),
  ].filter(([, v]) => v)
   .map(([k, v]) => `
      <tr>
        <td style="padding:10px 14px;background:#f8f7f5;font-weight:700;font-size:13px;color:#5d584e;white-space:nowrap;border-bottom:1px solid #e7e2dc;width:36%;">${esc(k)}</td>
        <td style="padding:10px 14px;font-size:14px;color:#15130F;border-bottom:1px solid #e7e2dc;">${esc(v)}</td>
      </tr>
    `).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#15130F;">
      <div style="background:#15130F;padding:28px 32px;border-radius:10px 10px 0 0;">
        <p style="color:#E16638;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">thedamlek digital</p>
        <h1 style="color:#fff;font-size:22px;margin:0 0 6px;">New Growth Readiness Scorecard Submission</h1>
        <p style="color:#9a948a;font-size:13px;margin:0;">From: <strong style="color:#fff;">${esc(data.name || data.business_name || 'Unknown')}</strong> &nbsp;·&nbsp; ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e7e2dc;border-top:none;">
        ${rows}
      </table>
      <p style="font-size:12px;color:#9a948a;margin-top:20px;text-align:center;">
        View all submissions in your <a href="https://supabase.com/dashboard" style="color:#E16638;">Supabase dashboard</a>
      </p>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  if (!data || !data.email || typeof data.score !== 'number') {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  data.qualifiers = cleanQualifiers(data.qualifiers);

  // 1 — Save to Supabase
  const row = {
    name:             data.name           || null,
    email:            data.email,
    business_name:    data.business_name  || null,
    website:          data.website        || null,
    budget:           data.budget         || null,
    score:            data.score,
    tier:             data.tier           || null,
    category_scores:  data.category_scores || null,
    answers:          data.answers        || null,
    qualifiers:       data.qualifiers,
  };
  let { error: dbError } = await supabase.from('scorecard_submissions').insert([row]);

  // If the qualifiers column hasn't been added yet (see schema-scorecard.sql),
  // save everything else rather than losing the lead.
  if (dbError && /qualifiers/i.test(dbError.message || '')) {
    console.warn('qualifiers column missing — run the migration in schema-scorecard.sql');
    delete row.qualifiers;
    ({ error: dbError } = await supabase.from('scorecard_submissions').insert([row]));
  }

  if (dbError) console.error('Supabase insert error:', dbError.message);

  // 2 — Push to MailerLite (tag + group by tier, triggers their automation)
  try {
    await pushToMailerLite(data);
  } catch (mlErr) {
    console.error('MailerLite error:', mlErr.message);
  }

  // 3 — Internal notification email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"thedamlek digital" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `${isHotLead(data) ? '🔥 HOT LEAD — ' : ''}New Scorecard Submission — ${data.name || data.business_name || 'Someone'} (${data.score}/100)`,
      html: buildEmailHtml(data),
    });
  } catch (emailErr) {
    console.error('Email error:', emailErr.message, emailErr.code || '');
  }

  if (dbError) {
    return res.status(500).json({ error: 'Could not save your submission. Please try again.' });
  }

  return res.status(200).json({ success: true });
};
