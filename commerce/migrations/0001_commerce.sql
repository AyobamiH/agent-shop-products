-- Agent Shop commercial state v1. Apply as an explicit reviewed D1 migration.
-- Private kit bytes reside only in a non-public R2 bucket.
CREATE TABLE IF NOT EXISTS commerce_orders (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL,
  offer_version TEXT NOT NULL,
  currency TEXT NOT NULL CHECK(currency = 'gbp'),
  amount_pence INTEGER NOT NULL CHECK(amount_pence > 0),
  terms_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('creating', 'checkout_open', 'paid', 'failed', 'revoked')),
  claim_token_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  checkout_session_id TEXT UNIQUE,
  checkout_url TEXT,
  payment_intent_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_session
  ON commerce_orders(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_payment
  ON commerce_orders(payment_intent_id);
CREATE TABLE IF NOT EXISTS commerce_entitlements (
  order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
  offer_id TEXT NOT NULL,
  offer_version TEXT NOT NULL,
  object_key TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('active', 'revoked')),
  issued_at TEXT NOT NULL,
  revoked_at TEXT,
  last_download_at TEXT
);
CREATE TABLE IF NOT EXISTS commerce_webhook_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS commerce_attempt_limits (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
-- Durable refund tombstones prevent an out-of-order paid event restoring access.
CREATE TABLE IF NOT EXISTS commerce_refunds (
  payment_intent_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  received_at TEXT NOT NULL
);
