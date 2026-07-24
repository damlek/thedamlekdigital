-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- Adds the table for portfolio/case study items (/portfolio and /portfolio/:slug)

CREATE TABLE portfolio_items (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT        UNIQUE NOT NULL,
  client_name     TEXT,
  title           TEXT        NOT NULL,
  summary         TEXT,
  content         TEXT,                          -- markdown case study body
  cover_image_url TEXT,
  gallery_urls    TEXT[],
  services        TEXT[],                         -- e.g. 'Paid Ads', 'SEO'
  results         JSONB,                           -- [{ "label": "Revenue", "value": "+42%" }]
  status          TEXT        DEFAULT 'draft',    -- 'draft' or 'published'
  featured        BOOLEAN     DEFAULT false,
  sort_order      INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: index for faster listing of published items in display order
CREATE INDEX idx_portfolio_status ON portfolio_items (status, sort_order);
