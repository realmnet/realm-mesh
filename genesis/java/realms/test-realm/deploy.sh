#!/bin/bash

set -e

NAMESPACE="genesis"
DEPLOYMENT_FILE="deployment.yaml"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="${IMAGE_NAME:-docker.io/interrealm/test-realm}"

echo "🚀 Deploying test-realm to Kubernetes..."
echo "📦 Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "📍 Namespace: ${NAMESPACE}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check cluster connection
echo "🔍 Checking cluster connection..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Unable to connect to Kubernetes cluster"
    exit 1
fi

# Update image tag in deployment if specified
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "❌ Deployment file not found: $DEPLOYMENT_FILE"
    exit 1
fi

# Create temporary deployment file with updated image tag
TEMP_DEPLOYMENT="/tmp/test-realm-deployment-$(date +%s).yaml"
sed "s|image: .*|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" "$DEPLOYMENT_FILE" > "$TEMP_DEPLOYMENT"

# Apply the deployment
echo "📝 Applying deployment..."
kubectl apply -f "$TEMP_DEPLOYMENT"

# Clean up temporary file
rm -f "$TEMP_DEPLOYMENT"

# Check deployment status
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/test-realm -n "$NAMESPACE" --timeout=120s

# Show deployment info
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Deployment status:"
kubectl get deployment test-realm -n "$NAMESPACE"
echo ""
echo "🔧 Service info:"
kubectl get service test-realm -n "$NAMESPACE"
echo ""
echo "🔗 To access the service within the cluster, use:"
echo "   http://test-realm.${NAMESPACE}.svc.cluster.local"
echo ""
echo "📌 To port-forward for local access:"
echo "   kubectl port-forward -n ${NAMESPACE} service/test-realm 8080:80"
echo ""
echo "📋 To view logs:"
echo "   kubectl logs -n ${NAMESPACE} -l app=test-realm -f"