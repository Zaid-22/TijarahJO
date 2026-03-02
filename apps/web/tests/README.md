# Frontend Test Layout

- `unit/`: isolated unit/component-level tests
- `integration/`: multi-module integration tests
- `e2e/`: runtime-policy and workflow contract tests (Node test runner)
- `browser-e2e/`: real browser end-to-end journeys (Playwright)
- `browser-e2e/backend-live.spec.cjs`: backend-connected browser journeys (no mock API)
- `frontend_api_contract.sh`: API contract checks for backend endpoints consumed by frontend
