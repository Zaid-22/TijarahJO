# Database Setup Checklist - TijarahJoDB (EF Core Runtime Path)

Use this checklist to verify a clean database setup for local development and CI.

## 1. Prerequisites

- [ ] SQL Server is running (local Docker or host instance)
- [ ] `MSSQL_SA_PASSWORD` is set
- [ ] `JWT_SIGNING_KEY` is set
- [ ] `DB_APP_PASSWORD` is set (required when runtime principal is `app`)
- [ ] Required tools are available: `docker`, `dotnet`, `curl`, `jq`, `rg`

## 2. Canonical Setup (Recommended)

- [ ] From repo root, run:

```bash
./scripts/bootstrap_db.sh
```

- [ ] Script completes without SQL errors
- [ ] Backend starts and serves Swagger at `http://localhost:5033/swagger`
- [ ] API verification passes (`./scripts/verify_all_apis.sh`)

## 3. SQL Source & Bundle Validation

- [ ] Bundle generation succeeds:

```bash
./apps/api/database/scripts/build_sql_bundles.sh
```

- [ ] SQL audit succeeds:

```bash
./apps/api/database/scripts/audit_sql_files.sh
```

- [ ] Runtime contract guard succeeds (no runtime `SP_/usp_` usage):

```bash
./apps/api/database/scripts/guard_runtime_proc_contract.sh
```

- [ ] Migration checksum guard succeeds (migration immutability):

```bash
./apps/api/database/scripts/guard_migration_checksums.sh
```

- [ ] Query performance baseline thresholds pass:

```bash
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/run_performance_baseline.sh
```

- [ ] Hot-path SQL query plans are captured for feed/search/top-sellers review:

```bash
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/capture_query_plans.sh
```

- [ ] API concurrent load probe passes:

```bash
./scripts/load_test_api.sh
```

## 4. Arabic / UTF-8 (Windows)

If Arabic columns show mojibake (for example `Ø§Ù„Ø£Ø«Ø§Ø«` instead of `الأثاث`), SQL scripts were applied without UTF-8 input encoding.

- **sqlcmd (Windows):** always pass `-f 65001` when applying `.sql` files that contain Arabic.
- **SSMS:** save scripts as **UTF-8** (with or without BOM) and confirm the file displays Arabic correctly before execution.
- **Canonical fix:** rerun `./scripts/bootstrap_db.sh` (uses UTF-8 sqlcmd flags) or apply migration `V202605220001__repair_arabic_utf8_mojibake.sql` after rebuilding bundles.

Repo SQL seed files are UTF-8; the database stores correct Unicode once scripts are executed with UTF-8 encoding.

## 5. Manual Fallback Order (If Needed)

Apply only if troubleshooting a partial setup:

1. `apps/api/database/bundles/schema.sql`
2. `apps/api/database/bundles/migrations.sql`
3. `apps/api/database/bundles/seed_data.sql` (optional baseline reference data)

When using `sqlcmd` manually on Windows, add `-f 65001` to every invocation.

## 6. Database Verification Queries

Run in SSMS/sqlcmd after setup:

```sql
USE TijarahJoDB;
GO

-- Core canonical tables
SELECT name
FROM sys.tables
WHERE name IN (
  'Users','Roles','Posts','Categories','PostImages',
  'Favorites','Reviews','Conversations','Messages',
  'Cities','Areas','UserStatusLookup','PostStatusLookup'
)
ORDER BY name;
```

```sql
USE TijarahJoDB;
GO

-- Arabic reference data (should display real Arabic, not mojibake like Ø§Ù„Ø£Ø«Ø§Ø«)
SELECT CategoryName, NameAr
FROM dbo.Categories
WHERE CategoryName = N'Furniture';
GO
```

```sql
USE TijarahJoDB;
GO

-- Migration tracking
SELECT ScriptName, AppliedAt
FROM dbo.SchemaMigrations
ORDER BY AppliedAt DESC;
```

```sql
USE TijarahJoDB;
GO

-- Quick seed sanity checks
SELECT
  (SELECT COUNT(*) FROM dbo.Roles) AS RoleCount,
  (SELECT COUNT(*) FROM dbo.Categories) AS CategoryCount,
  (SELECT COUNT(*) FROM dbo.UserStatusLookup) AS UserStatusCount,
  (SELECT COUNT(*) FROM dbo.PostStatusLookup) AS PostStatusCount;
```

```sql
USE TijarahJoDB;
GO

-- Optional: confirm no legacy runtime SP namespace is required
SELECT COUNT(*) AS LegacyRuntimeProcCount
FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo')
  AND (name LIKE 'SP[_]%' OR name LIKE 'USP[_]%');
```

## 7. Index/Query Health Spot Checks

- [ ] Login lookup indexes exist (`IX_Users_Login_Email_Active`, normalized phone/email equivalents)
- [ ] Post feed indexes exist on status/delete + recency paths
- [ ] No blocking migration/index errors in SQL logs

## 8. Troubleshooting

- If setup fails midway: rerun `./scripts/bootstrap_db.sh --no-volume-reset`
- If Docker login/password mismatch occurs: rerun with volume reset (default behavior)
- If backend fails after DB success: inspect backend log referenced by `bootstrap_db.sh`
- If SQL audit/guard fails: fix source SQL/runtime code before retrying bootstrap

## 9. Done Criteria

- [ ] Bootstrap command passes
- [ ] SQL bundle build passes
- [ ] SQL audit passes
- [ ] Runtime contract guard passes
- [ ] Swagger loads and auth/posts endpoints respond correctly
