SHELL := /usr/bin/env bash

# Prefer Docker Compose v2 plugin, fallback to docker-compose if needed.
DOCKER_COMPOSE ?= $(shell \
	if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		echo "docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
		echo "docker-compose"; \
	fi)
DOCKER_COMPOSE_FILE ?= infra/docker-compose.yml

.PHONY: help \
	up down logs \
	structure-check \
	bootstrap bootstrap-no-verify \
	sql-bundles sql-audit sql-guard \
	contracts-export contracts-types \
	verify smoke backend-integration backend-live-tests backend-live-check frontend-contract \
	backend-build backend-test backend-unit-test frontend-lint frontend-test frontend-build \
	quality-gates full-check contracts-check \
	ci-backend ci-frontend ci-local

help:
	@echo "Available targets:"
	@echo "  make up                  # Start SQL container"
	@echo "  make down                # Stop SQL container"
	@echo "  make logs                # Tail SQL container logs"
	@echo "  make structure-check     # Verify repo path conventions and no legacy wrappers"
	@echo "  make bootstrap           # Reset DB + start backend + run full verify_all_apis"
	@echo "  make bootstrap-no-verify # Reset DB + start backend (skip verify, keep backend running)"
	@echo "  make sql-bundles         # Regenerate consolidated SQL bundle files"
	@echo "  make sql-audit           # Run SQL inventory and duplicate checks"
	@echo "  make sql-guard           # Fail on duplicate active stored procedure definitions"
	@echo "  make contracts-export    # Export OpenAPI from running backend"
	@echo "  make contracts-types     # Generate TypeScript types from OpenAPI"
	@echo "  make verify              # Run full live API verification against a running backend"
	@echo "  make smoke               # Run backend smoke checks against a running backend"
	@echo "  make backend-integration # Run backend integration contract checks against a running backend"
	@echo "  make backend-live-tests  # Run the .NET live HTTP integration test project (defaults BASE_URL to http://localhost:5033)"
	@echo "  make backend-live-check  # Run smoke + live HTTP integration tests + contract checks + full API verification"
	@echo "  make frontend-contract   # Run frontend API contract checks"
	@echo "  make backend-build       # Build backend API project"
	@echo "  make backend-test        # Run backend unit tests only (no live HTTP integration)"
	@echo "  make backend-unit-test   # Alias for backend-test"
	@echo "  make frontend-lint       # Lint frontend"
	@echo "  make frontend-test       # Run frontend unit tests"
	@echo "  make frontend-build      # Build frontend"
	@echo "  make quality-gates       # Fast local gates only: structure-check + build/unit/static checks"
	@echo "  make contracts-check     # backend-integration + frontend-contract"
	@echo "  make full-check          # Alias for quality-gates (no live HTTP integration)"
	@echo "  make ci-backend          # bootstrap + full live backend verification"
	@echo "  make ci-frontend         # structure-check + frontend lint/test/build"
	@echo "  make ci-local            # ci-backend + ci-frontend"

structure-check:
	./scripts/check_structure.sh

up:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "Error: docker compose (or docker-compose) is required."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

down:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "Error: docker compose (or docker-compose) is required."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

logs:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "Error: docker compose (or docker-compose) is required."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f

bootstrap:
	./scripts/bootstrap_db.sh

bootstrap-no-verify:
	./scripts/bootstrap_db.sh --no-verify --keep-backend

sql-bundles:
	./apps/api/database/scripts/build_sql_bundles.sh

sql-audit:
	./apps/api/database/scripts/audit_sql_files.sh

sql-guard:
	./apps/api/database/scripts/guard_no_duplicate_procs.sh

contracts-export:
	./scripts/contracts/export_openapi.sh

contracts-types:
	./scripts/contracts/generate_web_types.sh

verify:
	./scripts/verify_all_apis.sh

smoke:
	./apps/api/tests/contracts/backend_smoke.sh

backend-integration:
	./apps/api/tests/contracts/backend_integration_contract.sh

backend-live-tests:
	@BASE_URL="$${BASE_URL:-http://localhost:5033}"; \
	echo "Running live backend .NET integration tests against $$BASE_URL"; \
	BASE_URL="$$BASE_URL" dotnet test apps/api/tests/Integration.Tests/TijarahJo.Integration.Tests.csproj -c Release --verbosity normal

backend-live-check:
	@BASE_URL="$${BASE_URL:-http://localhost:5033}"; \
	echo "Running live backend verification against $$BASE_URL"; \
	BASE_URL="$$BASE_URL" ./apps/api/tests/contracts/backend_smoke.sh; \
	BASE_URL="$$BASE_URL" dotnet test apps/api/tests/Integration.Tests/TijarahJo.Integration.Tests.csproj -c Release --verbosity normal; \
	BASE_URL="$$BASE_URL" ./apps/api/tests/contracts/backend_integration_contract.sh; \
	BASE_URL="$$BASE_URL" ./scripts/verify_all_apis.sh

frontend-contract:
	./apps/web/tests/frontend_api_contract.sh

backend-build:
	dotnet build --no-restore apps/api/src/Api/TijarahJo.Api.csproj

backend-test:
	dotnet test apps/api/tests/Api.Tests/TijarahJo.Api.Tests.csproj -c Release --verbosity normal

backend-unit-test: backend-test

frontend-lint:
	cd apps/web && npm run lint -- --max-warnings 0

frontend-test:
	cd apps/web && npm test

frontend-build:
	cd apps/web && npm run build

quality-gates: structure-check backend-build backend-test frontend-lint frontend-test frontend-build

full-check: quality-gates

contracts-check: backend-integration frontend-contract

ci-backend: structure-check bootstrap

ci-frontend: structure-check frontend-lint frontend-test frontend-build

ci-local: ci-backend ci-frontend
