# Curia — Stack & Operação

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | Clerk |
| Banco | PostgreSQL 16 (container) |
| ORM / migrations | Drizzle ORM |
| LLM | Anthropic (Claude) + OpenAI |
| Reverse proxy (prod) | Caddy 2 |
| Runtime | Node.js em container Docker |

---

## Ambientes

### Local — `docker-compose.yml`

Sobe `app` + `postgres`. A app escuta na porta `APP_PORT` (default 3001) direto no host.

```bash
# Primeira vez
cp .env.example .env   # preencher as vars
docker compose up -d --build

# Acompanhar
docker compose logs -f app
```

Vars obrigatórias em `.env`:

```
APP_PORT=3001
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
POSTGRES_DB=curia
POSTGRES_USER=curia
POSTGRES_PASSWORD=curia_local_dev
POSTGRES_PORT=5432
DATABASE_URL=postgresql://curia:curia_local_dev@127.0.0.1:5432/curia
DOCKER_DATABASE_URL=postgresql://curia:curia_local_dev@postgres:5432/curia
```

### Produção — `docker-compose.prod.yml`

Sobe `caddy` + `app` + `postgres`. Caddy termina TLS e faz proxy para a app (porta 3000 interna, não exposta).

```bash
# Primeiro setup na VPS
git clone <repo> curia
cd curia
cp .env.vps.example .env.vps   # preencher as vars obrigatórias abaixo
./scripts/deploy.sh
```

Vars obrigatórias em `.env.vps`:

```
DOMAIN=curia.seudominio.com
APP_URL=https://curia.seudominio.com
NEXT_PUBLIC_APP_URL=https://curia.seudominio.com
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
POSTGRES_DB=curia
POSTGRES_USER=curia
POSTGRES_PASSWORD=<senha forte>
DOCKER_DATABASE_URL=postgresql://curia:<senha>@postgres:5432/curia
```

---

## Migrations

As migrations vivem em `app/src/db/migrations/` e são aplicadas pelo Drizzle.

```bash
# Gerar nova migration (dentro de app/)
npx drizzle-kit generate

# Aplicar no banco local (host → container postgres)
DATABASE_URL=postgresql://curia:curia_local_dev@127.0.0.1:5432/curia npx drizzle-kit migrate

# Na VPS: o deploy.sh aplica automaticamente via entrypoint do container
```

---

## Deploy na VPS

```bash
# Atualizar e reiniciar
./scripts/deploy.sh

# Logs
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 app
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 caddy
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 postgres

# Status
docker compose --env-file .env.vps -f docker-compose.prod.yml ps
```

### Verificação pós-deploy

- landing carrega
- signup / login (Clerk)
- onboarding completo
- entrada no board
- share público

---

## Banco — Backup & Restore

```bash
# Backup manual
./scripts/backup-db.sh

# Restore
./scripts/restore-db.sh /caminho/absoluto/backup.sql.gz
```

Cron recomendado na VPS (backup diário às 3h):

```
0 3 * * * cd /opt/curia && ./scripts/backup-db.sh >> /var/log/curia-backup.log 2>&1
```

---

## Provisionamento da VPS (Ubuntu 24.04)

- Docker Engine instalado
- Docker Compose plugin instalado
- Portas 80 e 443 abertas
- Domínio apontando via Cloudflare para o IP da VPS
