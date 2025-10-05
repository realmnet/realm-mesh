.PHONY: all build clean test run-control-plane

# Default target
all: build

# Build all projects
build:
	@echo "Building all infra projects..."
	cd infra && gradle build

# Clean all projects
clean:
	@echo "Cleaning all infra projects..."
	cd infra && gradle clean

# Run tests
test:
	@echo "Running tests for all infra projects..."
	cd infra && gradle test

# Run control-plane
run-control-plane:
	@echo "Starting Control Plane..."
	cd infra/control-plane && gradle bootRun

# Build control-plane only
build-control-plane:
	@echo "Building Control Plane..."
	cd infra && gradle :control-plane:build

# Build and run control-plane
dev-control-plane: build-control-plane run-control-plane