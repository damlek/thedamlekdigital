const { createClient } = require('@supabase/supabase-js');

const SITE = 'https://thedamlekdigital.com';

const STATIC_PATHS = [
  { path: '/', priority: '1.0' },
  { path: '/scorecard', priority: '0.8' },
  { path: '/growth-leak-audit', priority: '0.8' },
  { path: '/tools/roas-calculator', priority: '0.8' },
  { path: '/blog', priority: '0.7' },
  { path: '/portfolio', priority: '0.7' },
];

function urlTag(loc, lastmod, priority) {
  return `  <url>
    <loc>${loc}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <priority>${priority}</priority>
  </url>`;
}

module.exports = async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const [{ data: posts }, { data: items }] = await Promise.all([
    supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
    supabase.from('portfolio_items').select('slug, updated_at').eq('status', 'published'),
  ]);

  const urls = [
    ...STATIC_PATHS.map(({ path, priority }) => urlTag(`${SITE}${path}`, null, priority)),
    ...(posts || []).map((p) =>
      urlTag(`${SITE}/blog/${p.slug}`, p.updated_at ? p.updated_at.slice(0, 10) : null, '0.6')
    ),
    ...(items || []).map((p) =>
      urlTag(`${SITE}/portfolio/${p.slug}`, p.updated_at ? p.updated_at.slice(0, 10) : null, '0.6')
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
};
