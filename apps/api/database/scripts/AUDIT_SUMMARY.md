# SQL Audit Summary

Audit date: 2026-02-21

Regenerate this audit snapshot with:

```bash
make sql-audit
```

## Inventory Snapshot

- Total SQL files (`database/schema` + `database/scripts` + `database/archive` + `database/bundles`): `43`
- Active canonical SQL files: `18`
  - Canonical base schema files: `1`
  - Active canonical migrations: `12`
  - Seeds (`baseline` + `dev` + `test`): `5`
  - Procedures in active runtime chain: `0`
- Legacy archived migrations: `17`
- Generated bundles: `6`

## Active Canonical Migration Chain

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

These are the only migration scripts included in generated deployment bundles.

## Archived Legacy Migrations

Legacy `Tb*` migration history is retained under:

- `apps/api/database/archive/migrations-legacy/`

Files in this folder are excluded from active bundle generation and should only be used for manual legacy forensics/migration planning.

## Runtime Contract Notes

- EF Core is the canonical runtime data-access path.
- Runtime stored procedure contracts are forbidden and enforced by `guard_runtime_proc_contract.sh`.
- Generated bundle files under `apps/api/database/bundles/` are not source of truth and are ignored by Git.
