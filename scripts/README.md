# Scripts

Canonical operational entrypoints for local development and verification.

## Primary Commands

- `./scripts/check_structure.sh`: enforce path conventions and stale-path checks
- `./scripts/run-dev.sh`: run backend + frontend locally
- `./scripts/bootstrap_db.sh`: rebuild DB, start backend, optional full API verification
- `./scripts/verify_all_apis.sh`: full backend API regression checks
- `./scripts/test_delete_post_with_chat.sh`: focused regression scenario
- `./scripts/kill-port.sh`: kill process by port for local recovery
- `./scripts/contracts/export_openapi.sh`: export OpenAPI from running backend
- `./scripts/contracts/generate_web_types.sh`: generate TypeScript contracts from OpenAPI
