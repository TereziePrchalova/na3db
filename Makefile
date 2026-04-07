# Variables
APP_NAME=na3db
COMPOSE=docker compose

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build        Build containers"
	@echo "  make up           Start containers"
	@echo "  make down         Stop containers"
	@echo "  make restart      Restart containers"
	@echo "  make logs         Show logs"
	@echo "  make clean        Remove containers, volumes, images"
	@echo "  make reset-db     Reset database (⚠️ deletes data)"

# Build containers
.PHONY: build
build:
	$(COMPOSE) build

# Start containers (detached)
.PHONY: up
up:
	$(COMPOSE) up -d

# Stop containers
.PHONY: down
down:
	$(COMPOSE) down

# Restart everything
.PHONY: restart
restart: down up

# Logs
.PHONY: logs
logs:
	$(COMPOSE) logs -f

# Full cleanup
.PHONY: clean
clean:
	$(COMPOSE) down -v --rmi all --remove-orphans

# Reset only DB (dangerous)
.PHONY: reset-db
reset-db:
	$(COMPOSE) down -v
	$(COMPOSE) up -d db

# Pull + rebuild + restart (THIS is your main command)
.PHONY: deploy
deploy:
	git pull
	$(COMPOSE) down
	$(COMPOSE) up -d --build

DB_CONTAINER=na3db-db
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=na3db

.PHONY: db-init

db-init:
	docker exec -i $(DB_CONTAINER) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME) < init.sql