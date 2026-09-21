const { createClient } = require('@supabase/supabase-js');

const BUSINESS_TYPES = ['ecommerce', 'local', 'services', 'coaching', 'other'];
const CURRENCIES = ['USD', 'NGN'];

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

async function handlePost(req, res, supabase) {
  const body = req.body || {};

  const businessType = BUSINESS_TYPES.indexOf(body.business_type) !== -1 ? body.business_type : null;
  const cac       = num(body.cac, 0.01, 1000000);
  const aov       = num(body.aov, 0.01, 1000000);
  const margin    = num(body.margin, 0.01, 100);
  const purchases = num(body.purchases === undefined ? 1 : body.purchases, 1, 1000);
  // Currency is a unit label, not a conversion — it tells us which unit the
  // stored figures are in so benchmarks never average naira against dollars.
  const currency = CURRENCIES.indexOf(body.currency) !== -1 ? body.currency : 'USD';

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

  const { error } = await supabase.from('roas_calculations').insert([{
    business_type:   businessType,
    currency:        currency,
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
}

async function handleGet(req, res, supabase) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');

  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('roas_calculations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json(data);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  if (req.method === 'POST') return handlePost(req, res, supabase);
  if (req.method === 'GET') return handleGet(req, res, supabase);

  return res.status(405).json({ error: 'Method not allowed' });
};
