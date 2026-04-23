-- ─── 011 — Waitlist: add name + whatsapp ──────────────────────────────────────
ALTER TABLE waitlist_leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE waitlist_leads ADD COLUMN IF NOT EXISTS whatsapp TEXT;
