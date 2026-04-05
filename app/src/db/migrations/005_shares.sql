-- ─── Public Sharing for Conversations ───────────────────────────────────────

-- Optional: drop index from 004 if requested
drop index if exists idx_conversations_strategy_id;

-- Share table
create table if not exists shared_conversations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  conversation_id  uuid not null references conversations(id) on delete cascade,
  token            text not null unique,
  created_at       timestamptz not null default now(),
  revoked_at       timestamptz
);

create index if not exists idx_shared_conversations_user on shared_conversations(user_id, created_at desc);
create index if not exists idx_shared_conversations_conv on shared_conversations(conversation_id) where revoked_at is null;

alter table shared_conversations enable row level security;

-- Only owner can manage their share records via authenticated session
create policy "shared: owner manage" on shared_conversations
  for all using (auth.uid() = user_id);

