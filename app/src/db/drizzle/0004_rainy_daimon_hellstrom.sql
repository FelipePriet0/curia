CREATE TABLE IF NOT EXISTS "company_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"dossier" text,
	"decisions_log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_refreshed_at" timestamp with time zone,
	"last_conversation_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"thumbs" text,
	"rating" smallint,
	"dimensions" jsonb,
	"comment" text,
	"evaluator_role" text DEFAULT 'founder',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"whatsapp" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ideal_customer_story" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "why_they_paid" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "current_moment" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "keeping_up_at_night" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "current_hypothesis" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "what_tried" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pending_decision" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "briefing_memo" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "council_mode" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_id" text;--> statement-breakpoint
ALTER TABLE "company_memory" ADD CONSTRAINT "company_memory_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_feedbacks" ADD CONSTRAINT "message_feedbacks_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_feedbacks" ADD CONSTRAINT "message_feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_memory_company_unique" ON "company_memory" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_memory_last_refreshed_idx" ON "company_memory" USING btree ("last_refreshed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_feedbacks_message_idx" ON "message_feedbacks" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_feedbacks_user_idx" ON "message_feedbacks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_feedbacks_role_idx" ON "message_feedbacks" USING btree ("evaluator_role","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_leads_email_unique" ON "waitlist_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waitlist_leads_created_at_idx" ON "waitlist_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_council_mode_idx" ON "messages" USING btree ("council_mode");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_unique" ON "users" USING btree ("clerk_user_id");