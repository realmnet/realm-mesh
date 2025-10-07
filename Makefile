.PHONY: all build clean test help generate \
        build-protocol build-realm-operator build-control-plane build-console \
        clean-protocol clean-realm-operator clean-control-plane clean-console \
        test-realm-operator test-control-plane \
        run-control-plane run-realm-operator realm-operator-dev \
        plane-db-up plane-db-down plane-db-reset plane-db-logs plane-db-shell \
        plane-dev plane-start dev

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
	@echo "  make build-console     - Build Console React app only"
	@echo ""
	@echo "Run targets:"
	@echo "  make run-control-plane - Start the Control Plane"
	@echo "  make run-realm-operator - Start the Realm Operator"
	@echo "  make dev              - Start development environment (database)"
	@echo ""
	@echo "Control Plane Database targets:"
	@echo "  make plane-db-up     - Start PostgreSQL and pgAdmin for control-plane"
	@echo "  make plane-db-down   - Stop control-plane database services"
	@echo "  make plane-db-reset  - Reset control-plane database (destroys data)"
	@echo "  make plane-db-shell  - Open PostgreSQL shell for control-plane"
	@echo "  make plane-db-logs   - Show control-plane database logs"
	@echo "  make plane-start     - Start database + control-plane (full stack)"
	@echo ""
	@echo "Quick start:"
	@echo "  make generate build   - Generate code and build everything"

# Generate code from OpenAPI specifications
generate:
	@echo "Generating code from OpenAPI specifications..."
	cd protocol && $(MAKE) all
	@echo "Code generation complete"

# Build all projects (protocol artifacts, realm-operator, control-plane, console)
build: build-protocol build-realm-operator build-control-plane build-console
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

build-console:
	@echo "Building Console React app..."
	cd console && npm run build
	@echo "Console built"

# Clean all projects
clean: clean-protocol clean-realm-operator clean-control-plane clean-console
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

clean-console:
	@echo "Cleaning Console React app..."
	cd console && rm -rf dist node_modules/.vite
	@echo "Console cleaned"

# Run tests
test: test-realm-operator test-control-plane
	@echo "All tests completed"

test-realm-operator:
	@echo "Running Realm Operator tests..."
	cd infra/realm-operator && mvn test

test-control-plane:
	@echo "Running Control Plane tests..."
	cd infra && gradle :control-plane:test

# Run control-plane with database initialization
run-control-plane:
	@echo "🚀 Starting Control Plane with database..."
	@echo "📋 Step 1: Checking if database is running..."
	@if ! docker ps | grep -q control-plane-postgres 2>/dev/null; then \
		echo "🔄 Database not running, starting PostgreSQL..."; \
		docker-compose -f dev/control-plane/docker-compose.dev.yml up -d; \
		echo "⏳ Waiting for PostgreSQL to be ready..."; \
		sleep 10; \
		until docker exec control-plane-postgres pg_isready -U control_plane_user -d control_plane_db > /dev/null 2>&1; do \
			echo "⏳ Still waiting for PostgreSQL..."; \
			sleep 2; \
		done; \
		echo "✅ PostgreSQL is ready!"; \
	else \
		echo "✅ Database is already running"; \
	fi
	@echo "📋 Step 2: Starting Control Plane application..."
	@echo "🎯 Control Plane will be available at: http://localhost:8080"
	@echo "📊 Database info: localhost:5432 (control_plane_db / control_plane_user)"
	@echo "🔧 PgAdmin: http://localhost:5050 (admin@control-plane.local / admin)"
	@echo ""
	cd infra/control-plane && ./gradlew bootRun

# Build and run control-plane in dev mode
dev-control-plane: build-control-plane run-control-plane

# Control Plane Database commands
.PHONY: plane-db-up
plane-db-up:
	@echo "🚀 Starting Control Plane PostgreSQL database..."
	docker-compose -f dev/control-plane/docker-compose.dev.yml up -d
	@echo "📊 PostgreSQL is starting on port 5432"
	@echo "🔧 pgAdmin is available at http://localhost:5050"
	@echo "🔑 Default credentials: admin@control-plane.local / admin"
	@echo "💾 Database: control_plane_db, User: control_plane_user"

.PHONY: plane-db-down
plane-db-down:
	@echo "🛑 Stopping Control Plane database services..."
	docker-compose -f dev/control-plane/docker-compose.dev.yml down

.PHONY: plane-db-reset
plane-db-reset:
	@echo "🔄 Resetting Control Plane database (this will destroy all data)..."
	docker-compose -f dev/control-plane/docker-compose.dev.yml down -v
	docker-compose -f dev/control-plane/docker-compose.dev.yml up -d
	@echo "✅ Control Plane database has been reset"

.PHONY: plane-db-logs
plane-db-logs:
	@echo "📋 Showing Control Plane database logs..."
	docker-compose -f dev/control-plane/docker-compose.dev.yml logs -f postgres

.PHONY: plane-db-shell
plane-db-shell:
	@echo "🔧 Opening PostgreSQL shell for Control Plane database..."
	docker exec -it control-plane-postgres psql -U control_plane_user -d control_plane_db

# Start full Control Plane stack (database + application)
.PHONY: plane-start
plane-start: plane-db-up
	@echo "⏳ Waiting for database to be ready..."
	@sleep 10
	@until docker exec control-plane-postgres pg_isready -U control_plane_user -d control_plane_db > /dev/null 2>&1; do \
		echo "⏳ Still waiting for PostgreSQL..."; \
		sleep 2; \
	done
	@echo "✅ Database is ready!"
	@echo "🚀 Starting Control Plane application..."
	cd infra/control-plane && ./gradlew bootRun

# Legacy database commands (for backward compatibility)
.PHONY: db-up db-down db-reset db-logs db-shell
db-up: plane-db-up
db-down: plane-db-down
db-reset: plane-db-reset
db-logs: plane-db-logs
db-shell: plane-db-shell

# Realm Operator commands
.PHONY: run-realm-operator
run-realm-operator:
	@echo "🚀 Starting Realm Operator..."
	@echo "📋 Building and starting Realm Operator service..."
	@echo "🎯 Realm Operator will be available on its configured port"
	@echo ""
	cd infra/realm-operator && mvn spring-boot:run

.PHONY: realm-operator-dev
realm-operator-dev:
	@echo "Starting Realm Operator in dev mode..."
	cd infra/realm-operator && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Combined dev environment - start database only
.PHONY: dev
dev:
	@echo "🚀 Starting development environment (database only)..."
	@echo "📋 Starting PostgreSQL database..."
	docker-compose -f dev/control-plane/docker-compose.dev.yml up -d
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 10
	@until docker exec control-plane-postgres pg_isready -U control_plane_user -d control_plane_db > /dev/null 2>&1; do \
		echo "⏳ Still waiting for PostgreSQL..."; \
		sleep 2; \
	done
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "📋 Database Info:"
	@echo "   PostgreSQL: localhost:5432 (control_plane_db / control_plane_user)"
	@echo "   PgAdmin: http://localhost:5050 (admin@control-plane.local / admin)"
	@echo ""
	@echo "🎯 Next steps:"
	@echo "   make run-control-plane  - Start Control Plane (includes database check)"
	@echo "   make run-realm-operator - Start Realm Operator"
	@echo ""
	@echo "💡 Or run 'make run-control-plane' directly (it will start the database if needed)"

# Enhanced control-plane dev environment
.PHONY: plane-dev
plane-dev: build-control-plane plane-start