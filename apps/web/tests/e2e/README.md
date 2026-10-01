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

By default, this suite runs the mocked browser workflows only and excludes
`backend-live.spec.cjs` so the result is not padded with an intentional skip.
To include the backend-connected browser journey in the chromium pass, run:

```bash
cd apps/web
E2E_BACKEND_LIVE=1 npm run test:e2e:browser
```

## Backend-Connected Browser E2E

To execute journeys against a real backend (no mock API interception), run:

```bash
cd apps/web
npm run test:e2e:backend-live
```

The backend-live signup journey depends on baseline location seed data and selects
both city and area from the real dropdown fields rendered by the auth form.
