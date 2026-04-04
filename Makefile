# Host port for standalone dev containers (transcendence-db). Use 54322 to avoid clashing with another Postgres on 5432.
DB_HOST_PORT := 54322

.PHONY: all start stop down full-down re ensure-certs \
       setup dev db-setup db-test-setup install

all: start

start: ensure-certs
	docker compose build --no-cache && docker compose up -d

stop:
	docker compose stop

down:
	docker compose down

full-down:
	docker compose down -v

re: full-down start


ensure-certs:
	bash docker/generate-certs.sh


setup: install db-setup dev

install:
	pnpm install

db-setup:
	@docker start transcendence-db 2>/dev/null || \
		docker run -d --name transcendence-db \
		  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres \
		  -p $(DB_HOST_PORT):5432 postgres:17
	@docker start transcendence-redis 2>/dev/null || \
		docker run -d --name transcendence-redis -p 6379:6379 redis:7-alpine
	@echo "Waiting for PostgreSQL on port $(DB_HOST_PORT)..."; \
	attempt=0; \
	until docker exec transcendence-db pg_isready -U postgres -d postgres >/dev/null 2>&1; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -gt 60 ]; then echo "PostgreSQL did not become ready in time (docker logs transcendence-db)."; exit 1; fi; \
		sleep 1; \
	done; \
	echo "PostgreSQL is ready."
	@test -f apps/api/.env || printf 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:$(DB_HOST_PORT)/postgres\nDATABASE_POOL_SIZE=10\nSESSION_SECRET=%s\nSESSION_TTL_SECONDS=1800\n' "$$(openssl rand -hex 32)" > apps/api/.env
	pnpm --filter api db:generate
	pnpm --filter api db:migrate
	pnpm --filter api db:seed

db-test-setup:
	docker exec transcendence-db psql -U postgres -c "CREATE DATABASE transcendence_test;" 2>/dev/null || true
	DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:$(DB_HOST_PORT)/transcendence_test" \
	  pnpm --filter api db:migrate:deploy
	DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:$(DB_HOST_PORT)/transcendence_test" \
	  pnpm --filter api db:seed

dev:
	pnpm dev