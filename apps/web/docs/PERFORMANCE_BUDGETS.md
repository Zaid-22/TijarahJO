# Frontend Performance Budgets

This project enforces bundle budgets via:

```bash
npm run perf:bundle
```

The command runs a production build and validates `dist/assets` sizes using `tools/check-bundle-budget.mjs`.

## Current enforced limits (gzip)

- Largest JS chunk: `<= 70KB`
- Total JS chunks combined: `<= 330KB`
- Largest CSS chunk: `<= 20KB`
- `AppRoutes-*` chunk: `<= 35KB`
- `react-vendor-*` chunk: `<= 50KB`

If any budget is exceeded, the script exits with non-zero status to fail CI.
