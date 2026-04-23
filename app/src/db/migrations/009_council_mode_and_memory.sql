-- ─── 009 — Council Mode A/B + Institutional Memory ──────────────────────────
-- Esta migration prepara o produto pra duas decisões arquiteturais:
--
-- (1) A/B do COUNCIL_MODE desde o dia 1 — precisamos registrar qual modo
--     gerou cada resposta e capturar feedback tipado do founder pra medir
--     utilidade/rigor/genericidade.
--
-- (2) Memória institucional viva por empresa — um dossier textual que se
--     atualiza ao fim de cada conversa + um log estruturado de decisões
--     materializadas pela tool propose_strategy.
--
-- Ver: src/lib/llm/counselors.ts (bloco "EXPERIMENTO PENDENTE").

-- ─── 1) Registrar o modo de geração em cada resposta do assistant ─────────────
-- null em mensagens do user; 'full' | 'direct' | 'synthetic_council' no assistant.
-- Essa coluna é o que permite o A/B — sem ela, não dá pra cruzar qualidade com modo.

alter table messages
  add column if not exists council_mode text;

create index if not exists messages_council_mode_idx
  on messages(council_mode)
  where council_mode is not null;

-- ─── 2) Feedback por mensagem — medição de qualidade tipada ──────────────────
-- Uma mensagem pode ter múltiplos feedbacks (founder + advisor avaliando o mesmo
-- output, ou o founder reavaliando depois). Dimensões guardadas em jsonb porque
-- elas vão evoluir conforme refinamos o protocolo de avaliação.

create table if not exists message_feedbacks (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references messages(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  thumbs          text check (thumbs in ('up', 'down')),
  rating          smallint check (rating between 1 and 5),
  dimensions      jsonb,   -- { utility: 1-5, rigor: 1-5, generic: 1-5, actionable: 1-5 }
  comment         text,
  evaluator_role  text check (evaluator_role in ('founder', 'advisor', 'internal')) default 'founder',
  created_at      timestamptz not null default now()
);

create index if not exists message_feedbacks_message_idx
  on message_feedbacks(message_id);

create index if not exists message_feedbacks_user_idx
  on message_feedbacks(user_id, created_at);

create index if not exists message_feedbacks_role_idx
  on message_feedbacks(evaluator_role, created_at);

-- ─── 3) Memória institucional — dossier vivo por empresa ──────────────────────
-- Um único registro por company_id (uniqueness via index). O dossier é
-- regenerado por Haiku ao fim de cada conversa (ou sob demanda). O
-- decisions_log acumula snapshots de propose_strategy — nunca é sobrescrito,
-- só cresce. Injetado no system prompt junto com briefing_memo do onboarding.

create table if not exists company_memory (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references companies(id) on delete cascade,
  dossier            text,                               -- 300-500 palavras, re-sintetizadas periodicamente
  decisions_log      jsonb not null default '[]'::jsonb, -- [{ date, name, brief, stage, conversation_id }]
  last_refreshed_at  timestamptz,                        -- última vez que o dossier rodou no Haiku
  last_conversation_at timestamptz,                      -- última conversa contemplada no dossier atual
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index if not exists company_memory_company_unique
  on company_memory(company_id);

create index if not exists company_memory_last_refreshed_idx
  on company_memory(last_refreshed_at);
