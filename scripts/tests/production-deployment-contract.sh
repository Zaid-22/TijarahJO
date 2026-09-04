#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

for script in scripts/compose-production.sh scripts/migrate-production-db.sh; do
  bash -n "$script"
done

if grep -Eiq 'DROP[[:space:]]+DATABASE|docker[[:space:]]+compose.*down[[:space:]]+-v|SINGLE_USER' \
  scripts/migrate-production-db.sh; then
  echo "Production migration runner contains a destructive database operation." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for the production deployment contract test." >&2
  exit 1
fi

compose_json="$(docker compose --env-file infra/.env.example \
  -f infra/docker-compose.production.yml config --format json)"

jq -e '
  (.services.sqlserver.ports == null) and
  (.services.api.environment.ASPNETCORE_ENVIRONMENT == "Production") and
  (.services.api.environment.FeatureFlags__EnableRateLimiting == "true") and
  (.services.api.environment.EmailVerification__Enabled == "true") and
  (.services.api.environment.EmailVerification__ResendApiKey | length > 0) and
  (.services.api.environment.FileStorage__PrivateRootPath == "/var/lib/tijarahjo/private-uploads") and
  (any(.services.api.volumes[];
    .type == "volume" and .target == "/var/lib/tijarahjo/private-uploads")) and
  (.networks.edge.external == true)
' >/dev/null <<<"$compose_json"

grep -Fq '"$ROOT_DIR/scripts/migrate-production-db.sh"' scripts/compose-production.sh
grep -Fq "ScriptName = N'\$script_name'" scripts/migrate-production-db.sh
grep -Fq 'GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.VerificationChallenges TO [tijarahjo_app_runtime];' \
  scripts/bootstrap_db.sh
grep -Fq 'FeatureFlags__EnableRateLimiting=true' _on_server/.env.example

app_build_line="$(grep -nF 'build api web' scripts/compose-production.sh | cut -d: -f1)"
data_start_line="$(grep -nF 'up -d sqlserver redis' scripts/compose-production.sh | cut -d: -f1)"
migration_line="$(grep -nF '"$ROOT_DIR/scripts/migrate-production-db.sh"' scripts/compose-production.sh | cut -d: -f1)"
app_update_line="$(grep -nF 'up -d --no-build "$@" api web' scripts/compose-production.sh | cut -d: -f1)"
if (( app_build_line >= data_start_line ||
      data_start_line >= migration_line ||
      migration_line >= app_update_line )); then
  echo "Production deploy ordering must be application build, data services, migrations, then application update." >&2
  exit 1
fi

echo "Production deployment contract passed."
