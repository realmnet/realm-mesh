# Protocol Generation Makefile
OPENAPI_GENERATOR = npx @openapitools/openapi-generator-cli
INTERREALM_SPEC = interrealm-protocol.yaml
CONTROL_PLANE_SPEC = control-plane-api.yaml
JAVA_OUTPUT = generated/java
TS_OUTPUT = generated/typescript
CONTROL_PLANE_JAVA_OUTPUT = generated/control-plane-java
CONTROL_PLANE_TS_OUTPUT = generated/control-plane-typescript

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RESET := \033[0m

.PHONY: all clean generate generate-java generate-typescript generate-control-plane generate-control-plane-java generate-control-plane-typescript install validate help

# Default target
all: clean generate generate-control-plane

help:
	@echo "$(CYAN)InterRealm Protocol Code Generation$(RESET)"
	@echo ""
	@echo "Available targets:"
	@echo "  $(GREEN)make install$(RESET)                      - Install OpenAPI Generator CLI"
	@echo "  $(GREEN)make validate$(RESET)                     - Validate the OpenAPI specs"
	@echo "  $(GREEN)make generate$(RESET)                     - Generate InterRealm protocol code (Java + TypeScript)"
	@echo "  $(GREEN)make generate-java$(RESET)                - Generate InterRealm Java models only"
	@echo "  $(GREEN)make generate-ts$(RESET)                  - Generate InterRealm TypeScript models only"
	@echo "  $(GREEN)make generate-control-plane$(RESET)       - Generate Control Plane API code (Java + TypeScript)"
	@echo "  $(GREEN)make generate-control-plane-java$(RESET)  - Generate Control Plane Java models and controllers"
	@echo "  $(GREEN)make generate-control-plane-ts$(RESET)    - Generate Control Plane TypeScript models"
	@echo "  $(GREEN)make clean$(RESET)                        - Clean all generated code"
	@echo "  $(GREEN)make all$(RESET)                          - Clean and regenerate everything"

install:
	@echo "$(CYAN)Installing OpenAPI Generator CLI...$(RESET)"
	npm install @openapitools/openapi-generator-cli --save-dev
	@echo "$(GREEN)✓ OpenAPI Generator CLI installed$(RESET)"

validate:
	@echo "$(CYAN)Validating OpenAPI specifications...$(RESET)"
	$(OPENAPI_GENERATOR) validate -i $(INTERREALM_SPEC)
	$(OPENAPI_GENERATOR) validate -i $(CONTROL_PLANE_SPEC)
	@echo "$(GREEN)✓ All specifications are valid$(RESET)"

clean:
	@echo "$(YELLOW)Cleaning generated code...$(RESET)"
	rm -rf $(JAVA_OUTPUT)
	rm -rf $(TS_OUTPUT)
	rm -rf $(CONTROL_PLANE_JAVA_OUTPUT)
	rm -rf $(CONTROL_PLANE_TS_OUTPUT)
	@echo "$(GREEN)✓ Cleaned$(RESET)"

generate-java:
	@echo "$(CYAN)Generating InterRealm Java models...$(RESET)"
	@mkdir -p $(JAVA_OUTPUT)
	$(OPENAPI_GENERATOR) generate \
		-i $(INTERREALM_SPEC) \
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
	@echo "$(GREEN)✓ InterRealm Java models generated in $(JAVA_OUTPUT)$(RESET)"

generate-typescript: generate-ts

generate-ts:
	@echo "$(CYAN)Generating InterRealm TypeScript models...$(RESET)"
	@mkdir -p $(TS_OUTPUT)
	$(OPENAPI_GENERATOR) generate \
		-i $(INTERREALM_SPEC) \
		-g typescript-axios \
		-o $(TS_OUTPUT) \
		--additional-properties=npmName=@realmmesh/protocol,npmVersion=1.0.0,supportsES6=true,withInterfaces=true,modelPropertyNaming=camelCase,enumPropertyNaming=UPPERCASE
	@echo "$(GREEN)✓ InterRealm TypeScript models generated in $(TS_OUTPUT)$(RESET)"

generate: validate
	@echo "$(CYAN)Generating InterRealm protocol models...$(RESET)"
	@$(MAKE) generate-java
	@$(MAKE) generate-typescript
	@echo "$(GREEN)✓ InterRealm protocol models generated successfully$(RESET)"

generate-control-plane-java:
	@echo "$(CYAN)Generating Control Plane Java models and controllers...$(RESET)"
	@mkdir -p $(CONTROL_PLANE_JAVA_OUTPUT)
	$(OPENAPI_GENERATOR) generate \
		-i $(CONTROL_PLANE_SPEC) \
		-g spring \
		-o $(CONTROL_PLANE_JAVA_OUTPUT) \
		--package-name io.realmmesh.controlplane \
		--model-package io.realmmesh.controlplane.models \
		--api-package io.realmmesh.controlplane.controllers \
		--invoker-package io.realmmesh.controlplane \
		--group-id io.realmmesh \
		--artifact-id control-plane-api \
		--artifact-version 1.0.0 \
		--additional-properties=dateLibrary=java8,serializationLibrary=jackson,useJakartaEe=true,hideGenerationTimestamp=true,openApiNullable=false,generateModelTests=false,generateApiTests=false,generateModelDocumentation=false,generateApiDocumentation=false,interfaceOnly=true,skipDefaultInterface=true,useTags=true
	@echo "$(GREEN)✓ Control Plane Java models and controllers generated in $(CONTROL_PLANE_JAVA_OUTPUT)$(RESET)"

generate-control-plane-typescript: generate-control-plane-ts

generate-control-plane-ts:
	@echo "$(CYAN)Generating Control Plane TypeScript models...$(RESET)"
	@mkdir -p $(CONTROL_PLANE_TS_OUTPUT)
	$(OPENAPI_GENERATOR) generate \
		-i $(CONTROL_PLANE_SPEC) \
		-g typescript-axios \
		-o $(CONTROL_PLANE_TS_OUTPUT) \
		--additional-properties=npmName=@realmmesh/control-plane-api,npmVersion=1.0.0,supportsES6=true,withInterfaces=true,modelPropertyNaming=camelCase,enumPropertyNaming=UPPERCASE
	@echo "$(GREEN)✓ Control Plane TypeScript models generated in $(CONTROL_PLANE_TS_OUTPUT)$(RESET)"

generate-control-plane: validate
	@echo "$(CYAN)Generating Control Plane API models and controllers...$(RESET)"
	@$(MAKE) generate-control-plane-java
	@$(MAKE) generate-control-plane-typescript
	@echo "$(GREEN)✓ Control Plane API models and controllers generated successfully$(RESET)"

# Watch for changes and regenerate
watch:
	@echo "$(CYAN)Watching for changes in $(INTERREALM_SPEC) and $(CONTROL_PLANE_SPEC)...$(RESET)"
	@while true; do \
		$(MAKE) generate generate-control-plane; \
		fswatch -1 $(INTERREALM_SPEC) $(CONTROL_PLANE_SPEC) > /dev/null 2>&1 || inotifywait -e modify $(INTERREALM_SPEC) $(CONTROL_PLANE_SPEC) > /dev/null 2>&1; \
	done

# Build targets for integration
.PHONY: build-java build-typescript build-control-plane-java build-control-plane-typescript build-all

build-java: generate-java
	@echo "$(CYAN)Building InterRealm Java artifacts...$(RESET)"
	@if [ -f $(JAVA_OUTPUT)/pom.xml ]; then \
		cd $(JAVA_OUTPUT) && mvn clean package; \
	else \
		echo "$(YELLOW)No pom.xml found, skipping Maven build$(RESET)"; \
	fi

build-typescript: generate-typescript
	@echo "$(CYAN)Building InterRealm TypeScript package...$(RESET)"
	@if [ -f $(TS_OUTPUT)/package.json ]; then \
		cd $(TS_OUTPUT) && npm install && npm run build; \
	else \
		echo "$(YELLOW)No package.json found, skipping npm build$(RESET)"; \
	fi

build-control-plane-java: generate-control-plane-java
	@echo "$(CYAN)Building Control Plane Java artifacts...$(RESET)"
	@if [ -f $(CONTROL_PLANE_JAVA_OUTPUT)/pom.xml ]; then \
		cd $(CONTROL_PLANE_JAVA_OUTPUT) && mvn clean package; \
	else \
		echo "$(YELLOW)No pom.xml found, skipping Maven build$(RESET)"; \
	fi

build-control-plane-typescript: generate-control-plane-typescript
	@echo "$(CYAN)Building Control Plane TypeScript package...$(RESET)"
	@if [ -f $(CONTROL_PLANE_TS_OUTPUT)/package.json ]; then \
		cd $(CONTROL_PLANE_TS_OUTPUT) && npm install && npm run build; \
	else \
		echo "$(YELLOW)No package.json found, skipping npm build$(RESET)"; \
	fi

build-all: build-java build-typescript build-control-plane-java build-control-plane-typescript
	@echo "$(GREEN)✓ All artifacts built successfully$(RESET)"