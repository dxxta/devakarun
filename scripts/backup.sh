#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"
mkdir -p ./backups

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
compose="docker compose -f docker-compose.prod.yml"

$compose exec -T postgres sh -c \
  'pg_dump --no-owner --no-acl -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "./backups/postgres-$timestamp.sql"

$compose exec -T app tar -czf - -C /app/media . \
  > "./backups/media-$timestamp.tar.gz"

printf 'Created backups/postgres-%s.sql and backups/media-%s.tar.gz\n' "$timestamp" "$timestamp"
