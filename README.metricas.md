# Métricas de valor (MVP)

Foco em poucas métricas que mostram entrega de valor real — simples de medir e úteis para decisão.

## O que medimos

- Ativações: quantos fundadores iniciaram sua primeira conversa (primeira mensagem enviada em qualquer conversa).
- Conversas iniciadas: quantos começaram uma conversa (primeira mensagem em uma conversa específica).
- Fluxo da conversa (progrediu): quantos receberam uma resposta do Board que contém Diagnóstico e Problema Central (estrutura mínima para clareza).
- Pediram Plano: quantos pediram explicitamente um plano (mensagem do usuário contendo sinais como “plano”, “qual o plano”, “manda o plano”, “o que faço agora”, “vamos nessa”, “fechado”, “ok, entendi”).

## Como instrumentamos

### Eventos (tabela `events`)

Criado em `app/src/db/migrations/002_events.sql`:

- type:
  - `activation_started` — primeira mensagem do usuário no produto (qualquer conversa).
  - `conversation_started` — primeira mensagem em uma conversa.
  - `flow_progressed` — resposta do Board com “Diagnóstico” e “Problema Central”.
  - `plan_requested` — mensagem do usuário contendo pedido de plano (padrões PT-BR).

### Onde rastreamos

Arquivo: `app/src/app/api/conversations/[id]/messages/route.ts`

- Ao salvar a mensagem do usuário (POST):
  - `plan_requested` se o texto combinar com os padrões.
  - Se for a primeira mensagem da conversa: `conversation_started`.
  - Se for a primeira mensagem do usuário no produto: `activation_started`.

- Ao salvar a resposta do Board (após streaming):
  - `flow_progressed` se a resposta contiver as seções “### 🔍 Diagnóstico” e “### 🎯 Problema Central”.

### Detectores reutilizáveis

Arquivo: `app/src/lib/metrics/detectors.ts`

- `isPlanRequest(text)` — detecta pedidos de plano.
- `hasDiagnosis(text)` / `hasProblemCentral(text)` — detecta seções obrigatórias.

### Gravação de evento

Arquivo: `app/src/lib/metrics/track.ts`

- `trackEvent(supabase, { userId, conversationId, type, metadata })` — insere na tabela `events` (melhor esforço; não quebra o fluxo se falhar).

## Como ler as métricas

- Ativações (NSM auxiliar): `select count(distinct user_id) from events where type='activation_started' and created_at >= now()-interval '7 days'`.
- Conversas iniciadas: `select count(*) from events where type='conversation_started' and created_at >= ...`.
- Fluxo progrediu: `select count(*) from events where type='flow_progressed' and created_at >= ...`.
- Pediram plano: `select count(*) from events where type='plan_requested' and created_at >= ...`.

Combinando por usuário para funnels semanais:

```
-- Usuários que ativaram e pediram plano (últimos 7 dias)
with e as (
  select user_id, type from events where created_at >= now()-interval '7 days'
)
select
  count(distinct case when type='activation_started' then user_id end) as ativacoes,
  count(distinct case when type='plan_requested' then user_id end) as pediram_plano
from e;
```

## Notas de produto

- O Board só propõe “Próximos 7–14 dias” quando a conversa fecha (diagnóstico claro + problema central claro + contexto mínimo ou sinais do founder).
- Sem UI extra: a proposta do plano surge naturalmente na conversa.
- Podemos iterar depois adicionando “plan_proposed” se quisermos medir entregas de plano além de pedidos de plano.

