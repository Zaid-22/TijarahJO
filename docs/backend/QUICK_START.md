# Quick Start - Backend Bootstrap and Runtime

## Fast Path (Recommended)

From repo root, run:

```bash
./scripts/bootstrap_db.sh
```

Required environment variables:
- `MSSQL_SA_PASSWORD`
- `JWT_SIGNING_KEY`
- `DB_APP_PASSWORD` (required when using the default runtime principal `app`)

The root `.env.example` also includes local defaults for `JWT_ISSUER`,
`JWT_AUDIENCE`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `ALLOWED_HOSTS`.

This command builds bundles and applies:
1. `apps/api/database/bundles/master.sql` (`base schema + ordered migrations`)
2. `apps/api/database/bundles/seed_data.sql` (`baseline seeds`)

If you want the frontend started too, use:

```bash
./scripts/run-dev.sh
```

## Start API (local)

From `apps/api/src/Api`:

```bash
dotnet run
```

Default local base URL is typically `http://localhost:5033`.

## Quick Runtime Verification

```bash
curl -i http://localhost:5033/health/live
curl -i http://localhost:5033/health/ready
curl -i http://localhost:5033/api/v1/search
```

Expected behavior:
- `health/live` checks process liveness only.
- `health/ready` checks dependency readiness (currently database connectivity).
- Canonical API route prefix is `/api/v1`.
- Unversioned `/api/...` routes are not part of the supported contract; use `docs/reports/API_ENDPOINTS_STATUS.md` for the current inventory.

## Manual Path

If you need manual execution, apply in this order:

1. `apps/api/database/bundles/schema.sql`
2. `apps/api/database/bundles/migrations.sql`
3. Optional: `apps/api/database/bundles/seed_data.sql`

## Verify Runtime Contract

```sql
SELECT COUNT(*) AS RuntimeStoredProcedures
FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo')
  AND (name LIKE 'SP[_]%' OR name LIKE 'USP[_]%');
```

## Troubleshooting

Problem: login/signup fails with SQL errors
- Solution: rerun `./scripts/bootstrap_db.sh` to reapply schema + migrations and seeds

Problem: categories/roles endpoints return empty arrays
- Solution: apply `apps/api/database/bundles/seed_data.sql`

Problem: signed-in frontend refresh shows auth/session issues
- Solution: verify `/api/v1/auth/me`, `/api/v1/auth/refresh`, and the frontend auth runtime behavior documented in `docs/frontend/AUTH_RUNTIME_QA_MATRIX.md`

Problem: migration error after partial manual run
- Solution: rerun in canonical order: schema -> migrations -> seeds

## Operational Modes

For startup mode behavior (strict Redis vs degraded vs no Redis), see:
- `docs/backend/OPERATIONS_RUNBOOK.md`

Last Reviewed: 2026-05-22
