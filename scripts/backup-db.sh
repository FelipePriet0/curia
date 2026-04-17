#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.vps}"
TIMESTAMP="$(date +%F-%H%M%S)"
BACKUP_NAME="curia-${TIMESTAMP}.sql.gz"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.vps.example and fill the production values."
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip -9 > "/backups/'"$BACKUP_NAME"'"'

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc 'find /backups -type f -name "*.sql.gz" -mtime +7 -delete'

echo "Backup created: $BACKUP_NAME"
