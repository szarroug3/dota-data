# Makefile for Dota Data Project

# Variables
NEXT_PORT ?= 3000
SWAGGER_PORT ?= 8080
LOCAL_IP := $(shell ipconfig getifaddr en0 2>/dev/null || ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1 | head -n 1)
NVM_DIR ?= $(HOME)/.nvm

# Run Next.js dev server (uses Node version from .nvmrc)
next-dev:
	. $(NVM_DIR)/nvm.sh && nvm use && pnpm dev

# Install dependencies (uses Node version from .nvmrc)
install:
	. $(NVM_DIR)/nvm.sh && nvm use && pnpm install

# Run Swagger UI Docker (host.docker.internal, for Mac/Windows)
swagger-docker:
	docker run -p $(SWAGGER_PORT):8080 -e SWAGGER_JSON_URL=http://host.docker.internal:$(NEXT_PORT)/api/openapi swaggerapi/swagger-ui

# Run Swagger UI Docker (local IP, for Linux or fallback)
swagger-docker-ip:
	docker run -p $(SWAGGER_PORT):8080 -e SWAGGER_JSON_URL=http://$(LOCAL_IP):$(NEXT_PORT)/api/openapi swaggerapi/swagger-ui

# Print your local IP address
local-ip:
	@echo $(LOCAL_IP)

# Stop all Swagger UI Docker containers
stop-swagger:
	docker ps -q --filter ancestor=swaggerapi/swagger-ui | xargs -r docker stop

# Generate OpenAPI spec from comments (uses --glob for all .ts files)
generate-openapi:
	pnpm generate:openapi

.PHONY: next-dev install swagger-docker swagger-docker-ip local-ip stop-swagger generate-openapi 