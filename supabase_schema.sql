-- POD Automation: Supabase Schema
-- Run this in your Supabase SQL Editor
-- Project: ihjymibrnjyafrnjolue.supabase.co

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TRENDS: All discovered niches from SerpAPI
-- ============================================================
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  event_name TEXT,
  type TEXT CHECK (type IN ('seasonal', 'evergreen')) DEFAULT 'evergreen',
  locale TEXT DEFAULT 'US',
  interest_score_7d INT CHECK (interest_score_7d BETWEEN 0 AND 100),
  interest_score_3m INT CHECK (interest_score_3m BETWEEN 0 AND 100),
  interest_score_1yr INT CHECK (interest_score_1yr BETWEEN 0 AND 100),
  rising_queries TEXT,
  applicable_brands TEXT[],
  llm_score INT CHECK (llm_score BETWEEN 0 AND 10),
  llm_reasoning TEXT,
  llm_approved BOOLEAN,
  human_approved BOOLEAN,
  run_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PREFERENCE_SIGNALS: Adaptive learning from your decisions
-- Every approve/reject is logged and fed back to the LLM
-- ============================================================
CREATE TABLE IF NOT EXISTS preference_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  niche_keyword TEXT NOT NULL,
  signal_type TEXT CHECK (signal_type IN (
    'niche_approved', 'niche_rejected',
    'slogan_approved', 'slogan_rejected', 'slogan_more_ideas',
    'prompt_approved', 'prompt_rejected',
    'graphic_approved', 'graphic_rejected'
  )) NOT NULL,
  content TEXT,
  reason TEXT,
  event_name TEXT,
  run_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRAND_NICHE_HISTORY: Avoids re-generating for same brand+niche
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_niche_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  niche_keyword TEXT NOT NULL,
  event_name TEXT,
  tried_at TIMESTAMPTZ DEFAULT NOW(),
  outcome TEXT CHECK (outcome IN ('approved', 'rejected', 'skipped', 'pending'))
);

-- ============================================================
-- SLOGANS: All generated slogan ideas with approval state
-- ============================================================
CREATE TABLE IF NOT EXISTS slogans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  keyword TEXT NOT NULL,
  event_name TEXT,
  slogan TEXT NOT NULL,
  iteration INT DEFAULT 1,
  status TEXT CHECK (status IN (
    'Awaiting Approval', 'LGTM', 'Rejected', 'More Ideas'
  )) DEFAULT 'Awaiting Approval',
  model TEXT DEFAULT 'llama3.2:3b',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trends_run_date    ON trends(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_trends_approved     ON trends(human_approved);
CREATE INDEX IF NOT EXISTS idx_pref_brand          ON preference_signals(brand);
CREATE INDEX IF NOT EXISTS idx_pref_keyword        ON preference_signals(niche_keyword);
CREATE INDEX IF NOT EXISTS idx_pref_created        ON preference_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slogans_status      ON slogans(status);
CREATE INDEX IF NOT EXISTS idx_slogans_brand       ON slogans(brand);

-- ============================================================
-- VIEW: Approved niches ready for slogan generation
-- ============================================================
CREATE OR REPLACE VIEW v_approved_niches AS
SELECT
  t.keyword,
  t.event_name,
  t.applicable_brands,
  t.interest_score_7d,
  t.interest_score_3m,
  t.interest_score_1yr,
  t.llm_score,
  t.run_date
FROM trends t
WHERE t.human_approved = true
ORDER BY t.run_date DESC, t.llm_score DESC;

-- ============================================================
-- VIEW: Recent preference signals for LLM context
-- Returns last 20 rows, handles gracefully if fewer exist
-- ============================================================
CREATE OR REPLACE VIEW v_recent_preferences AS
SELECT brand, niche_keyword, signal_type, content, created_at
FROM preference_signals
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- FUNCTION: Record preference signal + update history
-- Called by n8n after each human decision
-- ============================================================
CREATE OR REPLACE FUNCTION record_preference(
  p_brand TEXT,
  p_keyword TEXT,
  p_signal_type TEXT,
  p_content TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_event_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  outcome_map TEXT;
BEGIN
  INSERT INTO preference_signals(brand, niche_keyword, signal_type, content, reason, event_name)
  VALUES (p_brand, p_keyword, p_signal_type, p_content, p_reason, p_event_name)
  RETURNING id INTO new_id;

  -- Map signal to outcome for history
  outcome_map := CASE
    WHEN p_signal_type LIKE '%approved' THEN 'approved'
    WHEN p_signal_type LIKE '%rejected' THEN 'rejected'
    ELSE 'pending'
  END;

  INSERT INTO brand_niche_history(brand, niche_keyword, event_name, outcome)
  VALUES (p_brand, p_keyword, p_event_name, outcome_map)
  ON CONFLICT DO NOTHING;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
