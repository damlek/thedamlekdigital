const { createClient } = require('@supabase/supabase-js');
const { marked } = require('marked');

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Case Study Not Found | thedamlek digital</title>
<meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>body{font-family:'DM Sans',sans-serif;background:#F5F4F1;color:#15130F;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;}
a{color:#E16638;font-weight:700;text-decoration:none;}</style></head>
<body><div><h1>Case study not found</h1><p><a href="/portfolio">&larr; Back to Portfolio</a></p></div></body></html>`;
}

module.exports = async function handler(req, res) {
  const { slug } = req.query || {};
  if (!slug) {
    res.status(400).send('Missing slug');
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: item, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !item) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(404).send(notFoundPage());
    return;
  }

  const title = esc(item.title);
  const clientName = esc(item.client_name || '');
  const description = esc(item.summary || String(item.content || '').slice(0, 160));
  const cover = item.cover_image_url || '';
  const services = Array.isArray(item.services) ? item.services : [];
  const gallery = Array.isArray(item.gallery_urls) ? item.gallery_urls : [];
  const results = Array.isArray(item.results) ? item.results : [];
  const contentHtml = marked.parse(item.content || '');

  const resultsHtml = results.length ? `
    <div class="results-grid">
      ${results.map((r) => `
        <div class="result-card">
          <div class="result-value">${esc(r.value)}</div>
          <div class="result-label">${esc(r.label)}</div>
        </div>
      `).join('')}
    </div>` : '';

  const galleryHtml = gallery.length ? `
    <div class="gallery-grid">
      ${gallery.map((url) => `<img src="${esc(url)}" alt="${title}">`).join('')}
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MX5G8NK5');</script>
<!-- End Google Tag Manager -->
<title>${title}${clientName ? ` — ${clientName}` : ''} | thedamlek digital Portfolio</title>
<meta name="description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
${cover ? `<meta property="og:image" content="${esc(cover)}">` : ''}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --orange:#E16638; --soft-orange:#FF9972; --sage:#95AD7C;
    --black:#15130F; --white:#FFFFFF; --tint-orange:#FFF3EC; --tint-sage:#F3F6EF;
    --border:#E7E2DC; --serif:'Playfair Display', serif; --sans:'DM Sans', sans-serif;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:var(--sans);color:var(--black);background:var(--white);line-height:1.6;-webkit-font-smoothing:antialiased;}
  img{display:block;max-width:100%;}
  a{color:var(--orange);}
  .wrap{max-width:760px;margin:0 auto;padding:0 24px;}
  h1,h2,h3{font-family:var(--serif);font-weight:800;line-height:1.2;letter-spacing:-0.01em;}
  header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);}
  header .wrap{max-width:1120px;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;}
  .btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--sans);font-weight:700;font-size:14px;padding:11px 20px;border-radius:8px;border:2px solid var(--black);cursor:pointer;text-decoration:none;color:var(--black);}
  .btn:hover{background:var(--black);color:var(--white);}
  nav{display:flex;align-items:center;gap:20px;}
  nav a{font-size:14px;font-weight:600;color:#3f3b35;text-decoration:none;}
  nav a:hover{color:var(--orange);}
  main{padding:56px 0 88px;}
  .back-link{display:inline-block;margin-bottom:24px;font-size:14px;font-weight:700;color:#766f64;text-decoration:none;}
  .back-link:hover{color:var(--orange);}
  .post-meta{font-size:13px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;}
  h1.post-title{font-size:clamp(28px,4.5vw,44px);margin-bottom:20px;}
  .post-cover{width:100%;border-radius:16px;margin-bottom:32px;object-fit:cover;max-height:420px;}
  .post-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;}
  .post-tag{font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;background:var(--tint-orange);color:var(--orange);}
  .results-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:36px;}
  .result-card{background:var(--tint-sage);border-radius:12px;padding:20px 16px;text-align:center;}
  .result-value{font-family:var(--serif);font-weight:800;font-size:26px;color:var(--orange);}
  .result-label{font-size:12.5px;font-weight:700;color:#5d584e;margin-top:4px;}
  .post-content{font-size:17px;color:#3f3b35;}
  .post-content h2{font-size:26px;margin:36px 0 14px;}
  .post-content h3{font-size:20px;margin:28px 0 12px;}
  .post-content p{margin-bottom:18px;}
  .post-content ul,.post-content ol{margin:0 0 18px 24px;}
  .post-content li{margin-bottom:8px;}
  .post-content blockquote{border-left:3px solid var(--orange);padding-left:18px;margin:24px 0;color:#5d584e;font-style:italic;}
  .gallery-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:32px;}
  .gallery-grid img{border-radius:12px;}
  footer{background:var(--black);color:#cfcabf;padding:40px 0 24px;margin-top:40px;}
  footer .wrap{max-width:1120px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
  footer .copy{font-size:13px;color:#8c8578;}
  @media (max-width:600px){ header .wrap{padding:12px 16px;} nav{gap:12px;} .gallery-grid{grid-template-columns:1fr;} }
</style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MX5G8NK5"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

<header>
  <div class="wrap">
    <a href="/"><img src="/logo.png" alt="thedamlek digital" style="height:52px;width:auto;"></a>
    <nav>
      <a href="/blog">Blog</a>
      <a href="/portfolio">Portfolio</a>
      <a href="/" class="btn">Back to Site</a>
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
    <a href="/portfolio" class="back-link">&larr; Back to Portfolio</a>
    ${clientName ? `<div class="post-meta">${clientName}</div>` : ''}
    <h1 class="post-title">${title}</h1>
    ${cover ? `<img class="post-cover" src="${esc(cover)}" alt="${title}">` : ''}
    ${services.length ? `<div class="post-tags">${services.map((s) => `<span class="post-tag">${esc(s)}</span>`).join('')}</div>` : ''}
    ${resultsHtml}
    <div class="post-content">${contentHtml}</div>
    ${galleryHtml}
  </div>
</main>

<footer>
  <div class="wrap">
    <img src="/logo.png" alt="thedamlek digital" style="height:44px;width:auto;filter:brightness(0) invert(1);">
    <span class="copy">&copy; 2026 thedamlek digital. All rights reserved.</span>
  </div>
</footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
