#!/bin/bash
#
# PostgreSQL backup for Quran Yutla — read-only, safe to run any time.
#
# Produces a timestamped custom-format dump (pg_dump -Fc) that pg_restore can
# replay selectively, and prunes dumps older than the retention window.
#
# Credentials come from the environment — never hardcode them (this file is in
# git). On the server, put them in a root-only env file and source it from cron.
#
#   export DB_HOST=... DB_PORT=... DB_USER=... DB_NAME=... DB_PASSWORD=...
#   export BACKUP_DIR=/var/backups/quran-yutla        # optional, default below
#   export RETENTION_DAYS=14                           # optional, default 14
#   ./scripts/backup-db.sh
#
# Schedule daily at 03:30 via cron (server local time):
#   30 3 * * *  . /etc/quran-yutla/db.env && /opt/quran-yutla/scripts/backup-db.sh >> /var/log/quran-yutla-backup.log 2>&1
#
# Restore a dump:
#   pg_restore --clean --if-exists -h HOST -p PORT -U USER -d DBNAME FILE.dump
#
# NOTE: a local backup does not survive the server dying. Copy BACKUP_DIR
# off-box (OVH Object Storage, another host) — see the tail of this script.

set -euo pipefail

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/quran-yutla}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

timestamp="$(date +%Y%m%d-%H%M%S)"
outfile="${BACKUP_DIR}/${DB_NAME}-${timestamp}.dump"

mkdir -p "$BACKUP_DIR"
export PGPASSWORD="$DB_PASSWORD"

echo "[$(date -Is)] backing up ${DB_NAME}@${DB_HOST}:${DB_PORT} -> ${outfile}"

# -Fc  custom (compressed, selectively restorable)
# --no-owner / --no-privileges  portable across roles
if ! pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -Fc --no-owner --no-privileges -f "$outfile"; then
  echo "[$(date -Is)] ERROR: pg_dump failed; removing partial file" >&2
  rm -f "$outfile"
  exit 1
fi

# Reject an empty/near-empty dump rather than silently "succeeding".
size=$(wc -c < "$outfile")
if [ "$size" -lt 1024 ]; then
  echo "[$(date -Is)] ERROR: dump is only ${size} bytes; treating as failure" >&2
  rm -f "$outfile"
  exit 1
fi

echo "[$(date -Is)] ok: ${outfile} ($(du -h "$outfile" | cut -f1))"

# Prune old backups (only this DB's files).
deleted=$(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}-*.dump" -type f \
  -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
echo "[$(date -Is)] pruned ${deleted} backup(s) older than ${RETENTION_DAYS} day(s)"

# --- Off-box copy (recommended) --------------------------------------------
# A backup on the same server is lost with the server. Once OVH Object Storage
# is configured, mirror it off-box, e.g. with the AWS CLI pointed at OVH S3:
#
#   aws --endpoint-url "$OVH_ENDPOINT" s3 cp "$outfile" \
#       "s3://${OVH_BUCKET_NAME}/db-backups/" --only-show-errors
#
# Uncomment and set OVH_ENDPOINT / OVH_BUCKET_NAME / AWS_ACCESS_KEY_ID /
# AWS_SECRET_ACCESS_KEY once storage credentials exist.

echo "[$(date -Is)] backup complete"
