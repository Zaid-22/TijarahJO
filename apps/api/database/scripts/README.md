# Database Scripts

This folder uses a source-first workflow with generated deployment bundles.

Audit snapshot: see `AUDIT_SUMMARY.md`.

## Refactor Status

Database refactor completed.

- Legacy and destructive SQL scripts removed
- Source-of-truth enforced (no generated SQL committed)
- Status and delete semantics unified (soft-delete)
- Constraints made deterministic
- Security risks removed from seed paths
- Performance issues fixed on high-traffic queries

Database is now production-consistent and review-ready.

## Canonical Runtime Path

Use `./scripts/bootstrap_db.sh` (from repo root) for local setup.

`./scripts/bootstrap_db.sh` now:
1. Runs `build_sql_bundles.sh`
2. Applies `apps/api/database/bundles/master.sql` (base schema + ordered migrations + canonical procedures)
3. Applies `apps/api/database/bundles/seed_data.sql` (baseline seeds only, by default)
4. Applies `apps/api/database/bundles/seed_dev.sql` only with `--with-dev-seeds`
5. Applies `apps/api/database/bundles/seed_test.sql` only with `--with-test-seeds`

## Canonical Source Layout

- `../schema/`
  - canonical base schema SQL (`BASE_SCHEMA.sql`)
- `migrations/`
  - append-only versioned schema/runtime migrations (`VYYYYMMDDHHMM__description.sql`)
- `procedures/`
  - canonical runtime stored procedures (`CANONICAL_STORED_PROCEDURES.sql`)
- `seeds/baseline/`
  - baseline reference data required for local/runtime defaults
- `seeds/dev/`
  - development-only sample/test data helpers
- `seeds/test/`
  - test-specific seed scripts
- `maintenance/`
  - cleanup/maintenance scripts not part of bootstrap deployment bundles
- `../bundles/`
  - generated artifacts only (never edit directly)

## Consolidated Bundles (Generated)

Regenerate bundles manually:

```bash
./apps/api/database/scripts/build_sql_bundles.sh
```

Or from repo root:

```bash
make sql-bundles
```

Run SQL inventory/duplicate audit:

```bash
make sql-audit
```

Run strict active-procedure duplication guard:

```bash
./apps/api/database/scripts/guard_no_duplicate_procs.sh
```

Generated files:
- `apps/api/database/bundles/schema.sql`: base table/constraint schema bundle
- `apps/api/database/bundles/migrations.sql`: ordered migration bundle
- `apps/api/database/bundles/procedures.sql`: canonical procedure bundle
- `apps/api/database/bundles/seed_data.sql`: baseline seed bundle only
- `apps/api/database/bundles/seed_dev.sql`: development-only seed bundle
- `apps/api/database/bundles/seed_test.sql`: test-only seed bundle
- `apps/api/database/bundles/master.sql`: one-shot deployment bundle (`base schema + migrations + procedures`)

## Execution Strategy

- Full setup (recommended): run `./scripts/bootstrap_db.sh`
- Full setup + dev seeds: `./scripts/bootstrap_db.sh --with-dev-seeds`
- Full setup + dev/test seeds: `./scripts/bootstrap_db.sh --with-dev-seeds --with-test-seeds`
- Manual schema-only setup: apply `apps/api/database/bundles/schema.sql`
- Manual migration-only setup: apply `apps/api/database/bundles/migrations.sql`
- Manual procedure-only setup: apply `apps/api/database/bundles/procedures.sql`
- Baseline-only seed data: apply `apps/api/database/bundles/seed_data.sql`
- Optional development seed data: apply `apps/api/database/bundles/seed_dev.sql`
- Optional test seed data: apply `apps/api/database/bundles/seed_test.sql`
- Maintenance cleanup: run `maintenance/CLEANUP_TEST_DATA.sql` manually when needed
