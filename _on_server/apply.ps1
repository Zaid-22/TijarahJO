$OnServerDir = $PSScriptRoot
$RootDir = (Resolve-Path (Join-Path $OnServerDir "..")).Path
$SourceEnv = Join-Path $OnServerDir ".env"
$TargetEnv = Join-Path $RootDir ".env"

if (-not (Test-Path $SourceEnv)) {
    Write-Error "Missing $SourceEnv. Copy .env.example to .env and fill in production values."
    exit 1
}

Copy-Item -Path $SourceEnv -Destination $TargetEnv -Force
Copy-Item -Path $TargetEnv -Destination (Join-Path $RootDir "infra\.env") -Force
Write-Host "Applied: _on_server\.env -> .env"
Write-Host "Copied: infra\.env (for Docker Compose variable substitution)"
Write-Host "Repo root: $RootDir"
