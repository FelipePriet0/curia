# Plano 5 — Contexto por Estratégia

## O que é

O founder conversa normalmente com a Curia. Se a conversa tiver substância estratégica, a Curia propõe salvar como estratégia — sem friction, sem pergunta antes de começar.

A estratégia vira um **container nomeado**. O founder pode abrir outra conversa dentro do mesmo container e a Curia já sabe tudo: quem é ele, qual é o plano, o que foi decidido, onde parou.

Não é histórico de chat. É **contexto estratégico persistente** — o Chairman resume o que importa, não só o que foi dito.

**Diferença da feature de Projetos do ChatGPT:**
- ChatGPT → founder cria o projeto manualmente
- Curia → **o board detecta e propõe**, baseado no que foi discutido

---

## Fluxo completo

```
Founder conversa normalmente
        ↓
Chairman detecta substância estratégica
        ↓
Curia propõe: "Isso virou um plano. Quer salvar como estratégia?
               Sugiro o nome: 'Posicionamento Board I.A'"
        ↓
Founder aceita → estratégia criada com brief gerado pelo Chairman
        ↓
Na próxima sessão, founder vê a estratégia na tela inicial
        ↓
Abre a estratégia → começa conversa com contexto 100% conectado
        ↓
Pode abrir N conversas na mesma estratégia — todas com contexto compartilhado
```

---

## Banco de Dados (Supabase)

### Tabela: `strategies`

| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid PK | identificador único |
| `user_id` | uuid FK → auth.users | dono da estratégia |
| `name` | text | nome gerado pelo Chairman |
| `brief` | text | resumo estratégico compacto — atualizado a cada conversa |
| `stage` | text | estágio da empresa detectado (0-4) |
| `created_at` | timestamptz | criação |
| `updated_at` | timestamptz | última atualização do brief |

```sql
create table strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  brief text not null,
  stage text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table strategies enable row level security;

create policy "users see own strategies"
  on strategies for all
  using (auth.uid() = user_id);
```

---

### Tabela: `strategy_conversations`

| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid PK | identificador único |
| `strategy_id` | uuid FK → strategies | estratégia pai |
| `title` | text | título da conversa (gerado ou manual) |
| `created_at` | timestamptz | criação |

```sql
create table strategy_conversations (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid references strategies(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

alter table strategy_conversations enable row level security;

create policy "users see own conversations"
  on strategy_conversations for all
  using (
    strategy_id in (
      select id from strategies where user_id = auth.uid()
    )
  );
```

---

### Tabela: `strategy_messages`

| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid PK | identificador único |
| `conversation_id` | uuid FK → strategy_conversations | conversa pai |
| `role` | text | `user` ou `assistant` |
| `content` | text | conteúdo da mensagem |
| `created_at` | timestamptz | criação |

```sql
create table strategy_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references strategy_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table strategy_messages enable row level security;

create policy "users see own messages"
  on strategy_messages for all
  using (
    conversation_id in (
      select sc.id from strategy_conversations sc
      join strategies s on s.id = sc.strategy_id
      where s.user_id = auth.uid()
    )
  );
```

---

## RPCs (Supabase Functions)

### `create_strategy`
Cria uma nova estratégia com brief inicial gerado pelo Chairman.

```sql
create or replace function create_strategy(
  p_user_id uuid,
  p_name text,
  p_brief text,
  p_stage text default null
)
returns uuid
language plpgsql security definer as $$
declare
  v_strategy_id uuid;
begin
  insert into strategies (user_id, name, brief, stage)
  values (p_user_id, p_name, p_brief, p_stage)
  returning id into v_strategy_id;
  return v_strategy_id;
end;
$$;
```

---

### `get_strategy_context`
Retorna o brief + últimas N mensagens de todas as conversas da estratégia.
Usado pelo Chairman ao retomar uma estratégia.

```sql
create or replace function get_strategy_context(
  p_strategy_id uuid,
  p_last_n_messages int default 20
)
returns table (
  strategy_name text,
  brief text,
  stage text,
  messages jsonb
)
language plpgsql security definer as $$
begin
  return query
  select
    s.name,
    s.brief,
    s.stage,
    coalesce(
      jsonb_agg(
        jsonb_build_object('role', m.role, 'content', m.content, 'created_at', m.created_at)
        order by m.created_at desc
      ) filter (where m.id is not null),
      '[]'::jsonb
    )
  from strategies s
  left join strategy_conversations sc on sc.strategy_id = s.id
  left join lateral (
    select * from strategy_messages
    where conversation_id = sc.id
    order by created_at desc
    limit p_last_n_messages
  ) m on true
  where s.id = p_strategy_id
    and s.user_id = auth.uid()
  group by s.name, s.brief, s.stage;
end;
$$;
```

---

### `update_strategy_brief`
Atualiza o brief da estratégia após cada conversa.
O Chairman gera um novo resumo compacto e este RPC persiste.

```sql
create or replace function update_strategy_brief(
  p_strategy_id uuid,
  p_brief text,
  p_stage text default null
)
returns void
language plpgsql security definer as $$
begin
  update strategies
  set brief = p_brief,
      stage = coalesce(p_stage, stage),
      updated_at = now()
  where id = p_strategy_id
    and user_id = auth.uid();
end;
$$;
```

---

## API Endpoints (Next.js App Router)

| método | endpoint | descrição |
|---|---|---|
| `GET` | `/api/strategies` | lista estratégias do usuário |
| `POST` | `/api/strategies` | cria nova estratégia |
| `GET` | `/api/strategies/:id` | retorna estratégia + contexto |
| `PATCH` | `/api/strategies/:id/brief` | atualiza brief após conversa |
| `POST` | `/api/strategies/:id/conversations` | inicia nova conversa na estratégia |
| `POST` | `/api/strategies/:id/conversations/:convId/messages` | salva mensagem |

---

## Terminal (MVP local — sem auth)

No script `chat.mjs`, estratégias são arquivos JSON em `scripts/estrategias/`.

### Estrutura do arquivo

```json
{
  "id": "uuid",
  "name": "Posicionamento Board I.A — Mar 2026",
  "brief": "Founder com 100 users pagantes, R$99,90/mês. Problema central: produto percebido como interface genérica de IA. Decisões tomadas: reposicionar para founders de PME que falam a língua do Vale. Framework aplicado: Wedge Strategy + Jobs to Be Done.",
  "stage": "2",
  "createdAt": "2026-03-26T00:00:00Z",
  "updatedAt": "2026-03-26T00:00:00Z",
  "conversations": [
    {
      "id": "uuid",
      "title": "Sessão 1 — Diagnóstico inicial",
      "createdAt": "2026-03-26T00:00:00Z",
      "messages": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }
  ]
}
```

### Tela inicial do terminal

```
╔════════════════════════════════════════╗
║       Curia Board — Terminal Chat      ║
╚════════════════════════════════════════╝

Estratégias salvas:
  [1] Posicionamento Board I.A — Mar 2026
  [2] Redução de Custo de Token — Mar 2026
  [N] Nova conversa

Escolha:
```

### Comportamento do Chairman

- Detecta substância estratégica na conversa
- Ao final, chama tool `propose_strategy(name, brief, stage)` se detectar plano
- Terminal pergunta: *"Quer salvar como estratégia? [S/n]"*
- Se aceitar: persiste arquivo, aparece na próxima abertura
- Se retomar estratégia: injeta `brief` + histórico no system prompt

---

## Chairman tools adicionais

```javascript
propose_strategy(name, brief, stage)
// Propõe salvar a conversa como estratégia
// name: nome sugerido pelo Chairman
// brief: resumo estratégico compacto (o que importa, não o que foi dito)
// stage: estágio da empresa (0-4)
```

---

## Nota de produto

Não chamamos de "projeto" — diferencia da linguagem do ChatGPT.
O termo é **estratégia**. O founder não organiza arquivos. Ele **conduz estratégias**.
