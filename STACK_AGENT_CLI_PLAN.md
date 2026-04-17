# Curia — Plano de Stack Self-Hosted para Agent CLI

## Objetivo

Construir uma stack própria, barata e operável via terminal para que o projeto possa ser desenvolvido, migrado e mantido usando Agent Code CLI como interface principal de trabalho.

O foco desta fase nao e montar uma infra perfeita. O foco e:

- sair da dependencia estrutural do Supabase
- manter o produto iteravel
- permitir que agentes operem codigo, banco, deploy e manutencao pelo terminal
- caber no teto inicial de custo de `US$ 30/mes`

## Principio Operacional

Tudo o que for critico para o produto deve poder ser feito por CLI:

- editar codigo
- rodar frontend e backend
- executar migracoes
- acessar Postgres
- subir e derrubar containers
- inspecionar logs
- fazer deploy
- validar ambiente
- operar Git
- restaurar ambiente

Se uma tarefa essencial depender de painel web de terceiro, essa tarefa deve ser reduzida ou substituida por uma alternativa CLI-first.

## Metodo de Execucao

Nao vamos executar a migracao em bloco unico.

Vamos trabalhar por etapas curtas com o seguinte ciclo:

1. implementar uma fatia pequena
2. parar
3. testar localmente
4. corrigir o que falhar
5. liberar a proxima fatia

Esse projeto mexe ao mesmo tempo em:

- infra
- banco
- auth
- middleware
- rotas API
- frontend

Por isso, o metodo oficial de execucao sera por checkpoints.

Cada checkpoint precisa ter:

- objetivo tecnico claro
- escopo limitado
- criterio de pronto
- teste minimo obrigatorio

Nenhuma fase grande deve avancar sem validacao da fase anterior.

## Stack Alvo

### Aplicacao

- `Next.js 16` mantendo App Router e rotas `/api`
- `Node.js 22 LTS`
- `pnpm`

### Banco e dados

- `PostgreSQL 16`
- `Drizzle ORM`
- `Drizzle Kit` para migracoes

### Auth e sessao

- `Better Auth`
- sessoes por cookie seguro
- tabela propria `users`

### Infra

- `Ubuntu 24.04 LTS`
- `Docker`
- `Docker Compose`
- `Caddy` para reverse proxy e HTTPS
- `Cloudflare` para DNS

### Email

- Provedor externo barato ou gratuito no inicio
- prioridade atual: `Resend`

### Observabilidade minima

- logs via `docker compose logs`
- healthchecks por container
- `Uptime Kuma` e opcional

## Restricao de Custo

Teto inicial: `US$ 30/mes`

### Composicao recomendada para inicio

- VPS Hetzner `CPX31`
- Cloudflare plano free
- Caddy local
- Postgres local
- sem backup externo pago nesta fase

### Regra desta fase

Podemos ficar sem backup externo pago, mas nao sem rotina minima de recuperacao.

Minimo obrigatorio:

- dump diario do Postgres em disco local
- retencao curta de `7 dias`
- snapshot manual antes de mudancas grandes

Risco aceito nesta fase:

- se a VPS morrer de forma total, existe risco de perda de dados recentes

## Arquitetura Alvo da VPS

### Containers

- `caddy`
- `app`
- `postgres`
- `cron` ou job simples para dump local

### Fluxo de rede

- `caddy` recebe trafego publico
- `caddy` encaminha para `app`
- `app` fala com `postgres` via rede interna do Docker
- `postgres` nao fica exposto publicamente

### Volumes

- volume persistente para `postgres`
- volume persistente para dumps locais

## Estado Atual do Projeto

Hoje o projeto ja e um monolito full-stack em Next.js.

O Supabase esta acoplado principalmente em:

- autenticacao
- sessao
- middleware
- acesso ao banco nas rotas API
- uso de `auth.users` nas foreign keys do schema

Arquivos mais relevantes:

- [app/src/middleware.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/middleware.ts:1)
- [app/src/lib/supabase/server.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/supabase/server.ts:1)
- [app/src/lib/supabase/client.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/supabase/client.ts:1)
- [app/src/lib/supabase/admin.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/supabase/admin.ts:1)
- [app/src/app/api/conversations/[id]/messages/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/conversations/[id]/messages/route.ts:1)
- [app/src/db/migrations/001_initial.sql](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/migrations/001_initial.sql:1)

## Decisoes de Arquitetura

### 1. Manter monolito

Nao vamos separar backend em outro servico agora.

Motivo:

- reduz custo
- reduz superficie operacional
- combina com a arquitetura atual
- facilita operacao por Agent CLI

### 2. Banco principal: Postgres

Nao vamos trocar o modelo de dados.

Motivo:

- o schema atual ja e relacional
- ja existe SQL e migracoes no projeto
- os casos de uso atuais se encaixam bem em Postgres

### 3. Sair de `auth.users`

Vamos criar uma tabela propria `users`.

Motivo:

- remover dependencia estrutural do Supabase
- permitir auth local e sessao propria
- consolidar ownership de dados

### 4. Camada de acesso ao banco

Nao vamos continuar chamando provider direto nas rotas.

Vamos introduzir:

- `src/db/schema`
- `src/db/client`
- `src/db/repositories/*`

Motivo:

- reduzir acoplamento
- facilitar manutencao pelos agentes
- facilitar testes e futuras migracoes

## Escopo Tecnico da Migracao

### Parte A — Infra e runtime

- adicionar Dockerfile da aplicacao
- adicionar `docker-compose.yml`
- adicionar configuracao do Caddy
- adicionar `.env.example` completo da stack nova

### Parte B — Banco novo

- modelar schema em Drizzle
- criar tabela `users`
- recriar entidades atuais:
  - `companies`
  - `conversations`
  - `messages`
  - `events`
  - `plans`
  - `strategies`
  - `shared_conversations`
  - `user_terms_acceptances`

### Parte C — Auth nova

- integrar `Better Auth`
- login por email e senha
- reset de senha
- sessao por cookie
- opcionalmente Google OAuth depois

### Parte D — Port de API

- substituir uso de Supabase nas rotas por repositorios locais
- manter contratos HTTP atuais sempre que possivel

### Parte E — Frontend

- remover chamadas diretas ao Supabase no browser
- mover fluxo de auth para API propria
- ajustar gating de onboarding

### Parte F — Deploy e operacao

- deploy por SSH
- comandos padrao de operacao
- logs, restart, rollback simples

## Fases de Execucao

## Fase 0 — Fundacao de Agent CLI

Objetivo:

Garantir que o projeto possa ser operado de forma previsivel por terminal.

Entregas:

- documento de arquitetura e plano
- padrao de comandos operacionais
- convencoes de ambiente

Definicao de pronto:

- existe um plano versionado no repo
- existe uma direcao tecnica fechada para a stack

## Fase 1 — Infra local e containerizacao

Objetivo:

Rodar o app atual em ambiente controlado, preparando a migracao.

Entregas:

- `Dockerfile`
- `docker-compose.yml`
- Postgres local em container
- rede interna entre app e banco

Definicao de pronto:

- `docker compose up` sobe o ambiente
- app responde localmente
- Postgres responde localmente
- o ambiente pode ser parado e retomado sem perda acidental de configuracao

## Fase 2 — Camada de banco propria

Objetivo:

Introduzir Drizzle e o schema novo sem trocar todo o app de uma vez.

Entregas:

- schema Drizzle
- migrations novas
- cliente de banco
- repositorios iniciais

Definicao de pronto:

- schema sobe em Postgres local
- conseguimos ler e escrever em tabelas chave sem Supabase SDK
- migracoes podem ser executadas e reaplicadas de forma previsivel

## Fase 3 — Auth local

Objetivo:

Remover dependencia do Supabase Auth.

Entregas:

- `Better Auth`
- tabela `users`
- login
- signup
- reset password
- middleware novo

Definicao de pronto:

- usuario autentica sem Supabase
- cookies e sessao funcionam
- `/board` e `/onboarding` continuam protegidos
- fluxo minimo de login e logout passa em teste manual

## Fase 4 — Port das rotas API

Objetivo:

Substituir Supabase por Postgres + repositorios nas rotas do produto.

Entregas:

- conversations
- messages
- plans
- strategies
- shares
- terms
- onboarding

Definicao de pronto:

- o board principal funciona no banco novo
- criacao e leitura de conversas funcionam
- fluxo de onboarding persiste corretamente
- cada familia de rota migrada passa em teste antes da proxima

## Fase 5 — Frontend sem Supabase Client

Objetivo:

Remover o provider do browser.

Entregas:

- `AuthForm` usando API propria
- `board/page.tsx` sem `supabase.auth.getUser()`
- `onboarding/page.tsx` sem refresh de sessao do Supabase

Definicao de pronto:

- nao existe dependencia funcional do SDK do Supabase no browser
- o fluxo principal do usuario continua navegavel de ponta a ponta

## Fase 6 — Deploy na VPS

Objetivo:

Subir a stack em servidor real.

Entregas:

- provisionamento da VPS
- Docker e Compose instalados
- Caddy configurado
- deploy inicial

Definicao de pronto:

- dominio responde com HTTPS
- app sobe na VPS
- banco fica isolado
- existe procedimento simples de restart e leitura de logs por CLI

## Fase 7 — Cutover e limpeza

Objetivo:

Encerrar dependencia do Supabase.

Entregas:

- migracao final de dados
- revisao de secrets
- remocao de SDKs Supabase
- limpeza de codigo legado

Definicao de pronto:

- fluxo principal roda todo fora do Supabase
- repo nao depende mais de provider legado para producao

## Ordem de Implementacao Recomendada

1. Containerizar o app
2. Subir Postgres local
3. Introduzir Drizzle
4. Modelar `users`
5. Implementar auth local
6. Migrar middleware
7. Migrar APIs
8. Migrar frontend auth
9. Subir VPS
10. Fazer deploy de staging
11. Fazer cutover

## Regra de Validacao Entre Etapas

Entre uma etapa e outra, a regra e:

- nao empilhar duas migracoes grandes sem teste
- nao migrar frontend e backend da mesma area sem checkpoint
- nao seguir para VPS antes de a stack local estar estavel

O documento operacional de checkpoints fica em:

- [STACK_AGENT_CLI_CHECKPOINTS.md](/mnt/c/Users/studi/Downloads/aiboard/STACK_AGENT_CLI_CHECKPOINTS.md:1)

## Itens Fora do Escopo Inicial

- Kubernetes
- microservicos
- fila dedicada
- Redis obrigatorio
- observabilidade enterprise
- alta disponibilidade
- replicacao de banco
- backup externo pago

Se o produto validar, esses itens podem entrar depois.

## Riscos Conhecidos

### Senhas de usuarios existentes

Risco:

Nao assumir que conseguiremos migrar senha do Supabase Auth de forma transparente.

Mitigacao:

- forcar reset de senha no cutover, se necessario
- manter comunicacao clara para usuarios de teste

### Perda de dados por falta de backup externo

Risco:

Existe risco real de perda total se a VPS falhar.

Mitigacao:

- dumps locais diarios
- snapshots manuais antes de mudancas grandes
- contratar backup externo assim que a fase de teste provar valor

### Escopo excessivo

Risco:

Tentar migrar tudo de uma vez e quebrar o app.

Mitigacao:

- fases pequenas
- manter contratos HTTP
- migrar por camadas

## Modos de Operacao por Agent CLI

### Desenvolvimento

O agent deve conseguir:

- abrir repo
- rodar app
- executar migracoes
- rodar testes
- inspecionar banco
- editar infraestrutura

### Staging

O agent deve conseguir:

- deploy
- ver logs
- reiniciar servicos
- validar healthchecks

### Producao

O agent deve conseguir:

- deploy com comandos previsiveis
- ver logs
- reiniciar containers
- executar dumps

Acoes destrutivas devem continuar exigindo confirmacao humana.

## Comandos Alvo da Stack

Estes comandos ainda serao implementados, mas a stack deve convergir para algo deste tipo:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:studio
docker compose up -d
docker compose logs -f app
docker compose exec postgres psql -U curia -d curia
./scripts/deploy.sh
./scripts/backup-db.sh
```

## Proximo Passo Imediato

A primeira entrega pratica deve ser:

1. containerizar o app atual
2. subir Postgres local no projeto
3. preparar a estrutura de banco propria

Essa etapa cria a base para que o restante da migracao seja feito progressivamente por Agent CLI.
