SHELL := /usr/bin/env bash

# Prefer Docker Compose v2 plugin, fallback to docker-compose if needed.
DOCKER_COMPOSE ?= $(shell \
	if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		echo "docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
		echo "docker-compose"; \
	fi)

.PHONY: help \
	up down logs \
	bootstrap bootstrap-no-verify \
	sql-bundles sql-audit \
	verify smoke \
	backend-build frontend-lint frontend-build \
	full-check \
	ci-backend ci-frontend ci-local

help:
	@echo "Available targets:"
	@echo "  make up                  # Start SQL container"
	@echo "  make down                # Stop SQL container"
	@echo "  make logs                # Tail SQL container logs"
	@echo "  make bootstrap           # Reset DB + start backend + run full verify_all_apis"
	@echo "  make bootstrap-no-verify # Reset DB + start backend (skip verify, keep backend running)"
	@echo "  make sql-bundles         # Regenerate consolidated SQL bundle files"
	@echo "  make sql-audit           # Run SQL inventory and duplicate checks"
	@echo "  make verify              # Run full API verification"
	@echo "  make smoke               # Run backend smoke checks"
	@echo "  make backend-build       # Build backend API project"
	@echo "  make frontend-lint       # Lint frontend"
	@echo "  make frontend-build      # Build frontend"
	@echo "  make full-check          # backend-build + frontend-lint + frontend-build"
	@echo "  make ci-backend          # bootstrap + full backend API verification"
	@echo "  make ci-frontend         # frontend lint + build"
	@echo "  make ci-local            # ci-backend + ci-frontend"

up:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "Error: docker compose (or docker-compose) is required."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) up -d

down:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "Error: docker compose (or docker-compose) is required."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) down

logs:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "Error: docker compose (or docker-compose) is required."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) logs -f

bootstrap:
	./bootstrap_db.sh

bootstrap-no-verify:
	./bootstrap_db.sh --no-verify --keep-backend

sql-bundles:
	./TijarahJo-Backend/TijarahJoDBAPI/database/scripts/build_sql_bundles.sh

sql-audit:
	./TijarahJo-Backend/TijarahJoDBAPI/database/scripts/audit_sql_files.sh

verify:
	./verify_all_apis.sh

smoke:
	./TijarahJo-Backend/TijarahJoDBAPI/tests/backend_smoke.sh

backend-build:
	dotnet build --no-restore TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI/TijarahJoDBAPI.csproj

frontend-lint:
	cd TijarahJo-frontend && npm run lint -- --max-warnings 0

frontend-build:
	cd TijarahJo-frontend && npm run build

full-check: backend-build frontend-lint frontend-build

ci-backend: bootstrap

ci-frontend: frontend-lint frontend-build

ci-local: ci-backend ci-frontend
