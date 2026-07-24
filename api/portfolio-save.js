const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    id, slug, client_name, title, summary, content, cover_image_url,
    gallery_urls, services, results, status, featured, sort_order,
  } = req.body || {};

  if (!slug || !title) return res.status(400).json({ error: 'Missing slug or title' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const fields = {
    slug,
    client_name: client_name || null,
    title,
    summary: summary || null,
    content: content || null,
    cover_image_url: cover_image_url || null,
    gallery_urls: gallery_urls || null,
    services: services || null,
    results: results || null,
    status: status || 'draft',
    featured: !!featured,
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from('portfolio_items').update(fields).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, id });
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert([fields])
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, id: data.id });
};
