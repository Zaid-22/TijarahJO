# Database Scripts

This folder uses a source-first workflow with generated deployment bundles.

Audit snapshot: see `AUDIT_SUMMARY.md`.

## Active Migration Chain

Active canonical migrations are intentionally small and target canonical table names only:

- `V202602200900__canonical_schema_consistency.sql`
- `V202602200910__canonical_indexes.sql`
- `V202602201000__add_fulltext_search.sql` (safe no-op when SQL Server Full-Text is unavailable)
- `V202602201100__message_integrity_and_login_index_hardening.sql`

Legacy `Tb*` migration scripts were moved under `../archive/migrations-legacy/` and are excluded from bootstrap bundles.

## Canonical Runtime Path

Use `./scripts/bootstrap_db.sh` (from repo root) for local setup.

`./scripts/bootstrap_db.sh` now:
1. Runs `build_sql_bundles.sh`
2. Applies `apps/api/database/bundles/master.sql` (base schema + ordered migrations)
3. Applies `apps/api/database/bundles/seed_data.sql` (baseline seeds only, by default)
4. Applies `apps/api/database/bundles/seed_dev.sql` only with `--with-dev-seeds`
5. Applies `apps/api/database/bundles/seed_test.sql` only with `--with-test-seeds`

## Canonical Source Layout

- `../schema/`
  - canonical base schema SQL (`BASE_SCHEMA.sql`)
- `migrations/`
  - active canonical runtime migrations (`VYYYYMMDDHHMM__description.sql`)
- `../archive/migrations-legacy/`
  - archived legacy migrations (outside runtime migration path and not part of `master.sql`)
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

Run EF Core runtime-procedure contract guard:

```bash
./apps/api/database/scripts/guard_runtime_proc_contract.sh
```

Run migration checksum immutability guard:

```bash
./apps/api/database/scripts/guard_migration_checksums.sh
```

Run migration atomicity standards guard:

```bash
./apps/api/database/scripts/guard_migration_atomicity.sh
```

Notes:
- The atomicity guard is forward-looking and enforced for canonical migrations `>= V202602201100`.
- Older immutable migrations remain unchanged for history integrity.

Refresh migration checksum lock file intentionally (e.g., after adding a new migration file):

```bash
./apps/api/database/scripts/guard_migration_checksums.sh --update
```

Run SQL query performance baseline threshold gate:

```bash
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/run_performance_baseline.sh
```

Generated files:
- `apps/api/database/bundles/schema.sql`: base table/constraint schema bundle
- `apps/api/database/bundles/migrations.sql`: ordered migration bundle
- `apps/api/database/bundles/seed_data.sql`: baseline seed bundle only
- `apps/api/database/bundles/seed_dev.sql`: development-only seed bundle
- `apps/api/database/bundles/seed_test.sql`: test-only seed bundle
- `apps/api/database/bundles/master.sql`: one-shot deployment bundle (`base schema + migrations`)

## Execution Strategy

- Full setup (recommended): run `./scripts/bootstrap_db.sh`
- Full setup + dev seeds: `./scripts/bootstrap_db.sh --with-dev-seeds`
- Full setup + dev/test seeds: `./scripts/bootstrap_db.sh --with-dev-seeds --with-test-seeds`
- Manual schema-only setup: apply `apps/api/database/bundles/schema.sql`
- Manual migration-only setup: apply `apps/api/database/bundles/migrations.sql`
- Baseline-only seed data: apply `apps/api/database/bundles/seed_data.sql`
- Optional development seed data: apply `apps/api/database/bundles/seed_dev.sql`
- Optional test seed data: apply `apps/api/database/bundles/seed_test.sql`
- Maintenance cleanup: run `maintenance/CLEANUP_TEST_DATA.sql` manually when needed
