-- Migration 004: Visitor Entry Cookie Disclaimer & Granular Consent Ledger
-- Enforces GDPR, CCPA/CPRA, Canadian PIPEDA, and UK PECR entry cookie consent rules
-- for LouLou & Luxe (https://loulouandluxe.com) and all Banana POD regional storefronts.

CREATE TABLE IF NOT EXISTS visitor_cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id VARCHAR(64) NOT NULL UNIQUE,
  brand_slug VARCHAR(64) NOT NULL DEFAULT 'loulouandluxe',
  region_code VARCHAR(16) NOT NULL DEFAULT 'US_CA',
  visitor_hash CHAR(64) NOT NULL, -- SHA-256(salted IP + User-Agent), zero raw PII stored
  consent_level VARCHAR(24) NOT NULL CHECK (consent_level IN ('ALL', 'NECESSARY_ONLY', 'CUSTOM')),
  necessary_cookies BOOLEAN NOT NULL DEFAULT TRUE,
  analytics_cookies BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_cookies BOOLEAN NOT NULL DEFAULT FALSE,
  policy_version VARCHAR(16) NOT NULL DEFAULT '2026.10',
  entry_path VARCHAR(255) NOT NULL DEFAULT '/',
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days')
);

CREATE INDEX IF NOT EXISTS idx_visitor_cookie_consents_hash
  ON visitor_cookie_consents (visitor_hash, brand_slug);

CREATE INDEX IF NOT EXISTS idx_visitor_cookie_consents_created
  ON visitor_cookie_consents (consented_at DESC);
