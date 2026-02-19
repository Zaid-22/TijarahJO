# Quick Start - Database Setup

## Fast Path (Recommended)

From repo root, run:

```bash
./scripts/bootstrap_db.sh
```

This command builds bundles and applies:
1. `apps/api/database/bundles/master.sql` (`base schema + ordered migrations + canonical procedures`)
2. `apps/api/database/bundles/seed_data.sql` (`baseline + dev + test seeds`)

## Manual Path

If you need manual execution, apply in this order:

1. `apps/api/database/bundles/schema.sql`
2. `apps/api/database/bundles/migrations.sql`
3. `apps/api/database/bundles/procedures.sql`
4. Optional: `apps/api/database/bundles/seed_data.sql`

## Verify Stored Procedures

```sql
SELECT name AS ProcedureName
FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo')
  AND name LIKE 'SP_%'
ORDER BY name;
```

## Troubleshooting

Problem: procedure not found
- Solution: rerun `./scripts/bootstrap_db.sh` or re-apply `apps/api/database/bundles/procedures.sql`

Problem: categories/roles endpoints return empty arrays
- Solution: apply `apps/api/database/bundles/seed_data.sql`

Problem: migration error after partial manual run
- Solution: rerun in canonical order: schema -> migrations -> procedures
