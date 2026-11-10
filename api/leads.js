// Admin-only: every lead action for the dashboard lives here.
//   GET    /api/leads?type=submission|scorecard   list leads
//   DELETE /api/leads?type=submission|scorecard   delete one ({ id } in body)
//   POST   /api/leads                             save a team note ({ id, type, note })
const { isAdmin, handleCors } = require('./_lib/security');
const submissions = require('./_lib/routes/submissions');
const scorecardSubmissions = require('./_lib/routes/scorecard-submissions');
const notes = require('./_lib/routes/notes');

const LISTS = { submission: submissions, scorecard: scorecardSubmissions };

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Checked once here, before any routing. The individual handlers check again.
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') return notes(req, res);

  const type = (req.query || {}).type;
  if (!Object.prototype.hasOwnProperty.call(LISTS, type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  return LISTS[type](req, res);
};
