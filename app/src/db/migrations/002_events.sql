-- ─── Product Metrics — Events ────────────────────────────────────────────────

-- Table: events
-- Captures minimal product analytics for value metrics

create table if not exists events (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  type            text not null check (type in (
                    'activation_started',
                    'conversation_started',
                    'flow_progressed',
                    'plan_requested'
                  )),
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_events_user_created on events(user_id, created_at desc);
create index if not exists idx_events_type_created on events(type, created_at desc);

alter table events enable row level security;

create policy "events: owner access"
  on events for all
  using (auth.uid() = user_id);

