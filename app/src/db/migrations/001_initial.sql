-- ─── AI Board — Initial Schema ───────────────────────────────────────────────
-- Run this in Supabase SQL Editor or via MCP

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Companies ────────────────────────────────────────────────────────────────
create table if not exists companies (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  industry    text,
  stage       text,       -- e.g. 'pre-revenue', 'early', 'growth', 'scale'
  main_problem text,
  created_at  timestamptz not null default now()
);

-- ─── Conversations ────────────────────────────────────────────────────────────
create table if not exists conversations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid references companies(id) on delete set null,
  title       text not null default 'New conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_companies_user_id       on companies(user_id);
create index if not exists idx_conversations_user_id   on conversations(user_id);
create index if not exists idx_conversations_updated   on conversations(updated_at desc);
create index if not exists idx_messages_conversation   on messages(conversation_id, created_at asc);

-- ─── Auto-update updated_at on conversations ──────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
alter table companies     enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;

-- Companies: owner only
create policy "companies: owner access"
  on companies for all
  using (auth.uid() = user_id);

-- Conversations: owner only
create policy "conversations: owner access"
  on conversations for all
  using (auth.uid() = user_id);

-- Messages: via conversation ownership
create policy "messages: owner access"
  on messages for all
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
