# Path Conventions

This document defines repository path ownership and dependency boundaries.

## 1. Root Ownership

Top-level directories are reserved for:

- `.github/`: CI workflows and repo automation
- `apps/`: deployable applications (`web`, `api`)
- `contracts/`: shared API/schema contracts
- `docs/`: active and archived documentation
- `infra/`: infrastructure manifests and environment templates
- `scripts/`: canonical operational entrypoints

No legacy app roots or wrapper scripts should exist at repository root.

## 2. Backend Boundaries (`apps/api/src`)

- `Domain/`: core business models and rules; no infrastructure dependencies.
- `Application/`: use cases and orchestration; depends on `Domain`.
- `Infrastructure/`: database and external adapters; implements interfaces from inner layers.
- `Api/`: host, endpoints, DI wiring; composes all layers.

Dependency direction must remain inward (outer layers depend on inner layers).

## 3. Frontend Boundaries (`apps/web/src`)

- `app/`: app bootstrap, providers, route shell.
- `features/`: feature modules (auth, chat, marketplace, admin, etc.).
- `shared/`: reusable primitives shared across features.

Rules:

- `shared/` must not import feature-specific modules.
- `features/*` may depend on `shared/`.
- `app/` may depend on `features/` and `shared/`.

## 4. Test Taxonomy

- Frontend:
  - `apps/web/tests/unit/`
  - `apps/web/tests/integration/`
  - `apps/web/tests/e2e/`
- Backend:
  - `apps/api/tests/Api.Tests/`
  - `apps/api/tests/Integration.Tests/`
  - `apps/api/tests/contracts/`

Keep test assets in the test tree, not in application source folders.

## 5. Documentation Lifecycle

- Active docs live under domain-specific folders in `docs/`.
- Historical content goes to matching `archive/` folders.
- Do not keep duplicate "active + historical" versions in the same folder level.

## 6. Operational Entrypoints

Only scripts under `scripts/` are canonical operational commands:

- `scripts/run-dev.sh`
- `scripts/bootstrap_db.sh`
- `scripts/verify_all_apis.sh`
- `scripts/test_delete_post_with_chat.sh`
- `scripts/kill-port.sh`

Root-level wrapper scripts are not allowed.

## 7. Governance

- Structure and stale-path enforcement: `scripts/check_structure.sh`
- Local quality gate baseline:
  - `make structure-check`
  - `make full-check`
  - `make contracts-check`
