---
title: CURIA — Visão, MVP e Roadmap
tags: [curia, produto, mvp, roadmap, agent-handoff]
owner: Felipe
status: draft
updated: 2026-04-06
---

# TL;DR

- Diagnóstico guiado forte + aplicação prática. A Curia pede dados, lê anexos, estrutura o diagnóstico (SWOT/suposições/risco), e entrega plano acionável com criativos rascunho. Integrações para executar virão por fases.
- MVP agora: intake guiado no chat, armazenamento de anexos e breve de análise textual, reforços no prompt, plano de ação com tarefas e criativos base. Sem OAuth ainda.
- Roadmap: conectores (Instagram/Facebook) → análise vision + variações de copy → agendamento/publicação → orquestração multi-agente.

# Norte do Produto

- Diagnóstico guiado: ao receber um problema (ex.: vendas), a Curia solicita o estritamente necessário (canais, métricas simples, criativos recentes) e guia o upload/conexão.
- Aplicação prática: outputs viram tarefas, materiais e próximos passos concretos. No roadmap, conectores executam (agendar/postar/medir) com confirmação do fundador.
- Fricção mínima: “um de cada vez” para o usuário; a Curia faz o pesado (coleta, análise, estruturação).

# Arquitetura Atual (referência rápida)

- Counselors paralelos (app/src/lib/llm/counselors.ts): conselheiros por domínio rodam em paralelo (Haiku) e emitem briefs; depois a síntese integra.
- Query loop (app/src/lib/llm/query-loop.ts): streaming + compactação + tools (hoje: busca casos e proposta de estratégia) + fallback Claude.
- Prompt (app/src/lib/llm/board-prompt.ts): pipeline interno para diagnóstico, frameworks e recomendações; já monta blocks de contexto da empresa/estratégia.
- UI (CouncilInput): popovers para “Curia Strategist” e anexos; já ajustado para popovers mutuamente exclusivos.

# MVP — Escopo Agora (sem integrações externas)

- Objetivo: elevar o “Diagnóstico” e entregar um “Plano de Ação” utilizável, com criativos rascunho e checklist operacional.

- Experiência do usuário
  - Fundador descreve o problema e a empresa (CompanyContext mínimo).
  - Curia pede dados faltantes (intake guiado): canais ativos, 2–3 métricas simples, upload de criativos recentes (imagens/PDF).
  - Curia estrutura diagnóstico forte: 2 suposições críticas, SWOT curta, 3 riscos “invisíveis” (lente de survivorship), cita casos quando útil (tools existentes).
  - Curia entrega Plano de Ação (3–7 tarefas), com rascunhos de copy/instruções visuais por canal, prazos 7–14 dias.

- Alterações técnicas mínimas (cirúrgicas)
  - Tools (novas, para o loop)
    - request_intake (function): modelo solicita à UI uma lista de “itens de coleta” específicos.
      - parameters: { needs: Array<{ id, label, kind: 'metric'|'channel'|'file'|'auth', description?, examples? }>, rationale?: string }
      - efeito: UI exibe checklist; não requer resposta do modelo; app registra estado dos “needs”.
    - analyze_assets (function, stub no MVP): recebe asset_ids e retorna texto curto com padrões criativos percebidos; se indisponível, retorna "analysis_unavailable".
      - parameters: { asset_ids: string[], goal?: string }
  - Tipos/DB (mínimo)
    - assets(id, conversation_id, filename, mime, size, url, created_at)
    - diagnostics(conversation_id, summary_json, created_at)
  - Endpoints
    - POST /api/assets → upload + metadado
    - GET /api/conversations/:id/diagnostic → retorna resumo corrente (summary_json)
  - UI (CouncilInput)
    - Painel “Diagnóstico”: chips de itens pendentes (ex.: Conectar IG/FB [em breve], Enviar criativos, Preencher métricas). Zona de upload. Estado completo/parcial por item.
  - Prompt
    - Reforçar REASONING para: (1) exigir dados mínimos antes de recomendar, (2) sempre gerar 2 suposições críticas antes do plano, (3) quando houver anexos, comparar mensagem/CTA dos criativos com o problema.

# Roadmap por Fases (Aplicação Real da Estratégia)

- Fase 2 — Conectores e Coleta Automática
  - OAuth Instagram/Facebook (Meta Graph): trazer últimos criativos e métricas (impressões, CTR, CPC, alcance) por período.
  - Serviço “Data Aggregator”: normaliza métricas por canal e persiste em channel_metrics.
  - Tool fetch_social_metrics: chamada assíncrona; UI mostra “coletando…”.

- Fase 3 — Análise Assistida (Visão + Copy)
  - Vision backend: heurísticas de criativo (hierarquia, contraste, legibilidade, clareza de proposta).
  - Variações de copy: 2–3 opções por canal com premissas A/B (ganchos distintos).

- Fase 4 — Aplicação Operacional
  - Agendamento/publicação (Meta Publishing) com revisão; rascunhos de conjuntos/segmentos para Ads.
  - Webhooks/CRM leve para capturar retorno; fechamento de loop para aprender com performance.

- Fase 5 — Orquestração Multi-Agente
  - Agentes especializados (GrowthAgent, CreativeAgent, OpsAgent) como tools com estado; executor decide sequência/retries.

# Riscos e Trade-offs

- Vision e conectores dependem de chaves/quota → por isso MVP prioriza intake manual + análise textual.
- Over-asking: limitar a 3 itens críticos por domínio; “pedidos” granulares que mudam a decisão.
- Privacidade: OAuth com escopo mínimo; storage de tokens seguro; logs anônimos.

# Decisões e Ajustes Já Aplicados no Repo (contexto de UI)

- Avatar no rodapé da Sidebar com dot “Online” (fallback por iniciais).
- Popovers (Curia Strategist e anexos) agora mutuamente exclusivos.
- Toggle da Sidebar movido para a linha do header “Curia + +” (dentro da Sidebar); botão compacto no conteúdo quando fechada.

# Propostas de Assinaturas (Tools) — rascunho

```json
// request_intake
{
  "type": "function",
  "function": {
    "name": "request_intake",
    "description": "Solicitar dados/itens específicos para diagnóstico guiado.",
    "parameters": {
      "type": "object",
      "properties": {
        "needs": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "label": { "type": "string" },
              "kind": { "type": "string", "enum": ["metric", "channel", "file", "auth"] },
              "description": { "type": "string" },
              "examples": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["id", "label", "kind"]
          }
        },
        "rationale": { "type": "string" }
      },
      "required": ["needs"]
    }
  }
}

// analyze_assets (MVP: stub)
{
  "type": "function",
  "function": {
    "name": "analyze_assets",
    "description": "Analisar anexos (criativos) e retornar breve textual de padrões/achados.",
    "parameters": {
      "type": "object",
      "properties": {
        "asset_ids": { "type": "array", "items": { "type": "string" } },
        "goal": { "type": "string" }
      },
      "required": ["asset_ids"]
    }
  }
}
```

# Esboço de Schema (SQL) — mínimo

```sql
-- assets
create table assets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  filename text not null,
  mime text not null,
  size int not null,
  url text not null,
  created_at timestamp with time zone default now()
);

-- diagnostics
create table diagnostics (
  conversation_id uuid primary key references conversations(id) on delete cascade,
  summary_json jsonb not null,
  created_at timestamp with time zone default now()
);
```

# Fluxo de Interação (MVP)

- Usuário descreve problema → loop inicia, counselors rodam (paralelo) → modelo detecta lacunas → tool_call: request_intake → UI mostra checklist e zona de upload → usuário envia anexos/preenche métricas → app salva `assets` e consolida `diagnostics` → modelo prossegue com diagnóstico (suposições, SWOT, riscos) → plano de ação + criativos rascunho.

# Critérios de Aceite (MVP)

- “Pedido de intake” aparece como chips acionáveis, no máximo 3 por vez.
- Upload de criativos salva metadados e gera um breve textual armazenado.
- Resposta do modelo inclui: 2 suposições críticas, SWOT curta, 3 riscos “invisíveis”, plano de 3–7 tarefas com prazos, e rascunhos de copy por canal.
- Sem OAuth, mas com CTA claro para conectar no futuro.

# Próximos Passos Desta Conversa (handoff)

- Confirmar escopo do MVP acima (OK do Felipe). Priorizar primeiro domínio (Growth/Vendas?).
- Definir ordem de conectores no roadmap (Instagram/Facebook primeiro?).
- Se aprovado:
  - Adicionar a tool `request_intake` e o stub `analyze_assets` no query-loop.
  - Criar tipos/endpoints mínimos (`assets`, `diagnostics`).
  - Implementar painel “Diagnóstico” no `CouncilInput` com chips e upload.
  - Ajustar prompt para reforçar suposições/diagnóstico antes de plano.

# Perguntas Abertas

- Quais métricas mínimas por canal priorizar no intake (2–3)?
- Padrões de copy/branding obrigatórios? Há exemplos preferidos?
- Escopo de privacidade/logs para conectores no roadmap?

# Notas para Agentes (como continuar)

- Ler estes arquivos para contexto rápido: counselors.ts, query-loop.ts, board-prompt.ts, CouncilInput.tsx.
- Manter mudanças cirúrgicas: não quebrar fluxo de streaming e tools existentes.
- Validar UX: popovers exclusivos, checklist enxuta, feedback claro de progresso.
- Documentar quaisquer novas rotas/tipos na pasta `aiboardobsidian/` como addendum a este arquivo.

—
Autor: Felipe (visão). Preparado para handoff multi-agente.

