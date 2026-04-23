-- ─── 010 — Waitlist Leads ─────────────────────────────────────────────────────
-- Captura emails de leads na LP de lista de espera (teste de demanda A/B).
-- Tabela pública (sem FK para users): qualquer visitante pode entrar na fila.

CREATE TABLE IF NOT EXISTS waitlist_leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_leads_email_unique ON waitlist_leads (email);
CREATE INDEX IF NOT EXISTS waitlist_leads_created_at_idx ON waitlist_leads (created_at);
