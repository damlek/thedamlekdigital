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

  const { id, slug, title, excerpt, content, cover_image_url, tags, status } = req.body || {};
  if (!slug || !title) return res.status(400).json({ error: 'Missing slug or title' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const fields = {
    slug,
    title,
    excerpt: excerpt || null,
    content: content || null,
    cover_image_url: cover_image_url || null,
    tags: tags || null,
    status: status || 'draft',
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // Preserve the original published_at on re-saves; only stamp it the first time a post goes live.
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('published_at')
      .eq('id', id)
      .single();

    fields.published_at = fields.status === 'published'
      ? (existing && existing.published_at) || new Date().toISOString()
      : null;

    const { error } = await supabase.from('blog_posts').update(fields).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, id });
  }

  fields.published_at = fields.status === 'published' ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('blog_posts')
    .insert([fields])
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, id: data.id });
};
