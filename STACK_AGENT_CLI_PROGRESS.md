# Curia — Progresso Compactado da Migração

## Estado atual

A migração local saiu da fase de infra e já chegou em auth própria + board funcional sem Supabase.

Checkpoints concluídos:

- `Checkpoint 1` — Infra local com Docker
- `Checkpoint 2` — Banco próprio com Drizzle
- `Checkpoint 3` — Users + auth local

## O que foi feito

### 1. Planejamento e operação

Arquivos de referência:

- [STACK_AGENT_CLI_PLAN.md](/mnt/c/Users/studi/Downloads/aiboard/STACK_AGENT_CLI_PLAN.md:1)
- [STACK_AGENT_CLI_CHECKPOINTS.md](/mnt/c/Users/studi/Downloads/aiboard/STACK_AGENT_CLI_CHECKPOINTS.md:1)
- [AGENT_CLI_ENV_SETUP.md](/mnt/c/Users/studi/Downloads/aiboard/AGENT_CLI_ENV_SETUP.md:1)

### 2. Infra local

Arquivos criados/ajustados:

- [docker-compose.yml](/mnt/c/Users/studi/Downloads/aiboard/docker-compose.yml:1)
- [app/Dockerfile](/mnt/c/Users/studi/Downloads/aiboard/app/Dockerfile:1)
- [app/.dockerignore](/mnt/c/Users/studi/Downloads/aiboard/app/.dockerignore:1)
- [.env.docker.example](/mnt/c/Users/studi/Downloads/aiboard/.env.docker.example:1)
- [app/next.config.ts](/mnt/c/Users/studi/Downloads/aiboard/app/next.config.ts:1)
- [app/package.json](/mnt/c/Users/studi/Downloads/aiboard/app/package.json:1)

### 3. Banco com Drizzle

Arquivos centrais:

- [app/drizzle.config.ts](/mnt/c/Users/studi/Downloads/aiboard/app/drizzle.config.ts:1)
- [app/src/db/load-env.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/load-env.ts:1)
- [app/src/db/client.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/client.ts:1)
- [app/src/db/schema.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/schema.ts:1)
- [app/src/db/migrate.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/migrate.ts:1)
- [app/src/db/smoke.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/smoke.ts:1)
- [app/src/db/drizzle/0000_bizarre_quasimodo.sql](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/drizzle/0000_bizarre_quasimodo.sql:1)
- [app/src/db/drizzle/0001_noisy_silver_surfer.sql](/mnt/c/Users/studi/Downloads/aiboard/app/src/db/drizzle/0001_noisy_silver_surfer.sql:1)

### 4. Auth local

Foi criada uma camada própria de autenticação com sessão em cookie assinado e persistência em Postgres.

Arquivos centrais:

- [app/src/lib/auth/session.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/auth/session.ts:1)
- [app/src/lib/auth/server.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/auth/server.ts:1)
- [app/src/lib/auth/request.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/auth/request.ts:1)
- [app/src/proxy.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/proxy.ts:1)
- [app/src/components/auth/AuthForm.tsx](/mnt/c/Users/studi/Downloads/aiboard/app/src/components/auth/AuthForm.tsx:1)
- [app/src/app/api/auth/login/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/auth/login/route.ts:1)
- [app/src/app/api/auth/signup/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/auth/signup/route.ts:1)
- [app/src/app/api/auth/logout/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/auth/logout/route.ts:1)
- [app/src/app/api/auth/session/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/auth/session/route.ts:1)
- [app/src/app/api/auth/forgot-password/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/auth/forgot-password/route.ts:1)
- [app/src/app/api/auth/reset-password/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/auth/reset-password/route.ts:1)

### 5. Board e rotas migradas para Drizzle

Rotas principais já migradas para usar auth local + banco próprio:

- `conversations`
- `conversations/[id]`
- `conversations/[id]/messages`
- `conversations/[id]/title`
- `conversations/[id]/share`
- `plans`
- `plans/[id]`
- `plans/[id]/review`
- `strategies`
- `strategies/[id]`
- `share/[token]`
- `onboarding`
- `terms/accept`

Arquivos centrais:

- [app/src/lib/db/serializers.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/db/serializers.ts:1)
- [app/src/lib/metrics/track.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/lib/metrics/track.ts:1)
- [app/src/app/api/conversations/[id]/messages/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/conversations/[id]/messages/route.ts:1)
- [app/src/app/api/plans/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/plans/route.ts:1)
- [app/src/app/api/strategies/route.ts](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/api/strategies/route.ts:1)
- [app/src/app/(app)/board/page.tsx](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/(app)/board/page.tsx:1)
- [app/src/app/onboarding/page.tsx](/mnt/c/Users/studi/Downloads/aiboard/app/src/app/onboarding/page.tsx:1)

### 6. Remoção do Supabase

O código da app foi limpo para parar de depender de Supabase.

Remoções:

- wrappers antigos em `app/src/lib/supabase/*`
- dependências `@supabase/ssr`
- dependências `@supabase/supabase-js`

### 7. Preparação de staging/VPS

O repositório agora já contém os artefatos operacionais mínimos para subir staging/self-hosted em VPS.

Arquivos centrais:

- [docker-compose.prod.yml](/mnt/c/Users/studi/Downloads/aiboard/docker-compose.prod.yml:1)
- [ops/Caddyfile](/mnt/c/Users/studi/Downloads/aiboard/ops/Caddyfile:1)
- [.env.vps.example](/mnt/c/Users/studi/Downloads/aiboard/.env.vps.example:1)
- [scripts/deploy.sh](/mnt/c/Users/studi/Downloads/aiboard/scripts/deploy.sh:1)
- [scripts/backup-db.sh](/mnt/c/Users/studi/Downloads/aiboard/scripts/backup-db.sh:1)
- [scripts/restore-db.sh](/mnt/c/Users/studi/Downloads/aiboard/scripts/restore-db.sh:1)
- [VPS_STAGING_RUNBOOK.md](/mnt/c/Users/studi/Downloads/aiboard/VPS_STAGING_RUNBOOK.md:1)

## O que foi validado

### Estrutural

Validado com sucesso:

- `docker compose up -d`
- `docker compose -f docker-compose.yml config`
- `docker compose --env-file .env.vps.example -f docker-compose.prod.yml config`
- `cd app && npm run db:migrate`
- `cd app && npm run db:smoke`
- `cd app && npx next typegen`
- `cd app && npx tsc --noEmit`
- `cd app && npm run build`
- `bash -n scripts/deploy.sh scripts/backup-db.sh scripts/restore-db.sh`

### E2E funcional

A suíte E2E foi atualizada para a auth local.

Arquivos:

- [app/tests/e2e/auth.setup.ts](/mnt/c/Users/studi/Downloads/aiboard/app/tests/e2e/auth.setup.ts:1)
- [app/tests/e2e/auth.spec.ts](/mnt/c/Users/studi/Downloads/aiboard/app/tests/e2e/auth.spec.ts:1)
- [app/tests/e2e/middleware.spec.ts](/mnt/c/Users/studi/Downloads/aiboard/app/tests/e2e/middleware.spec.ts:1)
- [app/tests/e2e/onboarding.spec.ts](/mnt/c/Users/studi/Downloads/aiboard/app/tests/e2e/onboarding.spec.ts:1)
- [app/tests/e2e/board.spec.ts](/mnt/c/Users/studi/Downloads/aiboard/app/tests/e2e/board.spec.ts:1)
- [app/playwright.config.ts](/mnt/c/Users/studi/Downloads/aiboard/app/playwright.config.ts:1)

Resultados executados no ambiente local:

- `npx playwright test tests/e2e/auth.spec.ts` → `16 passed`
- `npx playwright test` → `31 passed`

Cobertura validada:

- proteção de rotas por `proxy`
- login inválido
- login válido com usuário com onboarding
- login válido com usuário sem onboarding
- signup
- erro de e-mail já cadastrado
- forgot-password
- reset-password sem token
- acesso ao onboarding com sessão fresh
- conclusão completa do onboarding até `/board`
- acesso ao board com sessão pronta
- persistência de sessão após reload
- regressão de back button

## Estado funcional atual

Hoje o ambiente local está assim:

- app Next rodando localmente
- Postgres próprio rodando em Docker
- schema em Drizzle funcional
- auth própria funcional
- sessão por cookie funcional
- `proxy` funcional no lugar de `middleware`
- rotas principais do board já fora do Supabase
- suíte E2E completa passando
- staging/VPS já tem compose, proxy reverso, backup e script de deploy versionados

## Configuração importante

### Arquivo `.env`

O `.env` da raiz foi ajustado para separar:

- `DATABASE_URL` para comandos rodando no host/WSL
- `DOCKER_DATABASE_URL` para serviços rodando dentro do Docker

### Porta da app

No fluxo Docker, a app ficou em:

```bash
APP_PORT=3001
```

Nos E2E do Playwright, o `webServer` sobe localmente em:

```bash
http://localhost:3000
```

## Comandos que devem continuar funcionando

Na raiz:

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=100 app
docker compose logs --tail=100 postgres
```

No app:

```bash
cd app
npm run db:generate
npm run db:migrate
npm run db:smoke
npx next typegen
npx tsc --noEmit
npm run build
```

E2E:

```bash
cd app
npx playwright test
```

## O que ainda não foi feito

Ainda ficou pendente:

- revisar warnings antigos de lint no board
- executar o staging em uma VPS real
- apontar DNS e emitir HTTPS real
- validar deploy remoto com `.env.vps`
- fazer cutover final

## Próximo checkpoint

O próximo checkpoint correto agora passa a ser execução real do staging na VPS.

Objetivos:

- copiar `.env.vps`
- subir `docker-compose.prod.yml` em servidor real
- validar HTTPS, auth, onboarding e board em ambiente remoto
- fazer cutover final

## Como retomar depois

Quando voltar, o ponto de partida é:

1. subir os containers
2. validar banco
3. validar build
4. rerodar o smoke E2E principal se necessário

Sequência:

```bash
docker compose up -d
cd app
npm run db:migrate
npm run db:smoke
npm run build
npx playwright test tests/e2e/auth.spec.ts
npx playwright test tests/e2e/middleware.spec.ts tests/e2e/onboarding.spec.ts tests/e2e/board.spec.ts
```

## Resumo em uma frase

A app local já opera sem Supabase no fluxo principal, com auth própria, board migrado e checkpoint validado por build, smoke test e E2E.
