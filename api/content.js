// Blog posts and portfolio items. Public visitors can read published items;
// creating, editing and deleting need an admin session (checked in each handler).
//   /api/content?type=blog   |   /api/content?type=portfolio
const blog = require('./_lib/routes/blog');
const portfolio = require('./_lib/routes/portfolio');

const TYPES = { blog, portfolio };

module.exports = async function handler(req, res) {
  const type = (req.query || {}).type;
  if (!Object.prototype.hasOwnProperty.call(TYPES, type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  return TYPES[type](req, res);
};
