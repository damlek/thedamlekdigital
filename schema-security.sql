-- Run once in Supabase → SQL Editor.
--
-- Turns on Row Level Security for every table the site uses, with no policies.
-- That means the public "anon" key (and anyone holding it) can read or write
-- nothing at all. The website's API routes use the service-role key, which
-- bypasses RLS, so the site and admin dashboard keep working exactly as before.

ALTER TABLE submissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE roas_calculations     ENABLE ROW LEVEL SECURITY;

-- Check: every row below should show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('submissions','scorecard_submissions','blog_posts','portfolio_items','roas_calculations');
