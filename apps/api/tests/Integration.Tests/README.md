# Integration Tests

This folder contains .NET integration tests that execute against a running backend instance.

## Run

```bash
BASE_URL=http://localhost:5033 dotnet test ./apps/api/tests/Integration.Tests/TijarahJo.Integration.Tests.csproj -c Release
```

Set `BASE_URL` explicitly to execute HTTP integration checks against a running backend.
