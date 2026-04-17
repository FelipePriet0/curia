# Curia — Checkpoints de Execucao e Teste

## Como usar este arquivo

Este documento traduz o plano principal em etapas operacionais curtas.

Regra:

- fazemos uma etapa
- paramos
- testamos
- so avancamos se o checkpoint passar

Se um checkpoint falhar, a prioridade nao e seguir. A prioridade e corrigir.

## Checkpoint 0 — Plano e direcao tecnica

### Objetivo

Fechar a direcao da stack antes de editar infraestrutura e auth.

### Escopo

- stack alvo definida
- custo teto definido
- ordem de migracao definida

### Status esperado

- plano versionado no repo
- checkpoints versionados no repo

### Teste minimo

- revisar os dois arquivos e confirmar que viraram referencia oficial do trabalho

### Resultado esperado

- podemos iniciar implementacao sem rediscutir arquitetura base a cada etapa

## Checkpoint 1 — Infra local com Docker

### Objetivo

Rodar a aplicacao e o Postgres localmente em containers.

### Escopo

- `Dockerfile`
- `docker-compose.yml`
- variaveis de ambiente da stack local
- volume do Postgres

### Nao entra ainda

- auth nova
- migracao completa para Drizzle
- deploy de VPS

### Testes obrigatorios

- `docker compose up -d` sobe sem erro
- app responde localmente
- Postgres responde localmente
- restart dos containers nao perde configuracao

### So avancar se

- o ambiente local estiver previsivel e repetivel

## Checkpoint 2 — Banco proprio e Drizzle

### Objetivo

Introduzir a camada de banco propria fora do SDK do Supabase.

### Escopo

- `drizzle.config.*`
- cliente de banco
- schema inicial
- primeiras migracoes

### Nao entra ainda

- auth final
- migracao de todas as rotas

### Testes obrigatorios

- gerar migracoes
- aplicar migracoes no Postgres local
- validar leitura e escrita em tabela simples
- validar que as conexoes funcionam dentro do app

### So avancar se

- banco local estiver estavel e operavel por CLI

## Checkpoint 3 — Tabela `users` e auth local

### Objetivo

Sair do Supabase Auth.

### Escopo

- tabela `users`
- `Better Auth`
- cookies de sessao
- login
- signup
- logout
- reset password

### Risco principal

- transicao de usuarios existentes

### Testes obrigatorios

- criar usuario novo
- logar
- deslogar
- acessar rota protegida
- validar redirecionamento para `/login`

### So avancar se

- auth local estiver funcional sem dependencia critica do Supabase

## Checkpoint 4 — Middleware e gating de onboarding

### Objetivo

Restaurar o comportamento atual de protecao e fluxo apos sair do Supabase Auth.

### Escopo

- middleware novo
- checagem de sessao
- regra de onboarding

### Testes obrigatorios

- usuario sem sessao nao entra em `/board`
- usuario novo vai para `/onboarding`
- usuario com onboarding completo vai para `/board`

### So avancar se

- navegacao protegida estiver estavel

## Checkpoint 5 — Rotas de conversas

### Objetivo

Migrar o bloco principal do produto.

### Escopo

- `GET/POST /api/conversations`
- `PATCH/DELETE /api/conversations/[id]`
- `GET /api/conversations/[id]/messages`

### Testes obrigatorios

- criar conversa
- listar conversas
- renomear conversa
- deletar conversa
- ler mensagens da conversa

### So avancar se

- o CRUD principal estiver consistente no banco novo

## Checkpoint 6 — Streaming e fluxo principal do board

### Objetivo

Migrar o endpoint mais critico do produto.

### Escopo

- `POST /api/conversations/[id]/messages`
- persistencia de mensagens
- tracking de eventos
- atualizacao de titulo e `updated_at`

### Testes obrigatorios

- enviar mensagem
- receber streaming NDJSON
- salvar resposta do assistant
- verificar eventos no banco

### So avancar se

- conversa real do board estiver funcionando ponta a ponta

## Checkpoint 7 — Plans, strategies, shares e terms

### Objetivo

Migrar funcionalidades auxiliares sem quebrar o core.

### Escopo

- rotas de `plans`
- rotas de `strategies`
- rotas de compartilhamento
- aceite de termos

### Testes obrigatorios

- criar e listar plano
- iniciar review
- criar strategy
- gerar link publico de share
- aceitar termos

### So avancar se

- recursos secundarios estiverem operando no banco novo

## Checkpoint 8 — Frontend sem SDK Supabase no browser

### Objetivo

Remover a dependencia funcional do Supabase Client no frontend.

### Escopo

- `AuthForm`
- `board/page.tsx`
- `onboarding/page.tsx`
- paginas de senha

### Testes obrigatorios

- fluxo completo de login
- fluxo completo de onboarding
- fluxo completo do board
- logout

### So avancar se

- usuario real conseguir usar o produto sem chamadas diretas ao Supabase Client

## Checkpoint 9 — Staging na VPS

### Objetivo

Subir a stack real em servidor.

### Escopo

- provisionamento
- deploy inicial
- DNS
- HTTPS
- logs

### Testes obrigatorios

- app responde em staging
- banco nao esta exposto publicamente
- restart manual funciona
- logs ficam acessiveis por CLI

### So avancar se

- staging estiver utilizavel para validacao final

## Checkpoint 10 — Cutover

### Objetivo

Encerrar a dependencia operacional do Supabase.

### Escopo

- migracao final de dados
- revisao de secrets
- deploy final
- limpeza de legado

### Testes obrigatorios

- fluxo principal em producao
- auth funcionando
- conversas funcionando
- onboarding funcionando
- share funcionando

### So avancar se

- o ambiente novo sustentar o fluxo principal sem fallback critico

## Regra de trabalho durante a implementacao

Em cada checkpoint:

1. definir o arquivo ou grupo de arquivos que vao mudar
2. implementar apenas o necessario para aquela etapa
3. rodar os testes correspondentes
4. registrar o resultado
5. so entao abrir a proxima frente

## Regra de escopo

Se surgir trabalho extra durante um checkpoint:

- se bloquear o checkpoint, resolver
- se nao bloquear, registrar e adiar

Nao expandir escopo por impulso.
