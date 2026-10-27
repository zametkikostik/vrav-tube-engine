-- VRAV Tube Engine — Postgres schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS licenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT UNIQUE NOT NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  tier          TEXT NOT NULL CHECK (tier IN ('trial', 'pro', 'agency')),
  active        BOOLEAN NOT NULL DEFAULT true,
  max_channels  INT NOT NULL DEFAULT 1,
  stripe_subscription_id TEXT,
  expires_at    TIMESTAMPTZ,
  white_label   JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  license_key   TEXT,
  type          TEXT NOT NULL CHECK (type IN ('audit', 'risk')),
  input         TEXT,
  result        JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(key);
CREATE INDEX IF NOT EXISTS idx_history_user ON audit_history(user_id, created_at DESC);
