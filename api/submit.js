const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function formatFieldName(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function buildEmailHtml(data) {
  const isAudit = data.form_type === 'audit';
  const senderName = data.name || data.business_name || 'Unknown';

  const skipFields = ['form_type'];
  const rows = Object.entries(data)
    .filter(([k, v]) => !skipFields.includes(k) && v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:10px 14px;background:#f8f7f5;font-weight:700;font-size:13px;color:#5d584e;white-space:nowrap;border-bottom:1px solid #e7e2dc;width:36%;">${formatFieldName(k)}</td>
        <td style="padding:10px 14px;font-size:14px;color:#15130F;border-bottom:1px solid #e7e2dc;">${String(v).replace(/\n/g, '<br>')}</td>
      </tr>
    `).join('');

  const highFitBadge = data.lead_fit_tag === 'high_fit_ascension_ready' ? `
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
  if (!data || !data.form_type) return res.status(400).json({ error: 'Invalid submission' });

  // 1 — Save to Supabase
  const { error: dbError } = await supabase.from('submissions').insert([{
    form_type:      data.form_type,
    name:           data.name           || data.business_name || null,
    email:          data.email          || null,
    business_name:  data.business_name  || null,
    website:        data.website        || null,
    what_you_sell:  data.what_you_sell  || null,
    ideal_customer: data.ideal_customer || null,
    challenge:      data.challenge      || null,
    running_ads:    data.running_ads    || null,
    platforms:      data.platforms      || null,
    budget:         data.budget         || null,
    desired_result: data.desired_result || null,
    open_to_help:   data.open_to_help   || null,
    lead_fit_tag:   data.lead_fit_tag   || null,
    subject:        data.subject        || null,
    message:        data.message        || null,
  }]);

  if (dbError) console.error('Supabase insert error:', dbError.message);

  // 2 — Send email notification
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const senderName = data.name || data.business_name || 'Someone';
    const subject = data.form_type === 'audit'
      ? `New Audit Application — ${senderName}`
      : `New Contact Message — ${senderName}`;

    await transporter.sendMail({
      from: `"thedamlek digital" <${process.env.GMAIL_USER}>`,
      to: 'thedamlekdigital@gmail.com',
      subject,
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
