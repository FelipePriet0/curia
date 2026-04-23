-- ─── 008 — Onboarding v2 (Narrativa + Briefing) ──────────────────────────────
-- Adiciona os campos do onboarding v2: três blocos narrativos (cliente real,
-- por que pagou, momento da empresa) + quatro perguntas de tensão (sono,
-- hipótese, tentativas, decisão pendente) + um briefing_memo gerado pela LLM
-- que é injetado no system prompt de todo agente do board dali pra frente.
--
-- Os campos legados (icp_defined, icp_description, acquisition_channel,
-- team_size, founded_period, capital_stage, business_model, monetization,
-- main_bottleneck, main_bottleneck_detail) continuam na tabela mas deixam
-- de ser coletados pelo formulário. O board passa a puxar cada um em
-- conversa quando for relevante — princípio do onboarding progressivo.

alter table companies
  -- Bloco 2 — Narrativa
  add column if not exists ideal_customer_story  text,   -- "Descreve um cliente real que entrou recentemente..."
  add column if not exists why_they_paid         text,   -- "Por que essa pessoa te pagou, em vez de continuar do jeito que estava..."
  add column if not exists current_moment        text,   -- chip: 'searching_pmf' | 'signs_of_pmf' | 'have_pmf_scaling' | 'scaling_breaking' | 'stable_next_scurve' | 'restructuring'

  -- Bloco 4 — O que tá pegando
  add column if not exists keeping_up_at_night   text,   -- "O que está te tirando o sono hoje?"
  add column if not exists current_hypothesis    text,   -- "Qual é sua hipótese atual pro que tá causando isso?"
  add column if not exists what_tried            text,   -- "O que você já tentou... e por que não funcionou?"
  add column if not exists pending_decision      text,   -- "Qual decisão você precisa tomar nas próximas 2 semanas?"

  -- Briefing em linguagem natural, gerado pela LLM a partir de todos os campos
  -- acima + métricas + product_description. Injetado no topo do <business_context>
  -- de todo system prompt do board.
  add column if not exists briefing_memo         text;
