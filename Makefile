.PHONY: all start stop down full-down re ensure-env ensure-certs \
       setup dev db-setup db-test-setup install

all: start

start: ensure-env ensure-certs
	docker compose build --no-cache && docker compose up -d

stop:
	docker compose stop

down:
	docker compose down

full-down:
	docker compose down -v

re: full-down start

ensure-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		SECRET=$$(openssl rand -hex 32); \
		sed -i '' "s/SESSION_SECRET=change-me-in-production/SESSION_SECRET=$$SECRET/" .env; \
		echo "Generated .env with random SESSION_SECRET"; \
	fi

ensure-certs:
	bash docker/generate-certs.sh


setup: install db-setup dev

install:
	pnpm install

db-setup:
	@docker start transcendence-db 2>/dev/null || \
		docker run -d --name transcendence-db \
		  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres \
		  -p 54322:5432 postgres:17
	@docker start transcendence-redis 2>/dev/null || \
		docker run -d --name transcendence-redis -p 6379:6379 redis:7-alpine
	@sleep 2
	@test -f apps/api/.env || printf 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres\nDATABASE_POOL_SIZE=10\nSESSION_SECRET=%s\nSESSION_TTL_SECONDS=1800\n' "$$(openssl rand -hex 32)" > apps/api/.env
	pnpm --filter api db:generate
	pnpm --filter api db:migrate
	pnpm --filter api db:seed

db-test-setup:
	docker exec transcendence-db psql -U postgres -c "CREATE DATABASE transcendence_test;" 2>/dev/null || true
	DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test" \
	  pnpm --filter api db:migrate:deploy
	DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test" \
	  pnpm --filter api db:seed

dev:
	pnpm dev