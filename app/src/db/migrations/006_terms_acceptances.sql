-- ─── User Terms Acceptances ─────────────────────────────────────────────────

create table if not exists user_terms_acceptances (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  terms_version  text not null,
  accepted_at    timestamptz not null default now(),
  ip             text,
  user_agent     text
);

create index if not exists idx_terms_accept_user on user_terms_acceptances(user_id, accepted_at desc);

alter table user_terms_acceptances enable row level security;

-- Users may read their own acceptances; inserts are managed by server/admin
create policy "terms: read own" on user_terms_acceptances
  for select using (auth.uid() = user_id);

