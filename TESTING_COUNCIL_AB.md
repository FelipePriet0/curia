# Guia de Teste Local — A/B do COUNCIL_MODE

Este doc é pra você rodar o A/B do Council na sua máquina, entender o que cada modo faz, e confirmar que a instrumentação (persistência + feedback) está colando dados no banco.

---

## 0. Contexto — o que estamos testando

Produto é um Board de conselheiros. Hoje o pipeline completo roda:

1. **Fase "Council"** — 6 conselheiros especializados em paralelo (Sonnet 4.6, ~700 tokens cada) produzem pareceres isolados.
2. **Fase "Synthesizer"** — gpt-5.4-mini lê os 6 pareceres + histórico + tools e produz a resposta final que o founder vê.

A dúvida honesta é: **a fase 1 (Council) está entregando ganho real, ou dá na mesma pular ela e deixar o Synthesizer direto?** 6 chamadas Sonnet paralelas custam dinheiro e latência. Se não agregam, sai.

Pra responder isso sem achismo, criei a feature flag `COUNCIL_MODE` com 3 valores:

| Modo | O que faz | Por que existe |
|---|---|---|
| `full` | Pipeline completo: 6 conselheiros reais → synthesizer com esses pareceres. | Baseline atual. |
| `direct` | Pula a fase 1. Synthesizer recebe um "guia interno" (checklist das 6 lentes) e gera sozinho. | Teste honesto: sem committee, mas com orientação explícita pras mesmas lentes. Se `direct ≈ full` em qualidade, o committee não está pagando o custo. |
| `synthetic_council` | Fake committee. Emite eventos visuais de pareceres mas **não chama Haiku/Sonnet**. Synthesizer recebe exatamente o mesmo input de `direct`. | Isola o efeito "UX teatro" do efeito "modelo realmente pensou". Se `synthetic_council > direct` em feedback mas `= direct` em proxies comportamentais, a diferença é percepção, não conteúdo. |

Esse é o ponto central: sem os 3 modos, você mede "com committee vs. sem nada" — confundido. Com os 3, isola **conteúdo** (full vs direct) e **percepção** (synthetic_council vs direct).

---

## 1. Setup local

### 1.1 Variáveis de ambiente

Edite `app/.env.local` e adicione:

```env
# Habilita sorteio A/B sticky por usuário
COUNCIL_AB_SAMPLING=true

# Pesos do sorteio (opcional, default é 1:1:1)
COUNCIL_AB_WEIGHTS=full:1,direct:1,synthetic_council:1

# Modo fixo (usado quando COUNCIL_AB_SAMPLING=false)
COUNCIL_MODE=full
```

### 1.2 Garantir migration aplicada

```bash
cd app
npx drizzle-kit migrate   # ou o comando que você usa
```

Checar que as tabelas existem:

```sql
\d messages              -- deve ter coluna council_mode
\d message_feedbacks     -- tabela nova
\d company_memory        -- tabela nova (não usada ainda)
```

### 1.3 Subir o app

```bash
cd app
npm run dev
```

---

## 2. Os 3 testes

Faça todos eles na mesma sessão, em janelas anônimas diferentes se quiser forçar `userId` diferente (o sorteio é sticky por usuário, então o mesmo user vai cair sempre no mesmo modo).

### Teste A — Modo `full` (baseline, committee real)

**Como forçar:**
```env
COUNCIL_AB_SAMPLING=false
COUNCIL_MODE=full
```
Reinicia o `npm run dev`.

**O que a infra faz:**
1. Você manda "Meu crescimento travou"
2. Backend dispara 6 chamadas **paralelas** ao Claude Sonnet 4.6 (os conselheiros).
3. Cada conselheiro retorna ~700 tokens em ~3-6s.
4. Os 6 pareceres são concatenados num bloco `<council_opinions>` e injetados no contexto do synthesizer.
5. Synthesizer (gpt-5.4-mini + tools de search) lê tudo e produz a resposta final que stream pro frontend.
6. Frontend mostra **eventos reais** dos conselheiros enquanto eles produzem (se a UI do DeliberationTimeline estiver ligada).

**Custo por request:** 6 × Sonnet + 1 × gpt-5.4-mini + tools. O mais caro e o mais lento.

**Por que testar:** é o produto atual. Se a qualidade cair no `direct`, você vai querer voltar pra cá. Se a qualidade for igual, você economiza ~60% do custo de inferência do caminho principal.

**O que observar:**
- Tempo até primeiro token do synthesizer (~4-8s hoje)
- Latência total da resposta
- Qualidade percebida da resposta final
- No banco: `SELECT council_mode FROM messages WHERE role='assistant' ORDER BY created_at DESC LIMIT 1;` deve devolver `full`.

---

### Teste B — Modo `direct` (sem committee, só synthesizer)

**Como forçar:**
```env
COUNCIL_AB_SAMPLING=false
COUNCIL_MODE=direct
```
Reinicia.

**O que a infra faz:**
1. Você manda a mesma pergunta.
2. Backend **pula a fase 1 inteira**. Não chama nenhum Sonnet.
3. Em vez do bloco `<council_opinions>`, injeta o `buildDirectModeGuide()` — um checklist das 6 lentes (Wald, Herbert Simon, Patrick Bet-David, etc.) que força o synthesizer a aplicar internamente os mesmos ângulos.
4. Synthesizer gera a resposta direto.

**Custo por request:** 1 × gpt-5.4-mini + tools. ~60-70% mais barato que `full`.

**Por que testar:** é o cenário "committee não paga o custo". Se o synthesizer, orientado corretamente, produz resposta equivalente sem os 6 pareceres prévios, a arquitetura de committee vira overhead.

**Diferença visual pro usuário:** não aparecem eventos de conselheiros na timeline. O stream vai direto pro synthesizer. Isso por si só pode **parecer** menos sofisticado — por isso o teste C existe.

**O que observar:**
- Latência total deve cair drasticamente (~40-50%).
- `council_mode` na mensagem salva = `direct`.
- Resposta ainda precisa cobrir diagnóstico, problema central, riscos, framework, recomendações (guardrails continuam valendo).

---

### Teste C — Modo `synthetic_council` (committee teatral)

**Como forçar:**
```env
COUNCIL_AB_SAMPLING=false
COUNCIL_MODE=synthetic_council
```
Reinicia.

**O que a infra faz:**
1. Você manda a pergunta.
2. Backend roda `runSyntheticCouncilPhase()`: **emite eventos de conselheiros fake** (com mensagens placeholder tipo "Conselheiro Wald está analisando…") mas **não chama nenhum modelo**.
3. Synthesizer recebe o **mesmo input do modo `direct`** (o checklist das 6 lentes, sem pareceres reais).
4. Stream final roda igual.

**Custo por request:** igual `direct`. 1 × gpt-5.4-mini.

**Por que testar:** isolar o efeito da **percepção de cerimônia**. Se founders avaliam melhor `synthetic_council` do que `direct` sendo que o conteúdo é literalmente o mesmo, a melhoria é teatro de UX, não conteúdo. Isso é uma descoberta valiosa — você pode entregar a mesma qualidade com UI melhor em vez de gastar 6 Sonnets.

**Diferença visual pro usuário:** **indistinguível do `full` pelo frontend** (aparecem os eventos de conselheiros). Só o backend sabe que é fake.

**O que observar:**
- Latência entre `full` e `direct` (tem o "atraso performático" dos eventos fake).
- `council_mode = synthetic_council` no banco.
- **Crucial:** se os feedbacks de `synthetic_council` forem consistentemente melhores que os de `direct`, você tem evidência de que a cerimônia carrega valor. Se forem iguais, cerimônia não paga o frame-rate.

---

## 3. A/B rodando sozinho

Depois de validar manualmente os 3, ligue o sorteio:

```env
COUNCIL_AB_SAMPLING=true
```

A partir daí, cada `userId` cai num modo fixo (sticky via FNV-1a). Você pode verificar qual modo um user está pegando consultando o banco depois da primeira mensagem dele:

```sql
SELECT c.user_id, m.council_mode, count(*)
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.role = 'assistant'
GROUP BY c.user_id, m.council_mode;
```

Cada `user_id` deve ter **um único** `council_mode` associado. Se aparecer o mesmo user com 2 modos, o hash quebrou — investigar.

---

## 4. Validando o widget de feedback

### 4.1 Smoke test manual

1. Mandar uma mensagem qualquer no `/board`.
2. Aguardar a resposta do assistant.
3. Abaixo da bolha, devem aparecer 👍 👎 + link "avaliar em detalhe".
4. Clicar 👍 → envia imediatamente (1 clique).
5. Clicar 👎 → abre painel detalhado (5 estrelas geral + 4 dimensões + textarea).
6. Preencher, clicar "Enviar feedback".
7. Widget colapsa mostrando "Feedback registrado — Reavaliar".

### 4.2 Confirmar no banco

```sql
SELECT
  f.id,
  f.message_id,
  f.thumbs,
  f.rating,
  f.dimensions,
  f.comment,
  m.council_mode
FROM message_feedbacks f
JOIN messages m ON m.id = f.message_id
ORDER BY f.created_at DESC
LIMIT 10;
```

Espera ver:
- `thumbs` = 'up' ou 'down'
- `rating` ∈ {1..5} ou NULL
- `dimensions` = jsonb com chaves em `utility, rigor, generic, actionable` (1..5)
- `council_mode` já vinculado (é pra isso que existe tudo)

### 4.3 Teste de ownership (garantir que feedback não vaza)

Tentar mandar feedback pra uma mensagem de **outra conversa que não é sua**:

```bash
curl -X POST http://localhost:3000/api/messages/<id-de-outro-user>/feedback \
  -H 'Content-Type: application/json' \
  --cookie "<seu-cookie-de-sessao>" \
  -d '{"thumbs":"up"}'
```

Resposta esperada: `404 Mensagem não encontrada`. O join com `conversations.userId` barra o acesso cruzado.

### 4.4 Teste de validação

```bash
# rating fora do range
curl ... -d '{"rating":8}'                 # → 400

# feedback vazio (sem thumbs nem rating)
curl ... -d '{"comment":"blah"}'           # → 400

# feedback em mensagem do user (não do assistant)
curl ... /api/messages/<msg-user-id>/feedback -d '{"thumbs":"up"}'  # → 400
```

---

## 5. Análise do A/B (query base)

Depois de acumular feedback de múltiplos usuários em modos diferentes:

```sql
SELECT
  m.council_mode,
  count(*) AS n_feedbacks,
  round(avg(f.rating)::numeric, 2) AS avg_rating,
  round(avg((f.dimensions->>'utility')::int)::numeric, 2)     AS avg_utility,
  round(avg((f.dimensions->>'rigor')::int)::numeric, 2)       AS avg_rigor,
  round(avg((f.dimensions->>'generic')::int)::numeric, 2)     AS avg_specific,
  round(avg((f.dimensions->>'actionable')::int)::numeric, 2)  AS avg_actionable,
  sum(case when f.thumbs = 'up'   then 1 else 0 end) AS thumbs_up,
  sum(case when f.thumbs = 'down' then 1 else 0 end) AS thumbs_down
FROM message_feedbacks f
JOIN messages m ON m.id = f.message_id
WHERE m.council_mode IS NOT NULL
GROUP BY m.council_mode;
```

Interpretações possíveis:

| Observação | Conclusão provável |
|---|---|
| `full ≈ direct ≈ synthetic_council` em tudo | Committee não agrega. Desliga a fase 1, economiza 60% do custo. |
| `full > direct` e `full ≈ synthetic_council` | Committee **aparenta** ser bom por cerimônia, não por conteúdo. Investigar. |
| `full > direct` e `full > synthetic_council` | Committee real agrega conteúdo. Mantém. |
| `synthetic_council > direct` em `rating`, mas `= direct` em `utility/actionable` | Melhoria é percepção. Entrega UX teatral no `direct`. |
| N baixo (< 30 por modo) | Ignore o resultado. Precisa de mais volume antes de decidir. |

---

## 6. Troubleshooting

**Feedback retorna 400 "thumbs inválido":** mandou algo que não é 'up' ou 'down'.

**Feedback retorna 400 "Feedback só é aceito em respostas do assistant":** você tentou avaliar uma mensagem do user. O widget só deveria aparecer em bolhas do assistant — se apareceu em user, bug de UI.

**`council_mode` está NULL em mensagens novas:** verificar que o `streamBoardEvents` está recebendo o `councilModeOverride` e que o insert final em `messages` está passando `councilMode`. Ver `app/src/app/api/conversations/[id]/messages/route.ts` linhas 229 e 272.

**Todos os users caem no mesmo modo:** `COUNCIL_AB_SAMPLING` não está `true`, ou `COUNCIL_AB_WEIGHTS` está zerado pros outros modos.

**Timeline de conselheiros não aparece em nenhum modo:** componente `DeliberationTimeline` pode estar desligado/não renderizado. Independente do modo, `full` e `synthetic_council` emitem eventos; `direct` não.

---

## 7. Ordem sugerida pra sua sessão de teste

1. Rodar Teste A (`full`) — anotar latência e qualidade subjetiva.
2. Trocar env pra `direct`, rodar Teste B — comparar latência e qualidade.
3. Trocar env pra `synthetic_council`, rodar Teste C — observar se UX parece com `full`.
4. Mandar feedback detalhado em cada um (pra ter uma linha de cada modo no banco).
5. Rodar a query da seção 5 e confirmar que os 3 modos aparecem com dados.
6. Ligar `COUNCIL_AB_SAMPLING=true` e deixar rodando em uso real.
