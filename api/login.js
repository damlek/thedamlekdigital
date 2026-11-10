const { passwordMatches, createSession, clientIp, rateLimited, handleCors } = require('./_lib/security');

// Exchanges the team password for a session token that expires after 12 hours.
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = clientIp(req);
  if (rateLimited('login:' + ip, 5, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  }

  const { password } = req.body || {};
  if (!passwordMatches(password)) {
    // Small delay makes guessing slower without bothering a real person.
    await new Promise((r) => setTimeout(r, 600));
    console.warn('Failed admin login from', ip);
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(createSession());
};
