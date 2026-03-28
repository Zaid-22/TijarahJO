# Integration Tests

This folder contains .NET integration tests that execute against a running backend instance.
They are live HTTP checks, not in-memory test-host tests.

## Run

```bash
make backend-live-tests
```

This make target defaults `BASE_URL` to `http://localhost:5033`.

Equivalent direct command:

```bash
BASE_URL=http://localhost:5033 dotnet test ./apps/api/tests/Integration.Tests/TijarahJo.Integration.Tests.csproj -c Release
```

If `BASE_URL` is not set and you run the project directly, the tests are skipped with a message explaining that live backend HTTP integration requires a running backend.

CI still executes this project with `BASE_URL=http://localhost:5033` in `.github/workflows/backend-api-checks.yml`.
