// Public, read-only: server-renders a published blog post or case study page.
// Reached through the /blog/:slug and /portfolio/:slug rewrites in vercel.json.
const blogRender = require('./_lib/routes/blog-render');
const portfolioRender = require('./_lib/routes/portfolio-render');

const TYPES = { blog: blogRender, portfolio: portfolioRender };

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).send('Method not allowed');
  const type = (req.query || {}).type;
  if (!Object.prototype.hasOwnProperty.call(TYPES, type)) return res.status(404).send('Not found');
  return TYPES[type](req, res);
};
