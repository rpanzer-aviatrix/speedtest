#!/bin/bash

# Helm Chart Validation Script for Speed Test Application

set -e

CHART_DIR="$(dirname "$0")"
CHART_NAME="speedtest"

echo "🔍 Validating Helm Chart for Speed Test Application"
echo "================================================="

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "❌ Helm is not installed. Please install Helm 3.x"
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "⚠️  kubectl is not available. Skipping cluster connectivity tests."
    SKIP_CLUSTER_TESTS=true
fi

echo "✅ Helm version: $(helm version --short)"

# Lint the chart
echo ""
echo "🧹 Linting Helm chart..."
if helm lint "$CHART_DIR"; then
    echo "✅ Chart linting passed"
else
    echo "❌ Chart linting failed"
    exit 1
fi

# Validate template rendering
echo ""
echo "🔧 Validating template rendering..."
if helm template test-release "$CHART_DIR" > /dev/null; then
    echo "✅ Template rendering successful"
else
    echo "❌ Template rendering failed"
    exit 1
fi

# Render templates with debug output
echo ""
echo "📋 Rendering templates with default values..."
helm template test-release "$CHART_DIR" --debug

# Test with custom values
echo ""
echo "🔧 Testing with custom values..."
cat > /tmp/test-values.yaml << EOF
namespace:
  name: test-speedtest

env:
  smallFileUrl: "https://example.com/10MB.bin"
  mediumFileUrl: "https://example.com/100MB.bin"
  largeFileUrl: "https://example.com/1GB.bin"

deployment:
  replicas: 1

# Test image pull secrets
imagePullSecrets:
  create: true
  registry:
    username: "test-user"
    password: "test-token"
    email: "test@example.com"
EOF

if helm template test-release "$CHART_DIR" -f /tmp/test-values.yaml > /dev/null; then
    echo "✅ Custom values template rendering successful"
else
    echo "❌ Custom values template rendering failed"
    exit 1
fi

# Clean up
rm -f /tmp/test-values.yaml

# Dry run installation (if kubectl is available)
if [[ "$SKIP_CLUSTER_TESTS" != "true" ]]; then
    echo ""
    echo "🚀 Testing dry-run installation..."
    if helm install test-release "$CHART_DIR" --dry-run --debug > /dev/null; then
        echo "✅ Dry-run installation successful"
    else
        echo "❌ Dry-run installation failed"
        exit 1
    fi
fi

echo ""
echo "🎉 All validation tests passed!"
echo ""
echo "📝 Chart Information:"
echo "   Name: $(grep '^name:' "$CHART_DIR/Chart.yaml" | cut -d' ' -f2)"
echo "   Version: $(grep '^version:' "$CHART_DIR/Chart.yaml" | cut -d' ' -f2)"
echo "   App Version: $(grep '^appVersion:' "$CHART_DIR/Chart.yaml" | cut -d' ' -f2)"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "To install the chart:"
echo "  helm install $CHART_NAME $CHART_DIR --create-namespace"
echo ""
echo "To install with custom values:"
echo "  helm install $CHART_NAME $CHART_DIR -f custom-values.yaml --create-namespace"
