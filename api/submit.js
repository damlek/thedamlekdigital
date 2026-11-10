const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const {
  clientIp, rateLimited, handleCors, cleanEmail, cleanText, escapeHtml, isBot,
} = require('./_lib/security');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const FORM_TYPES = ['contact', 'audit'];
const HIGH_BUDGETS = ['1000to3000', '3000to5000', 'over5000'];

// Only these fields are stored or emailed; anything else in the body is dropped.
const FIELDS = [
  ['name',           'Name',           200],
  ['email',          'Email',          254],
  ['phone',          'Phone',          50],
  ['business_name',  'Business Name',  200],
  ['website',        'Website',        300],
  ['what_you_sell',  'What You Sell',  2000],
  ['ideal_customer', 'Ideal Customer', 2000],
  ['challenge',      'Challenge',      5000],
  ['running_ads',    'Running Ads',    100],
  ['platforms',      'Platforms',      300],
  ['budget',         'Budget',         100],
  ['desired_result', 'Desired Result', 2000],
  ['open_to_help',   'Open To Help',   100],
  ['lead_fit_tag',   'Lead Fit Tag',   100],
  ['subject',        'Subject',        300],
  ['message',        'Message',        5000],
];

function buildEmailHtml(row) {
  const isAudit = row.form_type === 'audit';
  const senderName = escapeHtml(row.name || row.business_name || 'Unknown');

  const rows = FIELDS
    .filter(([key]) => row[key])
    .map(([key, label]) => `
      <tr>
        <td style="padding:10px 14px;background:#f8f7f5;font-weight:700;font-size:13px;color:#5d584e;white-space:nowrap;border-bottom:1px solid #e7e2dc;width:36%;">${label}</td>
        <td style="padding:10px 14px;font-size:14px;color:#15130F;border-bottom:1px solid #e7e2dc;">${escapeHtml(row[key]).replace(/\n/g, '<br>')}</td>
      </tr>
    `).join('');

  const highFitBadge = row.lead_fit_tag === 'high_fit_ascension_ready' ? `
    <div style="background:#FFF3EC;border:2px solid #E16638;border-radius:8px;padding:14px 18px;margin-top:20px;">
      <strong style="color:#E16638;font-size:15px;">&#9889; High-fit lead</strong>
      <p style="margin:4px 0 0;font-size:13px;color:#5d584e;">High budget + open to help. Prioritise follow-up.</p>
    </div>
  ` : '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#15130F;">
      <div style="background:#15130F;padding:28px 32px;border-radius:10px 10px 0 0;">
        <p style="color:#E16638;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">thedamlek digital</p>
        <h1 style="color:#fff;font-size:22px;margin:0 0 6px;">New ${isAudit ? 'Growth Leak Audit Application' : 'Contact Message'}</h1>
        <p style="color:#9a948a;font-size:13px;margin:0;">From: <strong style="color:#fff;">${senderName}</strong> &nbsp;·&nbsp; ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e7e2dc;border-top:none;">
        ${rows}
      </table>
      ${highFitBadge}
      <p style="font-size:12px;color:#9a948a;margin-top:20px;text-align:center;">
        View all submissions in your <a href="https://www.thedamlekdigital.com/admin" style="color:#E16638;">admin dashboard</a>
      </p>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  if (!data || typeof data !== 'object' || FORM_TYPES.indexOf(data.form_type) === -1) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  if (isBot(data)) return res.status(200).json({ success: true });

  if (rateLimited('submit:' + clientIp(req), 5, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again in a few minutes.' });
  }

  const email = cleanEmail(data.email);
  if (!email) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const row = { form_type: data.form_type };
  for (const [key, , max] of FIELDS) row[key] = cleanText(data[key], max);
  row.email = email;
  if (!row.name) row.name = row.business_name;

  // Recomputed here rather than trusted from the browser.
  row.lead_fit_tag = row.form_type === 'audit'
    ? (HIGH_BUDGETS.indexOf(row.budget) !== -1 && row.open_to_help === 'yes'
      ? 'high_fit_ascension_ready' : 'standard_audit_lead')
    : null;

  // Same address flooding the form → stop after a handful per hour.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', since);
  if (count >= 3) {
    return res.status(429).json({ error: 'We already have your message — we\'ll be in touch soon.' });
  }

  // 1 — Save to Supabase
  const { error: dbError } = await supabase.from('submissions').insert([row]);
  if (dbError) console.error('Supabase insert error:', dbError.message);

  // 2 — Send email notification
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const senderName = String(row.name || 'Someone').replace(/[\r\n]+/g, ' ').slice(0, 80);
    const subject = row.form_type === 'audit'
      ? `New Audit Application — ${senderName}`
      : `New Contact Message — ${senderName}`;

    await transporter.sendMail({
      from: `"thedamlek digital" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject,
      html: buildEmailHtml(row),
    });
  } catch (emailErr) {
    console.error('Email error:', emailErr.message, emailErr.code || '');
  }

  if (dbError) {
    return res.status(500).json({ error: 'Could not save your submission. Please try again.' });
  }

  return res.status(200).json({ success: true });
};
