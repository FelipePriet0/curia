# Como o Projeto Funciona — Visão Técnica

> Este documento é o mapa completo do projeto Curia, do ponto de vista técnico. Cobre a arquitetura, o banco de dados, o loop de revisão, e — mais importante — como a LLM funciona dentro do sistema e o que guia cada conversa.

---

## A Ideia Geral

O projeto é uma aplicação web. Acessa pelo navegador, como qualquer site. Por baixo do capô, há quatro grandes partes trabalhando juntas:

1. **O que o usuário vê** — a interface (telas, botões, o chat)
2. **O servidor** — o que processa as ações do usuário
3. **O banco de dados** — onde tudo fica guardado
4. **A IA** — quem de fato "pensa" e responde as mensagens

---

## As Quatro Peças do Sistema

### 1. Interface (Frontend)

É tudo que o usuário vê e interage:
- A **landing page** (página inicial com a apresentação da Curia)
- A tela de **login e cadastro**
- O **board** — a área principal onde acontece o chat com a Curia

A interface é construída com **Next.js** e **React**. O visual é feito com **Tailwind CSS**.

Quando o usuário escreve uma mensagem e clica em enviar, a interface manda esse texto para o servidor e começa a receber a resposta em tempo real — letra por letra, como se a Curia estivesse digitando.

Depois que uma resposta com plano estratégico é entregue, **botões de agendamento aparecem automaticamente** abaixo da mensagem — o usuário escolhe revisar em 7, 14 ou 30 dias e o sistema salva esse compromisso.

---

### 2. Servidor (Backend)

O servidor é invisível para o usuário, mas faz o trabalho pesado. Ele:

- Recebe a mensagem enviada pelo usuário
- Salva essa mensagem no banco de dados
- Busca o histórico da conversa
- Verifica se é uma **sessão de revisão** (e se sim, busca o plano vinculado)
- Monta o contexto para a IA (instruções + histórico + contexto do plano, se houver)
- Envia tudo para a IA e recebe a resposta em streaming
- Salva a resposta no banco
- Registra eventos de métricas

O servidor usa a mesma tecnologia do frontend (Next.js), o que simplifica a estrutura do projeto.

---

### 3. Banco de Dados

Hospedado no **Supabase** (PostgreSQL gerenciado).

| Tabela | O que guarda |
|---|---|
| `users` | Os usuários cadastrados |
| `companies` | Informações opcionais sobre a empresa do usuário |
| `conversations` | Cada conversa — tipo: `regular`, `plan_origin` ou `plan_review` |
| `messages` | Cada mensagem dentro de cada conversa |
| `plans` | Planos estratégicos com data de revisão, métricas e status |
| `plan_notifications` | Histórico de notificações de revisão enviadas |
| `events` | Registros de ações do usuário (para métricas de produto) |

Cada usuário só acessa os próprios dados via **Row-Level Security** — camada de segurança no próprio banco que bloqueia qualquer acesso cruzado.

---

### 4. A IA (LLM)

A IA usada é o **Claude Opus 4.5**, da Anthropic. Há fallback para o **GPT-4o** da OpenAI.

O que faz a Curia ser a Curia — e não um chatbot genérico — é o **prompt de sistema**. Mais de 300 linhas que definem:

- O papel que a IA deve assumir (conselho estratégico comprimido)
- 17 frameworks estratégicos que ela conhece e aplica
- Um pipeline de raciocínio interno com 12 etapas
- O formato obrigatório de resposta
- O bloco de contexto do plano anterior (nas sessões de revisão)

Esse prompt é montado toda vez que uma mensagem é enviada, junto com o histórico da conversa. A IA recebe tudo isso de uma vez e gera a resposta.

---

## Como a LLM Funciona — Regras, Prompt e Fluxo de Decisão

Esta é a seção mais importante para entender o produto. Aqui fica documentado **o que está dentro da cabeça da Curia** e como ela toma decisões.

---

### O Prompt Como uma Configuração

O prompt pode ser lido como um arquivo de configuração da IA. Em YAML, ficaria assim:

```yaml
# Curia Board — Configuração da LLM
identity:
  nome: Curia Board
  papel: Conselho estratégico virtual para fundadores de PMEs
  não_é: chatbot genérico, assistente, consultor acadêmico
  é: board de conselheiros comprimido em uma voz

persona:
  combina:
    - Sócio de McKinsey (profundidade estratégica)
    - COO que construiu empresas do zero (sabedoria operacional)
    - CFO que geriu P&Ls reais (clareza financeira)
  pensa_como: alguém com 20 anos de experiência em campo
  referências: Rumelt, Collins, Drucker, Grove, Christensen, Porter, Gerber, Goldratt, Munger

contexto_injetado:
  empresa:
    campos: [nome, setor, modelo_negócio, stage, equipe, receita_mensal, cliente_alvo, problema_principal]
    coleta: natural dentro da conversa, máx 1-2 perguntas por vez
  plano_anterior:  # só injetado em sessões de revisão
    campos: [título, diagnóstico, próximos_passos, métricas, framework, data_criação]
    instrução: não começar do zero, conduzir revisão com memória

idioma:
  regra: responder sempre no idioma do usuário
  padrão: português

pipeline_raciocínio:
  execução: interno (usuário não vê)
  blocos:
    - BLOCO_1_DIAGNÓSTICO:
        step_1: identificar problema real vs sintoma
        step_2: classificar estágio da empresa (0-4)
        step_3: ler condições de mercado
    - BLOCO_2_PERFORMANCE:
        step_4: saúde financeira (margens, caixa, unit economics)
        step_5: alocação de capital
        step_6: riscos estratégicos ocultos
    - BLOCO_3_ESTRATÉGIA:
        step_7: direção estratégica (onde competir e onde NÃO)
        step_8: planejamento estratégico (objetivo + iniciativas + métricas + prazo)
        step_9: clarificação de prioridade (a UMA coisa que move o jogo)
    - BLOCO_4_GOVERNANÇA:
        step_10: ritmo de gestão (weekly/monthly/quarterly)
        step_11: diagnóstico de pessoas (E-Myth, gargalos)
        step_12: perguntas difíceis

frameworks_disponíveis:
  estratégia_e_posicionamento:
    - Good Strategy / Bad Strategy (Rumelt)
    - Hedgehog Concept (Collins)
    - Jobs to Be Done (Christensen)
    - Blue Ocean Strategy (Kim & Mauborgne)
    - Strategic Inflection Points (Grove)
    - Porter's Five Forces
  crescimento_e_execução:
    - Flywheel (Collins)
    - Lean Startup (Ries)
    - Crossing the Chasm (Moore)
    - Product-Market Fit (Andreessen)
    - North Star Metric
  financeiro:
    - Unit Economics (LTV/CAC)
    - Capital Allocation (Buffett/Munger)
    - Break-even Analysis
    - Cash Conversion Cycle
  pessoas_e_organização:
    - First Who Then What (Collins)
    - Radical Candor (Scott)
    - Org Design Principles
    - The E-Myth (Gerber)
  operações:
    - Theory of Constraints (Goldratt)
    - 80/20 (Pareto)
    - Lean Operations
  marketing_e_vendas:
    - Revenue Architecture
    - AARRR (Pirate Metrics)
    - Positioning (Ries & Trout)
    - Brand as Moat

quando_propor_plano:
  condição_a: diagnóstico_claro AND problema_central_claro
  condição_b: contexto_mínimo_preenchido OR proxies_disponíveis
  condição_c: fundador_sinaliza_prontidão  # "fechado", "vamos nessa", "manda o plano"
  limite_fricção: máximo 2 perguntas objetivas antes de propor plano preliminar

proibições:
  - dar conselho genérico que serve para qualquer empresa
  - dizer "depende" sem explicar de quê
  - evitar verdades duras por educação
  - recomendar tudo ao mesmo tempo
  - usar jargão sem explicar
  - ignorar o contexto específico
  - dar conselho fora do estágio da empresa
  - omitir seções obrigatórias da resposta
```

---

### Formato Obrigatório de Resposta

Toda resposta da Curia segue esta estrutura. Seções que genuinamente não se aplicam podem ser omitidas com elegância, mas a maioria é sempre presente:

```
### 🔍 Diagnóstico
O que está acontecendo de verdade. Tipo do problema + estágio da empresa.

### 🎯 Problema Central
A causa raiz — não o sintoma. Por que este é o real problema.

### ⚠️ Riscos Estratégicos
O que acontece se nada mudar. Direto. Quantificado quando possível.

### 📊 Leitura de Performance
Se há dados: analisa unit economics, margens, caixa.
Se não há: pede os dados e explica por que importam.

### 📐 Framework Aplicado
Qual framework se aplica E POR QUÊ — não é name-dropping, é diagnóstico.

### 💡 Recomendações Estratégicas
3 a 5 ações. Cada uma com: o que fazer + por que importa + prioridade.
Ordenadas por impacto, não por facilidade.

### ▶️ Próximos Passos (7–14 dias)
Ações concretas o suficiente para executar sem perguntar "mas como?".

### ❓ Perguntas Difíceis
3 perguntas que desafiam o raciocínio do fundador.
Desconfortáveis mas reveladoras.

### 📅 Checagem do Plano
[OBRIGATÓRIO quando há Próximos Passos]
Posiciona a revisão como parte do processo — não sugestão opcional.
Sugere data concreta. Fecha com "Quer marcar agora?"
```

---

### Como o Contexto é Montado (por mensagem)

Cada vez que o usuário envia uma mensagem, o servidor monta este pacote para a IA:

```
┌────────────────────────────────────────────────────┐
│  SYSTEM PROMPT                                      │
│                                                     │
│  1. Identidade e persona da Curia                  │
│  2. [Contexto da empresa, se disponível]           │
│  3. [Contexto do plano anterior, se revisão]       │
│  4. Base de conhecimento: 17 frameworks            │
│  5. Pipeline de raciocínio: 12 etapas              │
│  6. Regras de comportamento e formato              │
│                                                     │
├────────────────────────────────────────────────────┤
│  HISTÓRICO DA CONVERSA                             │
│                                                     │
│  [user]: primeira mensagem                         │
│  [assistant]: primeira resposta                    │
│  [user]: segunda mensagem                          │
│  [assistant]: segunda resposta                     │
│  ...                                               │
│  [user]: mensagem atual ← aqui entra a nova        │
└────────────────────────────────────────────────────┘
```

A IA recebe isso de uma vez e gera a resposta. **Não há memória mágica** — tudo que a Curia "lembra" está no histórico que é enviado a cada mensagem.

Por isso os **Planos** existem como entidade persistente: quando uma sessão de revisão começa, o servidor busca o plano do banco e injeta no system prompt — a Curia não "lembra" por conta própria, mas o sistema garante que ela receba o contexto certo.

---

### Estágios de Empresa (Como a Curia Classifica)

A IA classifica internamente o estágio antes de responder. O conselho muda radicalmente por estágio:

| Stage | Nome | Característica | Conselho Típico |
|---|---|---|---|
| 0 | Sobrevivência | Caixa queimando, sem caminho claro | Corte, foco, velocidade |
| 1 | Product-Market Fit | Buscando demanda repetível | Experimentos, validação, não escale ainda |
| 2 | Crescimento | PMF encontrado, escalando | Distribuição, processos, CAC/LTV |
| 3 | Escala | Sistematizando, construindo infra | Org design, delegação, métricas |
| 4 | Maturidade | Otimizando, defendendo, diversificando | Moats, expansão, eficiência |

---

## Como uma Mensagem Percorre o Sistema

```
Usuário digita e envia mensagem
        ↓
Interface envia o texto para o servidor
        ↓
Servidor salva a mensagem no banco
        ↓
Servidor verifica se é evento de métrica
(primeira mensagem? pedido de plano?)
        ↓
Servidor busca histórico da conversa no banco
        ↓
[Se é sessão de revisão]
Servidor busca plano vinculado no banco
        ↓
Servidor monta o prompt completo
(identidade + empresa + plano? + frameworks + pipeline + regras + histórico)
        ↓
Servidor envia para a IA (Claude Opus)
        ↓
IA executa pipeline de raciocínio interno (12 etapas)
        ↓
IA gera resposta no formato estruturado
        ↓
Resposta flui em tempo real para o usuário (streaming)
        ↓
Servidor salva a resposta completa no banco
        ↓
Servidor verifica se a resposta entregou valor
(tem diagnóstico? tem problema central?)
        ↓
Registra evento de métrica se sim
        ↓
[Se resposta tem Próximos Passos]
Interface mostra botões de agendamento de revisão
        ↓
[Usuário clica "Em 14 dias"]
Plano salvo no banco com data de revisão
Conversa marcada como origem do plano
```

---

## O Loop de Revisão — Como Funciona

A Curia opera em ciclos. Todo ciclo começa numa conversa e termina com uma data de checagem marcada.

```
Conversa → Plano + Métricas → Agendamento → Notificação → Revisão → Novo Ciclo
```

### Tipos de Conversa

| Tipo | `conversation_type` | O que é |
|---|---|---|
| Conversa regular | `regular` | Sessão estratégica comum |
| Origem de plano | `plan_origin` | Conversa onde um plano foi salvo |
| Sessão de revisão | `plan_review` | Checagem vinculada a um plano existente |

### Ciclo de vida de um Plano

```
[Plano criado] → status: active
      ↓
[Data de revisão chegou] → banner aparece no board
      ↓
[Usuário inicia revisão] → nova conversa plan_review criada
      ↓
[Revisão conduzida com contexto do plano] → status: reviewed
      ↓
[Novo plano gerado] → novo ciclo começa
```

### O Que o Banco Guarda em Cada Plano

```
Plan {
  título              → "Plano Comercial — Março 2026"
  summary             → Diagnóstico + Problema Central extraídos da resposta
  next_steps          → Bloco "Próximos Passos" extraído da resposta
  metrics             → Métricas acordadas (JSON)
  framework_used      → Framework aplicado naquela sessão
  review_date         → Data agendada para revisão
  status              → active | reviewed | archived
  origin_conversation → ID da conversa onde o plano foi gerado
}
```

### Interface — O Que o Usuário Vê

**Sidebar:**
- Seção "Planos Ativos" com countdown de dias até revisão
- Indicador visual quando revisão está atrasada ou é hoje

**Banner no board:**
- Aparece quando `review_date <= hoje` e `status === active`
- Mostra: título do plano + dias de atraso + botão "Iniciar"

**Abaixo da última resposta com plano:**
- Botões: "Em 7 dias" / "Em 14 dias" / "Em 30 dias"
- Após clicar: mensagem de confirmação

**Sessão de revisão (empty state):**
- Instrução clara: "A Curia já tem o contexto. Conte o que avançou."
- Botão "Iniciar revisão" que dispara mensagem pré-definida

---

## Autenticação — Como o Login Funciona

O sistema de autenticação é gerenciado pelo **Supabase Auth**. O usuário pode entrar com:

- Email e senha
- Conta Google (OAuth)

Após o login, o Supabase gera um token seguro que fica armazenado em um cookie no navegador. Toda vez que o usuário tenta acessar uma página protegida (como `/board`), um middleware verifica se esse token existe e é válido. Se não estiver logado, é redirecionado para o login.

---

## Métricas — O Que o Sistema Mede

| Evento | O que captura | Objetivo |
|---|---|---|
| `activation_started` | Primeira mensagem enviada (qualquer conversa) | Adoção do produto |
| `conversation_started` | Primeira mensagem em uma conversa específica | Engajamento |
| `flow_progressed` | Resposta tem Diagnóstico + Problema Central | A Curia entregou valor |
| `plan_requested` | Usuário pediu plano explicitamente | Intenção de agir |
| `plan_created` | Plano foi salvo com data de revisão | Comprometimento com ação |
| `review_scheduled` | Data de revisão agendada | Accountability |
| `review_completed` | Sessão de revisão iniciada | Loop fechado |

**A métrica que importa:** `plan_created → review_completed`. Se esse ciclo fecha, a Curia prova que gera resultado contínuo, não só conselho pontual.

---

## Estrutura de Pastas (Simplificada)

```
aiboard/
├── app/                        # O código da aplicação
│   └── src/
│       ├── app/                # Páginas e rotas da aplicação
│       │   ├── page.tsx        # Landing page
│       │   ├── (auth)/         # Páginas de login e cadastro
│       │   ├── (app)/board/    # A área do chat (protegida)
│       │   └── api/
│       │       ├── conversations/    # CRUD de conversas + mensagens
│       │       └── plans/            # CRUD de planos + início de revisão
│       │
│       ├── components/
│       │   ├── landing/        # Componentes da landing page
│       │   ├── auth/           # Formulário de login/cadastro
│       │   ├── board/          # Chat, mensagens, lista de conversas,
│       │   │                   # PlanScheduler, ReviewBanner
│       │   └── ui/             # Botões, inputs, etc.
│       │
│       ├── lib/
│       │   ├── llm/            # Prompt da Curia + cliente de streaming
│       │   ├── metrics/        # Detecção de eventos + registro
│       │   └── supabase/       # Conexão com o banco
│       │
│       └── db/migrations/      # 001 schema inicial, 002 events, 003 plans
│
├── aiboardobsidian/            # Esta documentação
└── supabase_mcp/               # Ferramenta de administração do banco
```

---

## Resumo em Uma Frase por Peça

| Peça | Tecnologia | Função |
|---|---|---|
| Interface | Next.js + React + Tailwind | O que o usuário vê e usa |
| Servidor | Next.js API Routes | Processa as ações, orquestra tudo |
| Banco de Dados | Supabase (PostgreSQL) | Guarda conversas, planos e mensagens |
| IA | Claude Opus 4.5 (Anthropic) | Gera as respostas estratégicas |
| Auth | Supabase Auth + Google OAuth | Controla quem pode acessar o quê |
| Métricas | Tabela de eventos + detectors | Mede se o produto está entregando valor |
| Planos | Tabela `plans` + API `/api/plans` | Persiste planos com data de revisão |
| Revisões | Conversas `plan_review` | Sessões com memória do plano original |
| Notificações | Banner in-app | Avisa quando revisão está pendente |
