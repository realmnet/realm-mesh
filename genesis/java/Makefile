.PHONY: help build push run clean install-podman

help:
	@echo "Available targets:"
	@echo "  make build         - Build Docker image"
	@echo "  make push          - Push image to registry"
	@echo "  make run           - Run container locally"
	@echo "  make clean         - Clean up containers and images"
	@echo "  make install-podman - Install Podman (macOS)"

build:
	./docker-build.sh

push:
	./docker-push.sh

run:
	@if command -v podman &> /dev/null; then \
		podman run -p 8080:8080 --rm $${REGISTRY:-docker.io}/$${IMAGE_NAME:-realm-mesh/test-realm}:$${IMAGE_TAG:-latest}; \
	elif command -v docker &> /dev/null; then \
		docker run -p 8080:8080 --rm $${REGISTRY:-docker.io}/$${IMAGE_NAME:-realm-mesh/test-realm}:$${IMAGE_TAG:-latest}; \
	else \
		echo "Neither Podman nor Docker found"; \
		exit 1; \
	fi

clean:
	@if command -v podman &> /dev/null; then \
		podman ps -aq | xargs -r podman rm -f; \
		podman images -q $${IMAGE_NAME:-realm-mesh/test-realm} | xargs -r podman rmi -f; \
	elif command -v docker &> /dev/null; then \
		docker ps -aq | xargs -r docker rm -f; \
		docker images -q $${IMAGE_NAME:-realm-mesh/test-realm} | xargs -r docker rmi -f; \
	fi

install-podman:
	@echo "Installing Podman..."
	brew install podman
	@echo "Initializing Podman machine..."
	podman machine init
	podman machine start
	@echo "Podman installed and ready!"