# Curia — Runbook de Staging/VPS

## 1. Provisionamento da VPS

- Ubuntu 24.04 LTS
- Docker Engine instalado
- Docker Compose plugin instalado
- porta `80` e `443` liberadas
- domínio apontando via Cloudflare para o IP da VPS

## 2. Primeiro setup

```bash
git clone <repo> curia
cd curia
cp .env.vps.example .env.vps
```

Preencher obrigatoriamente em `.env.vps`:

- `DOMAIN`
- `POSTGRES_PASSWORD`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `ANTHROPIC_API_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## 3. Deploy inicial

```bash
./scripts/deploy.sh
```

## 4. Operação

Subir ou atualizar:

```bash
./scripts/deploy.sh
```

Ler logs:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 app
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 caddy
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 postgres
```

Status:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml ps
```

## 5. Banco

Backup manual:

```bash
./scripts/backup-db.sh
```

Restore:

```bash
./scripts/restore-db.sh /caminho/absoluto/backup.sql.gz
```

## 6. Verificação pós-deploy

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml ps
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=100 app
```

Depois validar manualmente:

- landing
- signup/login por email e senha
- recuperação de conta via Clerk
- onboarding completo
- entrada no board
- share público

## 7. Cron recomendado para backup diário

```bash
0 3 * * * cd /opt/curia && ./scripts/backup-db.sh >> /var/log/curia-backup.log 2>&1
```
