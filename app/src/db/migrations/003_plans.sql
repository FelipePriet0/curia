-- ─── Plans & Review Cycle ────────────────────────────────────────────────────

-- Step 1: Create plans table (before FK to conversations, to avoid circular dep)
create table if not exists plans (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  title                 text not null,
  summary               text not null,
  next_steps            text not null,
  metrics               jsonb,
  framework_used        text,
  review_date           date,
  review_interval_days  int  not null default 14,
  status                text not null default 'active'
                        check (status in ('active', 'reviewed', 'archived')),
  notification_sent     boolean not null default false,
  notification_sent_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Step 2: Extend conversations with plan awareness
alter table conversations
  add column if not exists plan_id uuid references plans(id) on delete set null;

do $$ begin
  alter table conversations
    add column conversation_type text not null default 'regular'
      check (conversation_type in ('regular', 'plan_origin', 'plan_review'));
exception when duplicate_column then null;
end $$;

-- Step 3: Add origin_conversation FK to plans (now conversations exists)
alter table plans
  add column if not exists origin_conversation_id uuid references conversations(id) on delete set null;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_plans_user_id      on plans(user_id);
create index if not exists idx_plans_review_date  on plans(review_date) where status = 'active';
create index if not exists idx_convs_plan_id      on conversations(plan_id) where plan_id is not null;

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
create trigger plans_updated_at
  before update on plans
  for each row execute function update_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table plans enable row level security;

create policy "plans: owner access"
  on plans for all using (auth.uid() = user_id);

-- ─── Extend events check to include plan lifecycle events ─────────────────────
alter table events drop constraint if exists events_type_check;
alter table events add constraint events_type_check
  check (type in (
    'activation_started',
    'conversation_started',
    'flow_progressed',
    'plan_requested',
    'plan_created',
    'review_scheduled',
    'review_completed'
  ));
