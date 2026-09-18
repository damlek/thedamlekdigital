const { createClient } = require('@supabase/supabase-js');

const BUSINESS_TYPES = ['ecommerce', 'local', 'services', 'coaching', 'other'];

// Bounds keep obvious junk and spam out of the benchmark data. Real-but-odd
// values still get through — filter those at query time, not on write.
function num(value, min, max) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!isFinite(n) || n < min || n > max) return null;
  return n;
}

function text(value, maxLength) {
  return typeof value === 'string' && value ? value.slice(0, maxLength) : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};

  const businessType = BUSINESS_TYPES.indexOf(body.business_type) !== -1 ? body.business_type : null;
  const cac       = num(body.cac, 0.01, 1000000);
  const aov       = num(body.aov, 0.01, 1000000);
  const margin    = num(body.margin, 0.01, 100);
  const purchases = num(body.purchases === undefined ? 1 : body.purchases, 1, 1000);

  if (!businessType || cac === null || aov === null || margin === null || purchases === null) {
    return res.status(400).json({ error: 'Invalid calculation' });
  }

  // Derived values are computed here rather than trusted from the client, so
  // every stored row stays internally consistent with its own inputs.
  const marginDecimal = margin / 100;
  const effectiveAOV  = aov * purchases;
  const breakEvenROAS = 1 / marginDecimal;
  const currentROAS   = effectiveAOV / cac;
  const maxCAC        = effectiveAOV * marginDecimal;
  const breakEvenAOV  = cac / (marginDecimal * purchases);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase.from('roas_calculations').insert([{
    business_type:   businessType,
    cac:             cac,
    aov:             aov,
    margin:          margin,
    purchases:       purchases,
    break_even_roas: breakEvenROAS,
    current_roas:    currentROAS,
    max_cac:         maxCAC,
    break_even_aov:  breakEvenAOV,
    is_profitable:   currentROAS >= breakEvenROAS,
    utm_source:      text(body.utm_source, 100),
    referrer:        text(body.referrer, 255),
  }]);

  if (error) {
    console.error('ROAS calculation insert error:', error.message);
    return res.status(500).json({ error: 'Could not save calculation' });
  }

  return res.status(200).json({ success: true });
};
