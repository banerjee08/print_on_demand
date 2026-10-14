-- =============================================================================
-- Migration: 005_production_backend_git_errors_ai_learning_waf.sql
-- Brand: LouLou & Luxe (https://loulouandluxe.com | https://loulou-dev.sbanerjee.cloud)
-- Purpose:
--   1. Git-Traceable Error Telemetry (exact repo, branch, commit SHA, file, line, GitHub URL)
--   2. Self-Learning Search & LLM Feedback Loop (Affinity Reranking, Synonym Cache, Few-Shot RAG)
--   3. Multi-User Anti-Bot ("Anti-Bog"), AI Security & OWASP WAF Audit Log
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Git-Traceable Error Telemetry Ledger
--    Captures every backend, webhook, or frontend runtime error with exact Git coordinates
--    so engineers know the exact file & line number to fix immediately.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loulou_git_error_traces (
    id BIGSERIAL PRIMARY KEY,
    error_code VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'ERROR', -- 'WARN', 'ERROR', 'CRITICAL'
    service_module VARCHAR(128) NOT NULL,
    error_message TEXT NOT NULL,
    git_repo VARCHAR(128) NOT NULL DEFAULT 'banerjee08/print_on_demand',
    git_branch VARCHAR(64) NOT NULL DEFAULT 'development',
    git_commit_sha VARCHAR(64) NOT NULL DEFAULT 'HEAD',
    file_path VARCHAR(255) NOT NULL,
    function_name VARCHAR(128) NOT NULL DEFAULT 'anonymous',
    line_number INTEGER NOT NULL DEFAULT 1,
    column_number INTEGER NOT NULL DEFAULT 1,
    github_blame_url TEXT NOT NULL,
    git_cli_fix_command TEXT NOT NULL,
    request_id VARCHAR(128),
    visitor_key VARCHAR(320),
    sanitized_context_json JSONB DEFAULT '{}'::jsonb,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(error_code, file_path, line_number)
);

CREATE INDEX IF NOT EXISTS idx_git_error_unresolved
    ON loulou_git_error_traces(resolved, last_seen_at DESC);

-- -----------------------------------------------------------------------------
-- 2. Self-Learning Search & Product Conversion Affinity Matrix
--    Reinforcement learning weights per (normalized_query, product_sku) updated in
--    real time from clicks (+1.0), wishlist saves (+2.5), cart adds (+4.0),
--    purchases (+8.0), thumbs-up (+3.0), and thumbs-down (-4.0).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loulou_product_query_affinity (
    normalized_query VARCHAR(180) NOT NULL,
    product_sku VARCHAR(64) NOT NULL,
    impressions_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    wishlist_saves_count INTEGER NOT NULL DEFAULT 0,
    cart_adds_count INTEGER NOT NULL DEFAULT 0,
    purchases_count INTEGER NOT NULL DEFAULT 0,
    explicit_upvotes INTEGER NOT NULL DEFAULT 0,
    explicit_downvotes INTEGER NOT NULL DEFAULT 0,
    conversion_boost_score NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (normalized_query, product_sku)
);

CREATE INDEX IF NOT EXISTS idx_query_affinity_lookup
    ON loulou_product_query_affinity(normalized_query, conversion_boost_score DESC);

-- -----------------------------------------------------------------------------
-- 3. Self-Healing Synonym & Intent Memory (Learned by LLM from User Queries)
--    Maps colloquial shopper phrases (e.g. "bach weekend pjs", "engaged sweater")
--    to canonical catalog categories & SKUs so future searches resolve in <5ms.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loulou_learned_query_synonyms (
    raw_query_norm VARCHAR(180) PRIMARY KEY,
    expanded_keywords TEXT NOT NULL,
    target_category VARCHAR(64),
    recommended_skus TEXT NOT NULL DEFAULT '',
    confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.900,
    learned_from VARCHAR(64) NOT NULL DEFAULT 'LLM_INTENT_EXPANDER',
    hit_count INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial high-velocity US/Canada Q4 shopper intents
INSERT INTO loulou_learned_query_synonyms (
    raw_query_norm, expanded_keywords, target_category, recommended_skus, confidence_score, learned_from
) VALUES
    ('bach', 'bachelorette bridal pajama set kimono robe future mrs crewneck tote', 'BRIDAL', 'LL-BRIDE-1687,LL-BRIDE-828,LL-BRIDE-923,LL-TOTE-1288', 0.980, 'SEED_DOMAIN_ONTOLOGY'),
    ('bachelorette', 'bachelorette party pajama set kimono robe future mrs crewneck weekender tote', 'BRIDAL', 'LL-BRIDE-828,LL-BRIDE-1687,LL-BRIDE-923,LL-TOTE-1288', 0.980, 'SEED_DOMAIN_ONTOLOGY'),
    ('engaged', 'future mrs sweatshirt smells like she is engaged candle bridal ring box', 'BRIDAL', 'LL-BRIDE-1687,LL-GIFT-1488,LL-GIFT-2022', 0.970, 'SEED_DOMAIN_ONTOLOGY'),
    ('stocking stuffer', 'jewelry travel case scented candle corduroy cap tumbler under 50', 'MONOGRAM_GIFTS', 'LL-GIFT-2022,LL-GIFT-1488,LL-OUTER-1742,LL-TUMB-1670', 0.960, 'SEED_DOMAIN_ONTOLOGY'),
    ('cozy', 'sherpa blanket comfort colors 380gsm crewneck quarter zip hoodie', 'CLUB_FLEECE', 'LL-BLANKET-2650,LL-CLUB-1296,LL-OUTER-1941,LL-OUTER-1298', 0.960, 'SEED_DOMAIN_ONTOLOGY'),
    ('matcha', 'matcha pilates social club crewneck country club corduroy cap iced coffee tumbler', 'CLUB_FLEECE', 'LL-CLUB-1296,LL-OUTER-1742,LL-CLUB-49,LL-TUMB-1670', 0.970, 'SEED_DOMAIN_ONTOLOGY')
ON CONFLICT (raw_query_norm) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Continuous LLM Feedback & Few-Shot RAG Memory
--    Stores explicit user feedback (helpful / not helpful / user refinement) on
--    search answers, styling advice, and monogram recommendations. Top-scored rows
--    are injected into Gemini / Ollama prompts as live few-shot examples.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loulou_llm_feedback_memory (
    id BIGSERIAL PRIMARY KEY,
    feature_surface VARCHAR(64) NOT NULL, -- 'SMART_SEARCH', 'MONOGRAM_ADVISOR', 'SIZE_FIT_CONCIERGE'
    user_query TEXT NOT NULL,
    llm_response_summary TEXT NOT NULL,
    selected_product_sku VARCHAR(64),
    feedback_type VARCHAR(32) NOT NULL,   -- 'CLICK', 'WISHLIST', 'ADD_TO_BAG', 'THUMBS_UP', 'THUMBS_DOWN'
    reward_delta NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    visitor_key VARCHAR(320),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_feedback_surface_reward
    ON loulou_llm_feedback_memory(feature_surface, reward_delta DESC, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Multi-User Anti-Bot ("Anti-Bog"), AI Security & WAF Threat Telemetry
--    Tracks blocked prompt injections, SQLi/XSS payloads, honeypot triggers, and
--    velocity rate-limit blocks across all concurrent visitors.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loulou_security_waf_events (
    id BIGSERIAL PRIMARY KEY,
    threat_category VARCHAR(64) NOT NULL, -- 'PROMPT_INJECTION', 'SQLI_ATTEMPT', 'XSS_ATTEMPT', 'BOT_HONEYPOT', 'RATE_LIMIT_BOG', 'TRADEMARK_INFRINGEMENT'
    action_taken VARCHAR(32) NOT NULL DEFAULT 'BLOCKED_403',
    endpoint_path VARCHAR(160) NOT NULL,
    visitor_ip VARCHAR(120) NOT NULL,
    visitor_fingerprint VARCHAR(320) NOT NULL,
    blocked_payload_excerpt TEXT,
    git_handler_ref VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waf_events_ip_time
    ON loulou_security_waf_events(visitor_ip, created_at DESC);

COMMIT;
