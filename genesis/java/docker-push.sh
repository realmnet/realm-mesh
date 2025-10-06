#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$REGISTRY_USERNAME" ] || [ -z "$REGISTRY_API_KEY" ]; then
    echo "Error: REGISTRY_USERNAME and REGISTRY_API_KEY must be set"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Set defaults if not provided
REGISTRY=${REGISTRY:-docker.io}
IMAGE_NAME=${IMAGE_NAME:-realm-mesh/test-realm}
IMAGE_TAG=${IMAGE_TAG:-latest}

# Full image name
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "Pushing Docker image: ${FULL_IMAGE_NAME}"

# Login and push using Podman or Docker
if command -v podman &> /dev/null; then
    echo "Using Podman..."
    echo "${REGISTRY_API_KEY}" | podman login "${REGISTRY}" -u "${REGISTRY_USERNAME}" --password-stdin
    if [ $? -eq 0 ]; then
        podman push "${FULL_IMAGE_NAME}"
        podman logout "${REGISTRY}"
    else
        echo "Login failed!"
        exit 1
    fi
elif command -v docker &> /dev/null; then
    echo "Using Docker..."
    echo "${REGISTRY_API_KEY}" | docker login "${REGISTRY}" -u "${REGISTRY_USERNAME}" --password-stdin
    if [ $? -eq 0 ]; then
        docker push "${FULL_IMAGE_NAME}"
        docker logout "${REGISTRY}"
    else
        echo "Login failed!"
        exit 1
    fi
else
    echo "Neither Podman nor Docker found. Please install one of them."
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "Push successful!"
else
    echo "Push failed!"
    exit 1
fi