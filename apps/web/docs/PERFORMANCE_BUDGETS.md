# Frontend Performance Budgets

This project enforces bundle budgets via:

```bash
npm run perf:bundle
```

The command runs a production build and validates `dist/assets` sizes using `tools/check-bundle-budget.mjs`.

## Current enforced limits (gzip)

- Largest eager JS chunk: `<= 90KB`
- Initial JS budget from the Vite entry import graph: `<= 190KB`
- Largest non-chart lazy JS chunk: `<= 70KB`
- `recharts-vendor-*` chunk: `<= 90KB`
- `victory-vendor-*` chunk: `<= 25KB`
- Largest CSS chunk: `<= 24KB`
- `react-vendor-*` chunk: `<= 50KB`

The budget measures startup cost from the static import graph rooted at the Vite entry manifest, so eager JS is still counted correctly even when specific HTML preloads are filtered. Deferred admin chart code keeps its own explicit vendor budgets instead of relaxing the generic lazy-chunk guardrail for the rest of the app.

If any budget is exceeded, the script exits with non-zero status to fail CI.
