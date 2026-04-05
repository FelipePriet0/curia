-- ─── Strategies & Conversation Flags ─────────────────────────────────────────

-- Create strategies table
create table if not exists strategies (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  brief       text not null,
  stage       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes
create index if not exists idx_strategies_user_id on strategies(user_id);

-- Auto-update updated_at
create trigger strategies_updated_at
  before update on strategies
  for each row execute function update_updated_at();

-- RLS
alter table strategies enable row level security;
create policy "strategies: owner access"
  on strategies for all
  using (auth.uid() = user_id);

-- Extend conversations with strategy + flags
alter table conversations
  add column if not exists strategy_id uuid references strategies(id) on delete set null;

alter table conversations
  add column if not exists pinned boolean not null default false;

alter table conversations
  add column if not exists archived boolean not null default false;

-- Allow 'strategy' in conversation_type
alter table conversations drop constraint if exists conversations_conversation_type_check;
alter table conversations add constraint conversations_conversation_type_check
  check (conversation_type in ('regular', 'plan_origin', 'plan_review', 'strategy'));

-- Index for strategy linkage
create index if not exists idx_conversations_strategy_id on conversations(strategy_id) where strategy_id is not null;

