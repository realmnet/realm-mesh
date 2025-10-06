.PHONY: all build clean test help generate \
        build-protocol build-realm-operator build-control-plane \
        clean-protocol clean-realm-operator clean-control-plane \
        test-realm-operator test-control-plane \
        run-control-plane run-realm-operator realm-operator-dev \
        db-up db-down db-reset db-logs db-shell dev

# Default target - show help
all: help

# Help target
help:
	@echo "RealmMesh Build System"
	@echo "====================="
	@echo ""
	@echo "Main targets:"
	@echo "  make generate          - Generate code from OpenAPI specifications"
	@echo "  make build            - Build all projects (protocol, operator, control-plane)"
	@echo "  make test             - Run all tests"
	@echo "  make clean            - Clean all projects"
	@echo ""
	@echo "Individual build targets:"
	@echo "  make build-protocol    - Build protocol artifacts only"
	@echo "  make build-realm-operator - Build Realm Operator only"
	@echo "  make build-control-plane - Build Control Plane only"
	@echo ""
	@echo "Run targets:"
	@echo "  make run-control-plane - Start the Control Plane"
	@echo "  make run-realm-operator - Start the Realm Operator"
	@echo "  make dev              - Start development environment (database)"
	@echo ""
	@echo "Database targets:"
	@echo "  make db-up            - Start PostgreSQL and pgAdmin"
	@echo "  make db-down          - Stop database services"
	@echo "  make db-reset         - Reset database (destroys data)"
	@echo "  make db-shell         - Open PostgreSQL shell"
	@echo "  make db-logs          - Show database logs"
	@echo ""
	@echo "Quick start:"
	@echo "  make generate build   - Generate code and build everything"

# Generate code from OpenAPI specifications
generate:
	@echo "Generating code from OpenAPI specifications..."
	cd protocol && $(MAKE) all
	@echo "Code generation complete"

# Build all projects (protocol artifacts, realm-operator, control-plane)
build: build-protocol build-realm-operator build-control-plane
	@echo "All projects built successfully!"

build-protocol:
	@echo "Building protocol artifacts..."
	cd protocol && $(MAKE) build-control-plane-java
	@echo "Protocol artifacts built"

build-realm-operator:
	@echo "Building Realm Operator..."
	cd infra/realm-operator && mvn clean package
	@echo "Realm Operator built"

build-control-plane:
	@echo "Building Control Plane..."
	cd infra && gradle :control-plane:build
	@echo "Control Plane built"

# Clean all projects
clean: clean-protocol clean-realm-operator clean-control-plane
	@echo "All projects cleaned"

clean-protocol:
	@echo "Cleaning protocol generated code..."
	cd protocol && $(MAKE) clean

clean-realm-operator:
	@echo "Cleaning Realm Operator..."
	cd infra/realm-operator && mvn clean

clean-control-plane:
	@echo "Cleaning Control Plane..."
	cd infra && gradle :control-plane:clean

# Run tests
test: test-realm-operator test-control-plane
	@echo "All tests completed"

test-realm-operator:
	@echo "Running Realm Operator tests..."
	cd infra/realm-operator && mvn test

test-control-plane:
	@echo "Running Control Plane tests..."
	cd infra && gradle :control-plane:test

# Run control-plane
run-control-plane:
	@echo "Starting Control Plane..."
	cd infra/control-plane && gradle bootRun

# Build and run control-plane in dev mode
dev-control-plane: build-control-plane run-control-plane

# Database commands
.PHONY: db-up
db-up:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "PostgreSQL is starting on port 5432"
	@echo "pgAdmin is available at http://localhost:5050"
	@echo "Default credentials: admin@realm-mesh.local / admin"

.PHONY: db-down
db-down:
	docker-compose -f docker-compose.dev.yml down

.PHONY: db-reset
db-reset:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Database has been reset"

.PHONY: db-logs
db-logs:
	docker-compose -f docker-compose.dev.yml logs -f postgres

.PHONY: db-shell
db-shell:
	docker exec -it realm-postgres psql -U realmuser -d realmdb

# Realm Operator commands
.PHONY: run-realm-operator
run-realm-operator:
	@echo "Starting Realm Operator..."
	cd infra/realm-operator && mvn spring-boot:run

.PHONY: realm-operator-dev
realm-operator-dev:
	@echo "Starting Realm Operator in dev mode..."
	cd infra/realm-operator && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Combined dev environment
.PHONY: dev
dev: db-up
	@echo "Starting development environment..."
	@sleep 5
	@echo "Database is ready"
	@echo "Run 'make run-control-plane' in another terminal to start the control plane"
	@echo "Run 'make run-realm-operator' in another terminal to start the realm operator"