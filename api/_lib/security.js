// Shared security helpers for the API routes.
// Files under api/_lib are not deployed as their own endpoints (Vercel skips
// paths that start with an underscore); routes pull them in with require().
const crypto = require('crypto');

// ── Admin sessions ──────────────────────────────────────────────────────────
// The admin password is exchanged once (api/login) for a signed token that
// expires. The password itself never sits in the browser, and changing
// ADMIN_PASSWORD in Vercel instantly signs everyone out.
const SESSION_HOURS = 12;

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload) {
  return b64url(crypto.createHmac('sha256', 'tdm-admin-session:' + (process.env.ADMIN_PASSWORD || '')).update(payload).digest());
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function passwordMatches(candidate) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof candidate !== 'string' || !candidate) return false;
  return safeEqual(candidate, real);
}

function createSession() {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = b64url(JSON.stringify({ exp }));
  return { token: payload + '.' + sign(payload), expires_at: exp };
}

function isAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return false;
  const [payload, sig] = auth.slice(7).trim().split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch (e) {
    return false;
  }
}

// ── Request helpers ─────────────────────────────────────────────────────────
// Cloudflare's cf-connecting-ip header holds the real visitor IP, but anyone
// who sends a request straight to Vercel (skipping Cloudflare) can fake it.
// So it is only trusted when the request also carries the secret header that
// a Cloudflare Transform Rule adds (x-tdm-edge = CF_EDGE_SECRET). Otherwise
// Vercel's own x-real-ip is used, which Vercel sets itself and cannot be faked.
function fromCloudflare(h) {
  const secret = process.env.CF_EDGE_SECRET;
  if (!secret) return !!h['cf-connecting-ip']; // not configured yet: previous behaviour
  return typeof h['x-tdm-edge'] === 'string' && safeEqual(h['x-tdm-edge'], secret);
}

function clientIp(req) {
  const h = req.headers || {};
  const vercelIp = h['x-real-ip'] || String(h['x-forwarded-for'] || '').split(',')[0];
  const ip = fromCloudflare(h) && h['cf-connecting-ip'] ? h['cf-connecting-ip'] : vercelIp;
  return String(ip || 'unknown').trim();
}

// Best-effort limiter. Each serverless instance keeps its own counts, so this
// slows down a single noisy client rather than guaranteeing a hard cap — the
// Cloudflare rate-limit rule in front of the site is the real backstop.
const buckets = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
  }
  return hits.length > max;
}

// Our own pages call the API from the same origin, so cross-origin browser
// access is only opened up for the public read-only content endpoints.
function handleCors(req, res, { publicRead = false } = {}) {
  if (publicRead) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// ── Input cleaning ──────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@<>"'()\\,;:]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function cleanEmail(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v.length <= 254 && EMAIL_RE.test(v) ? v : null;
}

function cleanText(value, max) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  return v ? v.slice(0, max) : null;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Hidden form field real visitors never see or fill in. Bots that fill every
// input get a normal-looking success response and nothing is saved.
function isBot(body) {
  return !!(body && typeof body.tdm_hp_check === 'string' && body.tdm_hp_check.trim());
}

module.exports = {
  passwordMatches, createSession, isAdmin,
  clientIp, rateLimited, handleCors,
  cleanEmail, cleanText, escapeHtml, isBot,
};
