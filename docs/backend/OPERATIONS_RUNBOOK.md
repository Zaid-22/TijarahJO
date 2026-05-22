# Backend Operations Runbook

## Versioning Policy

- Canonical API routes are route-versioned: `/api/v1/...`.
- Unversioned `/api/...` routes are not part of the supported contract; use `docs/reports/API_ENDPOINTS_STATUS.md` for the current inventory.
- Query/header version overrides are not part of the contract.

## Startup Modes

Startup behavior is controlled by feature flags:

- `FeatureFlags:EnableRedisPresence`
- `FeatureFlags:EnableRedisBackplane`
- `FeatureFlags:RequireRedis`

### Mode A: Strict Redis (production hard requirement)

- `EnableRedisPresence=true`
- `EnableRedisBackplane=true`
- `RequireRedis=true`
- Result: app fails startup if Redis is unavailable.

### Mode B: Degraded Redis (recommended default for non-critical realtime)

- `EnableRedisPresence=true`
- `EnableRedisBackplane=true`
- `RequireRedis=false`
- Result: app starts when Redis is down, logs degraded mode, falls back to in-memory presence.

### Mode C: No Redis

- `EnableRedisPresence=false`
- `EnableRedisBackplane=false`
- `RequireRedis=false`
- Result: app runs without Redis dependencies.

## Environment Variable Baseline

Set these keys in all environments:

- `DATABASE_CONNECTION_STRING` (or `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- `JWT_SIGNING_KEY`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `PASSWORD_PEPPER`

Set these keys only when Redis-enabled modes are used:

- `ConnectionStrings__Redis`
- `FeatureFlags__EnableRedisPresence`
- `FeatureFlags__EnableRedisBackplane`
- `FeatureFlags__RequireRedis`

## Startup Verification Checklist

Run after deployment or restart:

```bash
curl -i "$BASE_URL/health/live"
curl -i "$BASE_URL/health/ready"
curl -i "$BASE_URL/api/v1/search"
```

Expected:

- `/health/live` returns `200`.
- `/health/ready` returns `200` when DB is reachable.
- `/api/v1/search` returns `200` and includes `api-supported-versions: 1.0`.

## Auth Session Verification

Validate cookie-authenticated session recovery after deployment:

1. Sign in through the frontend.
2. Hard refresh a public page.
3. Confirm the page shell stays visible and auth-dependent header actions return without a temporary logged-out flash.
4. Trigger an authenticated API request after session expiry and confirm the client can recover through `POST /api/v1/auth/refresh` when the session is still renewable.

## Performance Hardening Gates

Run these before promotion to staging/production:

```bash
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/run_performance_baseline.sh
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/capture_query_plans.sh
./scripts/load_test_api.sh
```

Expected:

- SQL baseline passes thresholds for feed/search/top-sellers/chat-history.
- Query plans are generated for feed/search/top-sellers (`.sqlplan` files).
- API load probes pass thresholds for feed/search/top-sellers.

## Health Endpoint Semantics

- `GET /health/live`
  - Scope: process liveness only.
  - Health check tag: `live`.
  - Current checks: `process_liveness`.
  - Use for container/runtime liveness probes.

- `GET /health/ready`
  - Scope: runtime readiness.
  - Health check tag: `ready`.
  - Current checks: `database_connectivity`.
  - Use for load balancer readiness probes.

## Incident Playbook

### 1. Confirm blast radius

```bash
curl -i "$BASE_URL/health/live"
curl -i "$BASE_URL/health/ready"
```

### 2. Identify class of failure

- `live` fails: process crash or startup fault.
- `live` ok, `ready` fails: dependency outage (typically database).
- Both healthy but APIs failing: request-path bug, auth/config drift, or data corruption.

### 3. First response actions

- Restart deployment only after collecting logs from the failing instance.
- Verify required secrets/env vars are present and non-empty.
- For database incidents:
  - validate connectivity credentials and network path,
  - rerun bootstrap/migration checks only in controlled maintenance windows.
- For Redis incidents:
  - if `RequireRedis=false`, keep service in degraded mode and track realtime impact,
  - if `RequireRedis=true`, restore Redis first, then redeploy app.

### 4. Recovery verification

```bash
curl -i "$BASE_URL/health/live"
curl -i "$BASE_URL/health/ready"
curl -i "$BASE_URL/api/v1/search"
```

### 5. Post-incident

- Record incident timeline and root cause.
- Add/adjust regression tests if bug-related.
- Update this runbook when response steps change.
