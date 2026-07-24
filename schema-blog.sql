-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- Adds the table for blog posts (/blog and /blog/:slug)

CREATE TABLE blog_posts (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT        UNIQUE NOT NULL,
  title           TEXT        NOT NULL,
  excerpt         TEXT,
  content         TEXT,                          -- markdown
  cover_image_url TEXT,
  tags            TEXT[],
  status          TEXT        DEFAULT 'draft',    -- 'draft' or 'published'
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: index for faster listing of published posts by recency
CREATE INDEX idx_blog_status ON blog_posts (status, published_at DESC);
