#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set defaults if not provided
REGISTRY=${REGISTRY:-docker.io}
IMAGE_NAME=${IMAGE_NAME:-realm-mesh/test-realm}
IMAGE_TAG=${IMAGE_TAG:-latest}

# Full image name
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "Building Docker image: ${FULL_IMAGE_NAME}"

# Build using Podman (Docker alternative that doesn't require daemon)
if command -v podman &> /dev/null; then
    echo "Using Podman to build image..."
    podman build -t "${FULL_IMAGE_NAME}" .
elif command -v docker &> /dev/null; then
    echo "Using Docker to build image..."
    docker build -t "${FULL_IMAGE_NAME}" .
else
    echo "Neither Podman nor Docker found. Please install one of them."
    echo "To install Podman (recommended for no-daemon operation):"
    echo "  brew install podman"
    echo "To install Docker CLI only (requires Docker daemon elsewhere):"
    echo "  brew install docker"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "Image tagged as: ${FULL_IMAGE_NAME}"
else
    echo "Build failed!"
    exit 1
fi