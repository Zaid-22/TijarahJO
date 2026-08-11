#!/usr/bin/env bash
# Apply only pending SQL migrations to an existing production database.
# This script never creates, drops, restores, or recreates the database.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/apps/api/database/scripts/migrations"
CHECKSUM_GUARD="$ROOT_DIR/apps/api/database/scripts/guard_migration_checksums.sh"
ATOMICITY_GUARD="$ROOT_DIR/apps/api/database/scripts/guard_migration_atomicity.sh"
CONTAINER_NAME="${DB_CONTAINER_NAME:-tijarahjo-db}"
DATABASE_NAME="${DB_NAME:-TijarahJoDB}"
SQLCMD_IN_CONTAINER="/opt/mssql-tools18/bin/sqlcmd"
BACKUP_DIR_IN_CONTAINER="${DB_BACKUP_DIR_IN_CONTAINER:-/var/opt/mssql/backups}"
LOCK_DIR_IN_CONTAINER="/tmp/tijarahjo-production-migration.lock"
CHECK_ONLY=0
SKIP_BACKUP=0
LOCK_HELD=0
PENDING_MIGRATIONS=()

print_usage() {
  cat <<'EOF'
Usage: ./scripts/migrate-production-db.sh [options]

Applies only migrations not recorded in dbo.SchemaMigrations. The target
database must already exist and have a migration history table.

Options:
  --check          List pending migrations without changing the database.
  --skip-backup    Apply pending migrations without the default verified backup.
  -h, --help       Show this help message.

Environment:
  MSSQL_SA_PASSWORD          SQL Server sa password (required).
  DB_CONTAINER_NAME          SQL Server container (default: tijarahjo-db).
  DB_NAME                    Database name (default: TijarahJoDB).
  DB_BACKUP_DIR_IN_CONTAINER Backup directory (default: /var/opt/mssql/backups).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)
      CHECK_ONLY=1
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      print_usage >&2
      exit 1
      ;;
  esac
done

load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

load_env_file "$ROOT_DIR/.env"
if [[ -f "$ROOT_DIR/infra/.env" && ! "$ROOT_DIR/infra/.env" -ef "$ROOT_DIR/.env" ]]; then
  if ! grep -q 'CHANGE_ME_' "$ROOT_DIR/infra/.env"; then
    load_env_file "$ROOT_DIR/infra/.env"
  else
    echo "Warning: skipping $ROOT_DIR/infra/.env because it looks like a template." >&2
  fi
fi

if [[ -z "${MSSQL_SA_PASSWORD:-}" ]]; then
  echo "Error: MSSQL_SA_PASSWORD is required." >&2
  exit 1
fi

if [[ ! "$DATABASE_NAME" =~ ^[A-Za-z][A-Za-z0-9_]{2,127}$ ]]; then
  echo "Error: DB_NAME must match ^[A-Za-z][A-Za-z0-9_]{2,127}$." >&2
  exit 1
fi

if [[ ! "$BACKUP_DIR_IN_CONTAINER" =~ ^/[A-Za-z0-9_./-]+$ ]]; then
  echo "Error: DB_BACKUP_DIR_IN_CONTAINER must be an absolute container path." >&2
  exit 1
fi

for required_cmd in docker find sort sed date grep basename seq sleep; do
  if ! command -v "$required_cmd" >/dev/null 2>&1; then
    echo "Error: required command '$required_cmd' was not found in PATH." >&2
    exit 1
  fi
done

if [[ ! -x "$CHECKSUM_GUARD" || ! -x "$ATOMICITY_GUARD" ]]; then
  echo "Error: database migration guard scripts are missing or not executable." >&2
  exit 1
fi

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | sed -n '1p' | grep -qx true; then
  echo "Error: SQL Server container '$CONTAINER_NAME' is not running." >&2
  echo "Start it with ./scripts/compose-production.sh up -d sqlserver." >&2
  exit 1
fi

echo "Waiting for SQL Server readiness..."
sql_ready=0
for _ in $(seq 1 90); do
  if docker exec "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -Q "SELECT 1" \
    >/dev/null 2>&1; then
    sql_ready=1
    break
  fi
  sleep 2
done
if [[ "$sql_ready" -ne 1 ]]; then
  echo "Error: SQL Server did not become ready in time." >&2
  exit 1
fi

sql_scalar() {
  local database="$1"
  local query="$2"
  docker exec "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -f 65001 \
    -d "$database" -h -1 -W -Q "SET NOCOUNT ON; $query" \
    | sed -e 's/\r$//' -e '/^[[:space:]]*$/d' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
    | sed -n '1p'
}

database_exists="$(sql_scalar master "SELECT CASE WHEN DB_ID(N'$DATABASE_NAME') IS NULL THEN 0 ELSE 1 END;")"
if [[ "$database_exists" != "1" ]]; then
  echo "Error: database '$DATABASE_NAME' does not exist." >&2
  echo "Use bootstrap_db.sh only for an intentional first-time installation." >&2
  exit 1
fi

history_exists="$(sql_scalar "$DATABASE_NAME" "SELECT CASE WHEN OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL THEN 0 ELSE 1 END;")"
if [[ "$history_exists" != "1" ]]; then
  echo "Error: dbo.SchemaMigrations is missing from '$DATABASE_NAME'." >&2
  echo "Refusing to guess migration state on an untracked database." >&2
  exit 1
fi

"$CHECKSUM_GUARD"
"$ATOMICITY_GUARD"

collect_pending_migrations() {
  PENDING_MIGRATIONS=()
  local migration_file=""
  local script_name=""
  local script_stem=""
  local applied=""

  while IFS= read -r migration_file; do
    script_name="$(basename "$migration_file")"
    script_stem="${script_name%.sql}"
    applied="$(sql_scalar "$DATABASE_NAME" \
      "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName IN (N'$script_name', N'$script_stem')) THEN 1 ELSE 0 END;")"
    if [[ "$applied" == "0" ]]; then
      PENDING_MIGRATIONS+=("$migration_file")
    elif [[ "$applied" != "1" ]]; then
      echo "Error: could not determine migration state for '$script_name'." >&2
      exit 1
    fi
  done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name 'V*.sql' | sort)
}

collect_pending_migrations

if [[ ${#PENDING_MIGRATIONS[@]} -eq 0 ]]; then
  echo "Database '$DATABASE_NAME' is current; no pending migrations."
  exit 0
fi

echo "Pending migrations (${#PENDING_MIGRATIONS[@]}):"
for migration_file in "${PENDING_MIGRATIONS[@]}"; do
  echo "  - $(basename "$migration_file")"
done

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  exit 0
fi

history_count="$(sql_scalar "$DATABASE_NAME" "SELECT COUNT_BIG(*) FROM dbo.SchemaMigrations;")"
has_user_data="$(sql_scalar "$DATABASE_NAME" "SELECT CASE WHEN OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Users) THEN 1 ELSE 0 END;")"
if [[ "$history_count" == "0" && "$has_user_data" == "1" ]]; then
  echo "Error: migration history is empty but dbo.Users contains data." >&2
  echo "Refusing an automatic baseline because historical migrations may be destructive." >&2
  exit 1
fi

release_lock() {
  if [[ "$LOCK_HELD" -eq 1 ]]; then
    docker exec "$CONTAINER_NAME" rmdir "$LOCK_DIR_IN_CONTAINER" >/dev/null 2>&1 || true
  fi
}
trap release_lock EXIT INT TERM

if ! docker exec "$CONTAINER_NAME" mkdir "$LOCK_DIR_IN_CONTAINER" >/dev/null 2>&1; then
  echo "Error: another production migration process appears to be running." >&2
  exit 1
fi
LOCK_HELD=1

# Re-read state after acquiring the deployment lock.
collect_pending_migrations
if [[ ${#PENDING_MIGRATIONS[@]} -eq 0 ]]; then
  echo "Database became current while waiting for the migration lock."
  exit 0
fi

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
  backup_name="${DATABASE_NAME}_pre_migration_$(date -u +%Y%m%dT%H%M%SZ).bak"
  backup_path="$BACKUP_DIR_IN_CONTAINER/$backup_name"
  echo "Creating and verifying pre-migration backup: $backup_path"
  docker exec "$CONTAINER_NAME" mkdir -p "$BACKUP_DIR_IN_CONTAINER"
  docker exec "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -f 65001 -d master \
    -Q "BACKUP DATABASE [$DATABASE_NAME] TO DISK = N'$backup_path' WITH COPY_ONLY, INIT, CHECKSUM, COMPRESSION; RESTORE VERIFYONLY FROM DISK = N'$backup_path' WITH CHECKSUM;"
else
  echo "Warning: pre-migration backup explicitly skipped." >&2
fi

for migration_file in "${PENDING_MIGRATIONS[@]}"; do
  script_name="$(basename "$migration_file")"
  script_stem="${script_name%.sql}"
  echo "Applying $script_name..."
  docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -f 65001 \
    -d "$DATABASE_NAME" < "$migration_file"

  # Historical scripts used both the exact filename and the extensionless
  # basename. Normalize only after sqlcmd succeeds so history never claims a
  # failed migration was applied.
  docker exec "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -f 65001 \
    -d "$DATABASE_NAME" -Q "
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N'$script_name')
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N'$script_stem')
        UPDATE dbo.SchemaMigrations SET ScriptName = N'$script_name' WHERE ScriptName = N'$script_stem';
    ELSE
        INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
        VALUES (N'$script_name', N'Applied by migrate-production-db.sh');
END;
COMMIT TRANSACTION;"
done

collect_pending_migrations
if [[ ${#PENDING_MIGRATIONS[@]} -ne 0 ]]; then
  echo "Error: pending migrations remain after deployment." >&2
  exit 1
fi

echo "Production database migration completed successfully."
