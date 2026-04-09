-- ─── 007 — Company Profile (Onboarding) ──────────────────────────────────────
-- Expande a tabela companies com todos os campos coletados no onboarding
-- e adiciona os campos de diagnóstico gerados pelo agente.

alter table companies
  -- Business model
  add column if not exists business_type          text,          -- 'saas' | 'physical_product' | 'service' | 'marketplace' | 'app'
  add column if not exists business_model         text,          -- 'b2b' | 'b2c' | 'b2b2c'
  add column if not exists monetization           text,          -- 'subscription' | 'one_time' | 'usage_based' | 'commission' | 'hybrid'
  add column if not exists average_ticket         numeric,
  add column if not exists product_description    text,

  -- Team & capital
  add column if not exists team_size              text,          -- 'solo' | '2-10' | '11-50' | '50+'
  add column if not exists founded_period         text,          -- e.g. '2024-2025'
  add column if not exists capital_stage          text,          -- 'bootstrapped' | 'angel' | 'seed' | 'series_a_plus'

  -- Subscription / SaaS metrics
  add column if not exists mrr                    numeric,
  add column if not exists churn_rate             numeric,
  add column if not exists cac                    numeric,
  add column if not exists ltv                    numeric,

  -- Transactional metrics
  add column if not exists monthly_revenue        numeric,
  add column if not exists gross_margin           numeric,

  -- Service metrics
  add column if not exists max_capacity           integer,

  -- Marketplace metrics
  add column if not exists gmv                    numeric,
  add column if not exists take_rate              numeric,
  add column if not exists marketplace_weak_side  text,          -- 'supply' | 'demand'

  -- Traction
  add column if not exists active_customers       integer,
  add column if not exists icp_defined            boolean default false,
  add column if not exists icp_description        text,
  add column if not exists acquisition_channel    text,

  -- Bottleneck
  add column if not exists main_bottleneck        text,
  add column if not exists main_bottleneck_detail text,

  -- Agent diagnosis (preenchido após onboarding)
  add column if not exists diagnosed_stage        text,          -- 'pre_revenue' | 'early_traction' | 'growth' | 'scale'
  add column if not exists stage_confirmed        boolean default false,
  add column if not exists diagnostic_summary     text,
  add column if not exists priority_ladder        jsonb,         -- [{rank, problem, detail, framework, urgency}]
  add column if not exists onboarding_completed_at timestamptz,

  -- Timestamps
  add column if not exists updated_at             timestamptz not null default now();

-- Unique: um perfil de empresa por usuário (MVP)
create unique index if not exists idx_companies_user_unique
  on companies(user_id);

-- Auto-update updated_at (reutiliza a função criada em 001_initial.sql)
create or replace trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();
