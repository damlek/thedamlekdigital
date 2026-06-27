-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)

CREATE TABLE submissions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type      TEXT        NOT NULL,           -- 'contact' or 'audit'
  name           TEXT,
  email          TEXT,
  business_name  TEXT,
  website        TEXT,
  what_you_sell  TEXT,
  ideal_customer TEXT,
  challenge      TEXT,
  running_ads    TEXT,
  platforms      TEXT,
  budget         TEXT,
  desired_result TEXT,
  open_to_help   TEXT,
  lead_fit_tag   TEXT,
  subject        TEXT,
  message        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: index for faster filtering by form type and date
CREATE INDEX idx_submissions_form_type  ON submissions (form_type);
CREATE INDEX idx_submissions_created_at ON submissions (created_at DESC);
