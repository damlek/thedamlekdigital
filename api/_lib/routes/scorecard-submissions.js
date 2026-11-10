const { createClient } = require('@supabase/supabase-js');
const { isAdmin, handleCors } = require('../security');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('scorecard_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error(error.message); return res.status(500).json({ error: 'Database error' }); }

    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { error } = await supabase.from('scorecard_submissions').delete().eq('id', id);
    if (error) { console.error(error.message); return res.status(500).json({ error: 'Database error' }); }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
