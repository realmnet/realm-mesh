# Protocol Generation Makefile
OPENAPI_GENERATOR = npx @openapitools/openapi-generator-cli
SPEC_FILE = interrealm-protocol.yaml
JAVA_OUTPUT = generated/java
TS_OUTPUT = generated/typescript

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RESET := \033[0m

.PHONY: all clean generate generate-java generate-typescript install validate help

# Default target
all: clean generate

help:
	@echo "$(CYAN)InterRealm Protocol Code Generation$(RESET)"
	@echo ""
	@echo "Available targets:"
	@echo "  $(GREEN)make install$(RESET)        - Install OpenAPI Generator CLI"
	@echo "  $(GREEN)make validate$(RESET)       - Validate the OpenAPI spec"
	@echo "  $(GREEN)make generate$(RESET)       - Generate all code (Java + TypeScript)"
	@echo "  $(GREEN)make generate-java$(RESET)  - Generate Java models only"
	@echo "  $(GREEN)make generate-ts$(RESET)    - Generate TypeScript models only"
	@echo "  $(GREEN)make clean$(RESET)          - Clean generated code"
	@echo "  $(GREEN)make all$(RESET)            - Clean and regenerate everything"

install:
	@echo "$(CYAN)Installing OpenAPI Generator CLI...$(RESET)"
	npm install @openapitools/openapi-generator-cli --save-dev
	@echo "$(GREEN)✓ OpenAPI Generator CLI installed$(RESET)"

validate:
	@echo "$(CYAN)Validating OpenAPI specification...$(RESET)"
	$(OPENAPI_GENERATOR) validate -i $(SPEC_FILE)
	@echo "$(GREEN)✓ Specification is valid$(RESET)"

clean:
	@echo "$(YELLOW)Cleaning generated code...$(RESET)"
	rm -rf $(JAVA_OUTPUT)
	rm -rf $(TS_OUTPUT)
	@echo "$(GREEN)✓ Cleaned$(RESET)"

generate-java:
	@echo "$(CYAN)Generating Java models...$(RESET)"
	@mkdir -p $(JAVA_OUTPUT)
	$(OPENAPI_GENERATOR) generate \
		-i $(SPEC_FILE) \
		-g java \
		-o $(JAVA_OUTPUT) \
		--package-name io.realmmesh.protocol \
		--model-package io.realmmesh.protocol.models \
		--api-package io.realmmesh.protocol.api \
		--invoker-package io.realmmesh.protocol \
		--group-id io.realmmesh \
		--artifact-id interrealm-protocol \
		--artifact-version 1.0.0 \
		--library native \
		--additional-properties=dateLibrary=java8,serializationLibrary=jackson,useJakartaEe=true,hideGenerationTimestamp=true,openApiNullable=false,generateModelTests=false,generateApiTests=false,generateModelDocumentation=false,generateApiDocumentation=false
	@echo "$(GREEN)✓ Java models generated in $(JAVA_OUTPUT)$(RESET)"

generate-typescript: generate-ts

generate-ts:
	@echo "$(CYAN)Generating TypeScript models...$(RESET)"
	@mkdir -p $(TS_OUTPUT)
	$(OPENAPI_GENERATOR) generate \
		-i $(SPEC_FILE) \
		-g typescript-axios \
		-o $(TS_OUTPUT) \
		--additional-properties=npmName=@realmmesh/protocol,npmVersion=1.0.0,supportsES6=true,withInterfaces=true,modelPropertyNaming=camelCase,enumPropertyNaming=UPPERCASE
	@echo "$(GREEN)✓ TypeScript models generated in $(TS_OUTPUT)$(RESET)"

generate: validate
	@echo "$(CYAN)Generating all protocol models...$(RESET)"
	@$(MAKE) generate-java
	@$(MAKE) generate-typescript
	@echo "$(GREEN)✓ All models generated successfully$(RESET)"

# Watch for changes and regenerate
watch:
	@echo "$(CYAN)Watching for changes in $(SPEC_FILE)...$(RESET)"
	@while true; do \
		$(MAKE) generate; \
		fswatch -1 $(SPEC_FILE) > /dev/null 2>&1 || inotifywait -e modify $(SPEC_FILE) > /dev/null 2>&1; \
	done

# Build targets for integration
.PHONY: build-java build-typescript

build-java: generate-java
	@echo "$(CYAN)Building Java artifacts...$(RESET)"
	@if [ -f $(JAVA_OUTPUT)/pom.xml ]; then \
		cd $(JAVA_OUTPUT) && mvn clean package; \
	else \
		echo "$(YELLOW)No pom.xml found, skipping Maven build$(RESET)"; \
	fi

build-typescript: generate-typescript
	@echo "$(CYAN)Building TypeScript package...$(RESET)"
	@if [ -f $(TS_OUTPUT)/package.json ]; then \
		cd $(TS_OUTPUT) && npm install && npm run build; \
	else \
		echo "$(YELLOW)No package.json found, skipping npm build$(RESET)"; \
	fi