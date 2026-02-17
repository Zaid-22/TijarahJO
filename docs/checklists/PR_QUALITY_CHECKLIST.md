# PR Quality Checklist

Use this checklist before opening or merging a pull request.

---

## 1. Local Baseline

- [ ] Pull latest changes from target branch.
- [ ] Ensure `.env` is configured for local backend/frontend runs.
- [ ] Confirm Docker is running (required for DB-backed API checks).

---

## 2. Fast Local Quality Gates

Run these first:

```bash
make backend-build
make frontend-lint
make frontend-build
```

Expected:
- backend build succeeds
- frontend lint succeeds with zero warnings
- frontend production build succeeds

---

## 3. Backend API Gates

Run backend API checks:

```bash
make ci-backend
```

This runs:
- database bootstrap/reset
- backend startup
- full API regression suite (`verify_all_apis.sh`)

Expected:
- verification summary reports `FAIL=0`

Optional quick sanity check (faster than full verify):

```bash
make bootstrap-no-verify
make smoke
```

Expected:
- smoke summary reports `FAIL=0`

---

## 4. Full Local CI Mirror

Run both backend and frontend gates:

```bash
make ci-local
```

Expected:
- backend verification passes
- frontend lint/build pass

---

## 5. CI Workflow Expectations

The repository enforces:
- backend API checks via `.github/workflows/backend-api-checks.yml`
- frontend quality checks via `.github/workflows/frontend-quality-checks.yml`

Before merging:
- [ ] GitHub Actions are green for your PR.
- [ ] Any failures are fixed with new commits (no ignored red jobs).

---

## 6. Final PR Sanity

- [ ] PR description includes what changed and why.
- [ ] Breaking changes and migrations are documented.
- [ ] New scripts/docs are referenced in relevant README files.
- [ ] No secrets or local credentials are committed.
