-- Additive migration. Preserve existing payments, entitlements and refund tombstones.
CREATE TABLE IF NOT EXISTS commerce_contracts (
 order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
 body TEXT NOT NULL, sha256 TEXT NOT NULL,
 created_at TEXT NOT NULL,
 paid_total_pence INTEGER, tax_pence INTEGER,
 confirmed_at TEXT, document_accessed_at TEXT,
 financial_retain_until TEXT,
 legal_hold INTEGER NOT NULL DEFAULT 0 CHECK (legal_hold IN (0,1))
);
CREATE TRIGGER IF NOT EXISTS commerce_contract_immutable
 BEFORE UPDATE OF body,sha256,created_at ON commerce_contracts
 BEGIN SELECT RAISE(ABORT,'contract snapshot is immutable'); END;
CREATE TABLE IF NOT EXISTS commerce_recovery_events (
 id TEXT PRIMARY KEY,
 order_id TEXT NOT NULL REFERENCES commerce_orders(id),
 old_claim_hash TEXT NOT NULL, new_claim_hash TEXT NOT NULL,
 verified_at TEXT NOT NULL,
 method TEXT NOT NULL CHECK(method='owner_verified_stripe_customer')
);
CREATE INDEX IF NOT EXISTS idx_commerce_recovery_order ON commerce_recovery_events(order_id);
