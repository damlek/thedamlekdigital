-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- Adds the table behind the ROAS Break-Even Calculator (tools/roas-calculator.html)
--
-- Anonymous by design: no name, no email, no IP address, no user agent.
-- One row = one visitor session's first completed calculation.

CREATE TABLE roas_calculations (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_type    TEXT        NOT NULL,
  cac              NUMERIC     NOT NULL,
  aov              NUMERIC     NOT NULL,
  margin           NUMERIC     NOT NULL,
  purchases        NUMERIC     NOT NULL DEFAULT 1,
  break_even_roas  NUMERIC     NOT NULL,
  current_roas     NUMERIC     NOT NULL,
  max_cac          NUMERIC     NOT NULL,
  break_even_aov   NUMERIC     NOT NULL,
  is_profitable    BOOLEAN     NOT NULL,
  utm_source       TEXT,
  referrer         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roas_created_at    ON roas_calculations (created_at DESC);
CREATE INDEX idx_roas_business_type ON roas_calculations (business_type);
