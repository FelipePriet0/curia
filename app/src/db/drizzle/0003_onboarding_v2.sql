ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "ideal_customer_story" text,
  ADD COLUMN IF NOT EXISTS "why_they_paid" text,
  ADD COLUMN IF NOT EXISTS "current_moment" text,
  ADD COLUMN IF NOT EXISTS "keeping_up_at_night" text,
  ADD COLUMN IF NOT EXISTS "current_hypothesis" text,
  ADD COLUMN IF NOT EXISTS "what_tried" text,
  ADD COLUMN IF NOT EXISTS "pending_decision" text,
  ADD COLUMN IF NOT EXISTS "briefing_memo" text;
