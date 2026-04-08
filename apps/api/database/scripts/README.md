# Database Scripts

This folder uses a source-first workflow with generated deployment bundles.

Audit snapshot: see `AUDIT_SUMMARY.md`.

## Active Migration Chain

Active canonical migrations (current order):

- `V202602200900__canonical_schema_consistency.sql`
- `V202602200910__canonical_indexes.sql`
- `V202602201000__add_fulltext_search.sql`
- `V202602201100__message_integrity_and_login_index_hardening.sql`
- `V202602201200__add_notifications_and_push_subscriptions.sql`
- `V202602211300__push_subscription_endpoint_hash_unique.sql`
- `V202602211310__messages_read_path_index.sql`
- `V202602221200__unify_post_soft_delete_semantics.sql`
- `V202602221230__fulltext_support_audit_note.sql`
- `V202602221240__conversation_participant_indexes.sql`
- `V202602221250__align_post_status_lookup_with_soft_delete.sql`
- `V202602221260__rationalize_conversation_indexes.sql`
- `V202602221300__schema_corrections.sql`
- `V202602221400__security_db_roles.sql`
- `V202602221410__audit_log.sql`
- `V202602241000__add_user_external_identities.sql`
- `V202602241500__filtered_indexes_for_soft_deletes.sql`
- `V202602241700__enforce_posts_status_domain.sql`
- `V202602251000__add_user_totp_2fa_columns.sql`
- `V202603241000__important_schema_fixes.sql`
- `V202603242145__add_missing_tables.sql`
- `V202603250100__grant_auditlog_update.sql`
- `V202603250200__grant_permissions_missing_tables.sql`
- `V202603271720__add_verification_challenges_and_session_invalidation.sql`
- `V202603281800__add_hero_banners.sql`
- `V202603291700__expand_hero_banner_image_url.sql`
- `V202603291745__seed_system_settings_defaults.sql`
- `V202603291800__seed_permissions_and_admin_role_mappings.sql`
- `V202603291830__add_categories_manage_permission.sql`
- `V202603292130__seed_maintenance_reason_and_eta.sql`
- `V202603300000__add_arabic_location_names.sql`
- `V202603300100__grant_dml_to_locations.sql`
- `V202604010000__create_post_comments_table.sql`
- `V202604010100__add_post_comment_permissions.sql`
- `V202604080100__fix_favorites_unique_constraint.sql`
- `V202604080200__messages_validate_receiver.sql`
- `V202604080300__postimages_url_max_length.sql`
- `V202604080400__add_missing_indexes.sql`
- `V202604080500__review_comment_max_length.sql`
- `V202604080600__add_notifications_is_deleted.sql`
- `V202604080700__add_external_identities_is_deleted.sql`
- `V202604080800__document_reports_polymorphic_fk.sql`
- `V202604080900__cascade_soft_deletes.sql`
- `V202604081000__cap_nvarchar_max_columns.sql`
- `V202604081100__create_data_hygiene_log.sql`
- `V202604081200__fix_reviews_unique_constraint.sql`
- `V202604081300__add_postcomments_userid_index.sql`
- `V202604081400__postcomments_depth_guard.sql`

Legacy `Tb*` migration scripts were moved under `../archive/migrations-legacy/` and are excluded from bootstrap bundles.

## Migration Policy

- Migrations are forward-only and immutable after commit.
- New migrations from `V202604081200` onward must be database-context agnostic and **must not** include `USE ...;`.
- Migrations from `V202602201100` onward must be transactional (`XACT_ABORT ON`, `TRY/CATCH`, `BEGIN/COMMIT/ROLLBACK TRANSACTION`).
- Pre-atomic baseline migrations (`V202602200900`, `V202602200910`, `V202602201000`) are marked with `ATOMICITY_EXCEPTION`.
  - Operational rule: if one of these fails in a shared environment, do a full database reset and re-apply the canonical chain from baseline.
- Legacy immutable migrations that still contain `USE ...;` are allowed as historical exceptions; bundle generation strips `USE` from migration output so execution follows the active connection/database context.

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

Run migration no-`USE` guard:

```bash
./apps/api/database/scripts/guard_migration_no_use.sh
```

Notes:
- The atomicity guard is forward-looking and enforced for canonical migrations `>= V202602201100`.
- Older immutable migrations remain unchanged for history integrity.
- Full-text policy is optional capability: migration chain must succeed even when SQL Server Full-Text is unavailable.

Refresh migration checksum lock file intentionally (e.g., after adding a new migration file):

```bash
./apps/api/database/scripts/guard_migration_checksums.sh --update
```

Run SQL query performance baseline threshold gate:

```bash
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/run_performance_baseline.sh
```

The performance baseline includes feed, search, top-sellers, and chat-history probes.

Capture SQL query plans for hot listing/seller paths:

```bash
MSSQL_SA_PASSWORD='<sa-password>' ./apps/api/database/scripts/diagnostics/capture_query_plans.sh
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
- Maintenance cleanup (dev/test only): run `apps/api/database/ops/dev-only/CLEANUP_TEST_DATA.sql` with `sqlcmd -v ALLOW_DEV_DATA_CLEANUP=1`

## Security

> ⚠️ **Development uses the `sa` account for convenience. This must NEVER reach production.**

For production deployment:

1. Create dedicated SQL logins for `tijarahjo_app` and `tijarahjo_readonly` (see V202602221400)
2. Map logins to the database users created by the security migration:
   ```sql
   CREATE LOGIN tijarahjo_app WITH PASSWORD = '<strong-password>';
   ALTER USER tijarahjo_app WITH LOGIN = tijarahjo_app;
   ```
3. Update connection strings in `appsettings.Production.json` to use `tijarahjo_app`
4. Never use `sa`, `Password123!@#`, or any weak credentials in production
5. The `tijarahjo_app_role` is restricted to DML only; DDL and schema changes are explicitly denied
