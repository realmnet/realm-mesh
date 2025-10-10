.PHONY: all build clean test help generate \
        build-protocol build-realm-operator build-control-plane build-console build-gateway \
        clean-protocol clean-realm-operator clean-control-plane clean-console clean-gateway \
        test-realm-operator test-control-plane test-gateway \
        run-control-plane run-realm-operator realm-operator-dev run-gateway \
        plane-db-up plane-db-down plane-db-reset plane-db-logs plane-db-shell \
        plane-dev plane-start dev \
        gateway-db-up gateway-db-down gateway-db-reset gateway-db-logs gateway-db-shell \
        gateway-dev gateway-start kill-all kill-gateway kill-console

# Default target - show help
all: help

# Help target
help:
	@echo "RealmMesh Build System"
	@echo "====================="
	@echo ""
	@echo "Main targets:"
	@echo "  make generate          - Generate code from OpenAPI specifications"
	@echo "  make build            - Build all projects (protocol, operator, control-plane, gateway)"
	@echo "  make test             - Run all tests"
	@echo "  make clean            - Clean all projects"
	@echo ""
	@echo "Individual build targets:"
	@echo "  make build-protocol    - Build protocol artifacts only"
	@echo "  make build-realm-operator - Build Realm Operator only"
	@echo "  make build-control-plane - Build Control Plane only"
	@echo "  make build-console     - Build Console Next.js app only"
	@echo "  make build-gateway     - Build Gateway Node.js app only"
	@echo ""
	@echo "Run targets:"
	@echo "  make run-control-plane - Start the Control Plane"
	@echo "  make run-realm-operator - Start the Realm Operator"
	@echo "  make run-gateway      - Start the Gateway"
	@echo "  make dev              - Start development environment (databases)"
	@echo ""
	@echo "Control Plane Database targets:"
	@echo "  make plane-db-up     - Start PostgreSQL and pgAdmin for control-plane"
	@echo "  make plane-db-down   - Stop control-plane database services"
	@echo "  make plane-db-reset  - Reset control-plane database (destroys data)"
	@echo "  make plane-db-shell  - Open PostgreSQL shell for control-plane"
	@echo "  make plane-db-logs   - Show control-plane database logs"
	@echo "  make plane-start     - Start database + control-plane (full stack)"
	@echo ""
	@echo "Gateway Database targets:"
	@echo "  make gateway-db-up   - Start PostgreSQL for gateway (port 5433)"
	@echo "  make gateway-db-down - Stop gateway database services"
	@echo "  make gateway-db-reset - Reset gateway database (destroys data)"
	@echo "  make gateway-db-shell - Open PostgreSQL shell for gateway"
	@echo "  make gateway-db-logs - Show gateway database logs"
	@echo "  make gateway-start   - Start database + gateway (full stack)"
	@echo ""
	@echo "Quick start:"
	@echo "  make generate build   - Generate code and build everything"
	@echo "  make gateway-dev      - Start gateway with database (dev mode)"
	@echo ""
	@echo "Kill targets:"
	@echo "  make kill-all         - Kill all running processes (gateway, console)"
	@echo "  make kill-gateway     - Kill gateway processes only"
	@echo "  make kill-console     - Kill console processes only"

# Generate code from OpenAPI specifications
generate:
	@echo "Generating code from OpenAPI specifications..."
	cd protocol && $(MAKE) all
	@echo "Code generation complete"

# Build all projects (protocol artifacts, realm-operator, control-plane, console, gateway)
build: build-protocol build-realm-operator build-control-plane build-console build-gateway
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
	@echo "Building Console Next.js app..."
	cd console && npm run build
	@echo "Console built"

build-gateway:
	@echo "Building Gateway..."
	cd infra/gateway && npm install
	@echo "Gateway built"

# Clean all projects
clean: clean-protocol clean-realm-operator clean-control-plane clean-console clean-gateway
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
	@echo "Cleaning Console Next.js app..."
	cd console && rm -rf .next out node_modules/.cache
	@echo "Console cleaned"

clean-gateway:
	@echo "Cleaning Gateway..."
	cd infra/gateway && rm -rf node_modules dist
	@echo "Gateway cleaned"

# Run tests
test: test-realm-operator test-control-plane test-gateway
	@echo "All tests completed"

test-realm-operator:
	@echo "Running Realm Operator tests..."
	cd infra/realm-operator && mvn test

test-control-plane:
	@echo "Running Control Plane tests..."
	cd infra && gradle :control-plane:test

test-gateway:
	@echo "Running Gateway tests..."
	cd infra/gateway && npm test

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

# Gateway Database commands
.PHONY: gateway-db-up
gateway-db-up:
	@echo "🚀 Starting Gateway PostgreSQL database..."
	docker-compose -f infra/gateway/docker-compose.yml up -d
	@echo "📊 PostgreSQL is starting on port 5433"
	@echo "🔧 pgAdmin is available at http://localhost:5051"
	@echo "🔑 Default credentials: admin@gateway.local / admin"
	@echo "💾 Database: gateway_db, User: gateway_user"

.PHONY: gateway-db-down
gateway-db-down:
	@echo "🛑 Stopping Gateway database services..."
	docker-compose -f infra/gateway/docker-compose.yml down

.PHONY: gateway-db-reset
gateway-db-reset:
	@echo "🔄 Resetting Gateway database (this will destroy all data)..."
	docker-compose -f infra/gateway/docker-compose.yml down -v
	docker-compose -f infra/gateway/docker-compose.yml up -d
	@echo "✅ Gateway database has been reset"

.PHONY: gateway-db-logs
gateway-db-logs:
	@echo "📋 Showing Gateway database logs..."
	docker-compose -f infra/gateway/docker-compose.yml logs -f gateway-postgres

.PHONY: gateway-db-shell
gateway-db-shell:
	@echo "🔧 Opening PostgreSQL shell for Gateway database..."
	docker exec -it gateway-postgres psql -U gateway_user -d gateway_db

# Run gateway with database
.PHONY: run-gateway
run-gateway:
	@echo "🚀 Starting Gateway with database..."
	@echo "📋 Step 1: Checking if database is running..."
	@if ! docker ps | grep -q gateway-postgres 2>/dev/null; then \
		echo "🔄 Database not running, starting PostgreSQL..."; \
		docker-compose -f infra/gateway/docker-compose.yml up -d; \
		echo "⏳ Waiting for PostgreSQL to be ready..."; \
		sleep 10; \
		until docker exec gateway-postgres pg_isready -U gateway_user -d gateway_db > /dev/null 2>&1; do \
			echo "⏳ Still waiting for PostgreSQL..."; \
			sleep 2; \
		done; \
		echo "✅ PostgreSQL is ready!"; \
	else \
		echo "✅ Database is already running"; \
	fi
	@echo "📋 Step 2: Starting Gateway application..."
	@echo "🌐 Internal Gateway: ws://localhost:8080"
	@echo "🔒 External Gateway: ws://localhost:8443"
	@echo "🛠  Admin API: http://localhost:3001"
	@echo "📊 Database: localhost:5433 (gateway_db / gateway_user)"
	@echo "🔧 PgAdmin: http://localhost:5051 (admin@gateway.local / admin)"
	@echo ""
	cd infra/gateway && npm start

# Start full Gateway stack (database + application)
.PHONY: gateway-start
gateway-start: gateway-db-up
	@echo "⏳ Waiting for database to be ready..."
	@sleep 10
	@until docker exec gateway-postgres pg_isready -U gateway_user -d gateway_db > /dev/null 2>&1; do \
		echo "⏳ Still waiting for PostgreSQL..."; \
		sleep 2; \
	done
	@echo "✅ Database is ready!"
	@echo "🚀 Starting Gateway application..."
	cd infra/gateway && npm start

# Gateway development mode
.PHONY: gateway-dev
gateway-dev: build-gateway gateway-db-up
	@echo "🚀 Starting Gateway in development mode..."
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	@until docker exec gateway-postgres pg_isready -U gateway_user -d gateway_db > /dev/null 2>&1; do \
		echo "⏳ Still waiting for PostgreSQL..."; \
		sleep 2; \
	done
	@echo "✅ Database is ready!"
	cd infra/gateway && ./scripts/start-dev.sh

# Kill processes
.PHONY: kill-all
kill-all: kill-gateway kill-console
	@echo "🛑 All processes killed"

.PHONY: kill-gateway
kill-gateway:
	@echo "🛑 Killing Gateway processes..."
	@echo "📋 Looking for Gateway processes on ports 3001, 8080, 8443..."
	-@pkill -f "gateway.*src/index" 2>/dev/null || true
	-@pkill -f "ts-node.*gateway.*index.ts" 2>/dev/null || true
	-@pkill -f "node.*gateway.*index.js" 2>/dev/null || true
	-@for port in 3001 8080 8443; do \
		pid=$$(lsof -ti:$$port 2>/dev/null | head -1); \
		if [ ! -z "$$pid" ]; then \
			echo "🔪 Killing process $$pid on port $$port"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo "✅ Gateway processes killed"

.PHONY: kill-console
kill-console:
	@echo "🛑 Killing Console processes..."
	@echo "📋 Looking for Next.js processes on port 3000..."
	-@pkill -f "next.*dev" 2>/dev/null || true
	-@pkill -f "node.*next.*dev" 2>/dev/null || true
	-@for port in 3000; do \
		pid=$$(lsof -ti:$$port 2>/dev/null | head -1); \
		if [ ! -z "$$pid" ]; then \
			echo "🔪 Killing process $$pid on port $$port"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo "✅ Console processes killed"