#!/bin/bash
# ============================================================
# Chain Host — Automated Backup Script
# Backs up: PostgreSQL, Mail data, Forgejo repos
# Encrypts with AES-256 and uploads to MinIO
# ============================================================

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/${TIMESTAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⛓️  Chain Host Backup — ${TIMESTAMP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "${BACKUP_DIR}"

# ── 1. PostgreSQL Dump ───────────────────────────────────
echo "[1/4] Backing up PostgreSQL..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -Fc \
  --no-owner \
  --no-privileges \
  -f "${BACKUP_DIR}/postgres_${POSTGRES_DB}.dump"

# Also dump Forgejo & n8n databases
for db in forgejo n8n roundcube; do
  PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT:-5432}" \
    -U "${POSTGRES_USER}" \
    -d "${db}" \
    -Fc \
    --no-owner \
    --no-privileges \
    -f "${BACKUP_DIR}/postgres_${db}.dump" 2>/dev/null || \
    echo "  ⚠️  Database '${db}' not found, skipping"
done

echo "  ✅ PostgreSQL backup complete"

# ── 2. Mail Data ─────────────────────────────────────────
echo "[2/4] Backing up mail data..."
if [ -d "/var/mail" ]; then
  tar -czf "${BACKUP_DIR}/mail_data.tar.gz" -C /var/mail . 2>/dev/null || \
    echo "  ⚠️  Mail data backup skipped"
fi
echo "  ✅ Mail backup complete"

# ── 3. Forgejo Data ─────────────────────────────────────
echo "[3/4] Backing up Forgejo repositories..."
if [ -d "/var/forgejo" ]; then
  tar -czf "${BACKUP_DIR}/forgejo_data.tar.gz" -C /var/forgejo . 2>/dev/null || \
    echo "  ⚠️  Forgejo data backup skipped"
fi
echo "  ✅ Forgejo backup complete"

# ── 4. Encrypt & Upload ─────────────────────────────────
echo "[4/4] Encrypting and uploading..."

ARCHIVE="${BACKUP_DIR}.tar.gz"
tar -czf "${ARCHIVE}" -C "/backups" "${TIMESTAMP}"

# Encrypt with AES-256
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "${ARCHIVE}" \
    -out "${ARCHIVE}.enc" \
    -pass "pass:${BACKUP_ENCRYPTION_KEY}"
  rm "${ARCHIVE}"
  ARCHIVE="${ARCHIVE}.enc"
  echo "  🔒 Backup encrypted"
fi

# Upload to MinIO
if [ -n "${MINIO_ENDPOINT:-}" ]; then
  # Install mc if needed
  if ! command -v mc &> /dev/null; then
    curl -sL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
    chmod +x /usr/local/bin/mc
  fi
  
  mc alias set backup "http://${MINIO_ENDPOINT}:${MINIO_PORT:-9000}" \
    "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" 2>/dev/null
  
  mc mb --ignore-existing "backup/${BACKUP_S3_BUCKET:-chainhost-backups}" 2>/dev/null
  mc cp "${ARCHIVE}" "backup/${BACKUP_S3_BUCKET:-chainhost-backups}/"
  echo "  ☁️  Uploaded to MinIO"
fi

# ── Cleanup old backups ──────────────────────────────────
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find /backups -maxdepth 1 -name "*.tar.gz*" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null
find /backups -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} \; 2>/dev/null

# Cleanup temp
rm -rf "${BACKUP_DIR}"

SIZE=$(du -sh "${ARCHIVE}" 2>/dev/null | cut -f1)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup complete: ${ARCHIVE} (${SIZE:-unknown})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
