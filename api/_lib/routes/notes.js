const { createClient } = require('@supabase/supabase-js');
const { isAdmin, handleCors } = require('../security');

const TABLES = {
  scorecard:   'scorecard_submissions',
  submission:  'submissions',
};

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, type } = req.body || {};
  const note = typeof (req.body || {}).note === 'string' ? req.body.note.slice(0, 10000) : null;
  const table = TABLES[type];
  if (!id || !table) return res.status(400).json({ error: 'Missing id or invalid type' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase
    .from(table)
    .update({ notes: note || null })
    .eq('id', id);

  if (error) { console.error(error.message); return res.status(500).json({ error: 'Database error' }); }

  return res.status(200).json({ success: true });
};
