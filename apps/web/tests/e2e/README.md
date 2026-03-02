# Runtime Policy Tests

Node-run workflow and resilience tests for runtime policy behavior.

## Run

```bash
cd apps/web
npm run test:policy:e2e
```

## Browser E2E

Real browser journey tests live in `tests/browser-e2e` and run via:

```bash
cd apps/web
npm run test:e2e:browser
```

## Backend-Connected Browser E2E

To execute journeys against a real backend (no mock API interception), run:

```bash
cd apps/web
PW_BYPASS_CSP=0 VITE_API_BASE_URL=http://localhost:5033/api npx playwright test --config=playwright.config.cjs --project=chromium tests/browser-e2e/backend-live.spec.cjs
```
