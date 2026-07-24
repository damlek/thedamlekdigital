const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { slug } = req.query || {};
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  const isAdmin = !!token && token === process.env.ADMIN_PASSWORD;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let query = supabase.from('portfolio_items').select('*').eq('slug', slug);
  if (!isAdmin) query = query.eq('status', 'published');

  const { data, error } = await query.single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json(data);
};
