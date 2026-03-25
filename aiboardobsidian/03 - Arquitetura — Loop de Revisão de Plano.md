# Arquitetura — Loop de Revisão de Plano

> Documento técnico para validação antes da implementação.
> Objetivo: fechar o loop conversa → plano → revisão → novo ciclo.

---

## Visão Geral do que Muda

Hoje a Curia tem:
```
Conversation → Messages[]
```

Depois dessa implementação, terá:
```
Plan (entidade central com memória persistente)
  ├── Conversa de origem (onde o plano nasceu)
  ├── Métricas definidas (o que vai ser medido)
  ├── Data de revisão agendada
  ├── Status: ativo → revisado → novo ciclo
  └── Conversas de revisão[] (sessões de checagem futuras)
```

O Plano vira o "projeto" — como os Projetos do ChatGPT. A memória não morre. Cada revisão é uma nova conversa, mas com contexto total do plano original e das revisões anteriores.

---

## 1. Banco de Dados — Novas Tabelas e Mudanças

### Nova tabela: `plans`

```sql
create table if not exists plans (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  origin_conversation_id uuid references conversations(id) on delete set null,

  -- Identidade do plano
  title             text not null,           -- Ex: "Plano Comercial — Março 2026"
  summary           text not null,           -- Resumo do diagnóstico e direção estratégica
  next_steps        text not null,           -- O bloco "Próximos Passos (7-14 dias)" extraído
  metrics           jsonb,                   -- Ex: {"CAC": "R$120", "meta_receita": "R$50k"}
  framework_used    text,                    -- Ex: "Flywheel + North Star Metric"

  -- Ciclo de revisão
  review_date       date,                    -- Data agendada para checagem
  review_interval_days int default 14,       -- Padrão: 14 dias
  status            text not null default 'active'
                    check (status in ('active', 'reviewed', 'archived')),

  -- Notificação
  notification_sent boolean default false,
  notification_sent_at timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

### Mudança em `conversations`

Adicionar coluna para linkar revisões ao plano de origem:

```sql
alter table conversations
  add column plan_id uuid references plans(id) on delete set null,
  add column conversation_type text not null default 'regular'
    check (conversation_type in ('regular', 'plan_origin', 'plan_review'));
```

- `regular` → conversa comum (comportamento atual)
- `plan_origin` → conversa onde o plano foi gerado e salvo
- `plan_review` → sessão de revisão ligada a um plano existente

### Nova tabela: `plan_notifications`

Rastreia o histórico de notificações enviadas (evita duplicatas, permite auditoria):

```sql
create table if not exists plan_notifications (
  id          uuid primary key default uuid_generate_v4(),
  plan_id     uuid not null references plans(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  channel     text not null check (channel in ('email', 'whatsapp')),
  type        text not null check (type in ('reminder_d1', 'review_day')),
  sent_at     timestamptz not null default now(),
  status      text not null check (status in ('sent', 'failed'))
);
```

### RLS em todas as novas tabelas

```sql
alter table plans enable row level security;
alter table plan_notifications enable row level security;

create policy "plans: owner access"
  on plans for all using (auth.uid() = user_id);

create policy "plan_notifications: owner access"
  on plan_notifications for all using (auth.uid() = user_id);
```

### Atualizar eventos para incluir planos

```sql
-- Adicionar novos tipos ao check da tabela events
alter table events drop constraint events_type_check;
alter table events add constraint events_type_check
  check (type in (
    'activation_started',
    'conversation_started',
    'flow_progressed',
    'plan_requested',
    'plan_created',       -- novo
    'review_scheduled',   -- novo
    'review_completed'    -- novo
  ));
```

---

## 2. Fluxo Completo — Do Plano à Revisão

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSÃO ESTRATÉGICA                        │
│                                                             │
│  Founder descreve problema                                  │
│         ↓                                                   │
│  Curia entrega: Diagnóstico + Plano + Métricas              │
│         ↓                                                   │
│  Último bloco da resposta:                                  │
│  "📅 Checagem do Plano — Quando revisamos isso?"            │
│  [Marcar para 7 dias] [14 dias] [Data personalizada]        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   SALVAR O PLANO                             │
│                                                             │
│  Founder clica em uma das opções de data                    │
│  Sistema cria registro em `plans`                           │
│  Conversa atual marcada como `plan_origin`                  │
│  Evento `plan_created` registrado                           │
│  Evento `review_scheduled` registrado                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   CICLO DE NOTIFICAÇÃO                      │
│                                                             │
│  D-1 antes da revisão:                                      │
│    → Email: "Amanhã é a revisão do seu plano [título]"     │
│    → Botão direto: "Iniciar revisão"                        │
│                                                             │
│  D-0 (dia da revisão):                                      │
│    → Badge no board: "Você tem uma revisão pendente"        │
│    → Email (se ainda não abriu): "Sua revisão é hoje"       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   SESSÃO DE REVISÃO                          │
│                                                             │
│  Nova conversa criada (type: plan_review, plan_id: X)       │
│  Curia abre com contexto do plano original:                 │
│                                                             │
│  "Voltamos. Aqui estava o plano de [data]:                  │
│   — [resumo do plano]                                       │
│   — Métricas definidas: CAC R$120, Meta R$50k              │
│                                                             │
│   Três perguntas para começar:                              │
│   1. O que avançou?                                         │
│   2. O que travou?                                          │
│   3. Os números — me mostra o que você tem."                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   NOVO CICLO                                 │
│                                                             │
│  Ao final da revisão, novo plano pode ser gerado            │
│  Status do plano anterior → 'reviewed'                      │
│  Novo plano criado com nova data de revisão                 │
│  Loop fecha                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Mudanças no Prompt da Curia

### 3.1 — Novo bloco obrigatório no final de toda resposta com plano

Adicionar ao `RESPONSE_BEHAVIOR`:

```
### 📅 Checagem do Plano
Sempre que entregar um bloco "Próximos Passos (7-14 dias)", encerrar com:
- Uma frase que enquadra o retorno como parte do processo (não opcional)
- A sugestão explícita de data (ex: "Revisamos em 14 dias — [data sugerida]")
- Tom: isso não é um extra. É como um conselho funciona.

Exemplo:
"Todo plano precisa de um ponto de checagem. Sugiro que a gente se reúna em 14 dias —
[data] — para avaliar o que avançou, o que travou, e ajustar o curso.
Quer marcar agora?"
```

### 3.2 — Novo bloco de contexto injetado nas sessões de revisão

Quando `conversation_type === 'plan_review'`, o prompt recebe um bloco adicional:

```
<plan_review_context>
Esta é uma sessão de REVISÃO DE PLANO. Contexto da sessão anterior:

Plano: [título]
Data do plano: [data de criação]
Diagnóstico original: [summary]
Próximos passos definidos: [next_steps]
Métricas acordadas: [metrics em formato legível]
Dias desde o plano: [N dias]

INSTRUÇÕES PARA ESTA SESSÃO:
1. Abra reconhecendo o tempo passado e o comprometimento do founder em voltar.
2. Faça as três perguntas de abertura: o que avançou, o que travou, os números.
3. Com base nas respostas, avalie cada item do plano anterior.
4. Gere novo diagnóstico considerando a evolução desde a última sessão.
5. Feche com novo plano ajustado e nova data de checagem.

NÃO comece do zero. Este é um board com memória. Use o contexto acima.
</plan_review_context>
```

---

## 4. Novas Rotas de API

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/api/plans` | Cria um plano a partir de uma conversa |
| `GET` | `/api/plans` | Lista todos os planos do usuário |
| `GET` | `/api/plans/[id]` | Retorna plano + histórico de revisões |
| `PATCH` | `/api/plans/[id]` | Atualiza status, data de revisão |
| `POST` | `/api/plans/[id]/review` | Inicia nova sessão de revisão (cria conversa linkada) |

---

## 5. Notificações — Implementação MVP

### Canal: Email via Resend

**Por quê Resend:**
- SDK simples, Next.js-native
- ~R$0,001 por email
- Templates HTML customizáveis
- Gratuito até 3.000 emails/mês

**Como funciona o disparo:**

Opção A (MVP simples): **Cron job diário via Supabase Edge Function**
- Roda todo dia às 08h
- Query: `SELECT * FROM plans WHERE review_date = today AND notification_sent = false`
- Para cada plano encontrado, envia email + marca `notification_sent = true`
- Para D-1: `review_date = tomorrow`

Opção B (mais robusto, futuro): **Supabase Database Webhooks**
- Trigger quando `review_date` é inserida
- Agenda job específico no Resend com a data exata

**MVP começa com Opção A.**

### Conteúdo do email (D-1)

```
Assunto: Revisão de plano amanhã — [título do plano]

[Nome do founder],

Amanhã é o dia de revisar o plano que você montou em [data].

[Resumo em 2 linhas do que foi o plano]

A Curia já tem o contexto. É só abrir e continuar.

[BOTÃO: Iniciar revisão →]

---
Curia Board
```

---

## 6. Mudanças na Interface

### 6.1 — Botão de agendar revisão (aparece após plano entregue)

Na `ChatArea.tsx`, quando o último assistente-message contiver o bloco `📅 Checagem do Plano`, renderizar abaixo da mensagem:

```
┌─────────────────────────────────────────────┐
│  Agendar revisão deste plano               │
│  [Em 7 dias]  [Em 14 dias]  [Escolher data] │
└─────────────────────────────────────────────┘
```

Ao clicar, chama `POST /api/plans` com os dados extraídos da mensagem.

### 6.2 — Seção "Meus Planos" na sidebar

Abaixo da lista de conversas, nova seção:

```
PLANOS ATIVOS
● Plano Comercial — Março         📅 Em 3 dias
● Estrutura de Time — Fev         ✅ Revisado
```

Clicar abre o plano com histórico completo de revisões.

### 6.3 — Banner de revisão pendente no board

Quando `review_date <= hoje` e status = `active`:

```
┌─────────────────────────────────────────────────────┐
│  📅 Você tem uma revisão pendente: "Plano Comercial" │
│  [Iniciar revisão →]                  [Adiar 3 dias] │
└─────────────────────────────────────────────────────┘
```

---

## 7. O que Não Muda (por enquanto)

- Conversas regulares continuam funcionando exatamente como hoje
- Nenhuma mudança obrigatória para o usuário — o agendamento é opcional
- O banco atual (`conversations`, `messages`, `events`) não perde dados
- A estrutura do prompt atual permanece; só adiciona blocos contextuais

---

## 8. Sequência de Implementação Sugerida

```
Fase 1 — Base (banco + extração de plano)
  ├── Migration 003: tabela plans + alter conversations
  ├── Migration 004: tabela plan_notifications + atualizar events
  ├── API: POST /api/plans (criar plano manualmente)
  └── Prompt: adicionar bloco 📅 Checagem do Plano

Fase 2 — Interface
  ├── Botão de agendar revisão na ChatArea
  ├── Seção "Meus Planos" na sidebar
  └── Banner de revisão pendente

Fase 3 — Revisão
  ├── API: POST /api/plans/[id]/review (abrir sessão de revisão)
  ├── Injeção do plan_review_context no prompt
  └── Marcar plano como 'reviewed' ao final

Fase 4 — Notificações
  ├── Integrar Resend
  ├── Supabase Edge Function (cron diário)
  └── Templates de email D-1 e D-0
```

---

## 9. Métricas do Loop

Com essa implementação, os eventos de produto passam a medir o ciclo completo:

| Evento | O que indica |
|---|---|
| `plan_created` | Founder salvou um plano — compromisso com ação |
| `review_scheduled` | Fundador agendou retorno — intenção de accountability |
| `review_completed` | Revisão aconteceu — produto entregou valor continuado |
| `plan_requested` (já existe) | Intenção de ter um plano — gatilho de conversão |

**A métrica que importa:** taxa `plan_created → review_completed`. Se esse ciclo fecha, a Curia prova que gera resultado, não só conselho.
