# Helm Deployment Guide

This guide explains how to deploy the Speed Test application using Helm charts.

## 📁 Chart Structure

```
helm/speedtest-chart/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
├── .helmignore             # Files to ignore when packaging
├── templates/
│   ├── _helpers.tpl        # Template helpers
│   ├── deployment.yaml     # Kubernetes deployment
│   ├── namespace.yaml      # Namespace creation
│   └── NOTES.txt          # Post-install notes
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x installed
- `kubectl` configured to access your cluster

### Install the Chart

```bash
# Navigate to the helm directory
cd helm/speedtest-chart

# Install with default values
helm install speedtest . --create-namespace

# Or specify custom namespace
helm install speedtest . --namespace my-speedtest --create-namespace
```

### Install with Custom Values

```bash
# Install with custom file URLs
helm install speedtest . \
  --set env.smallFileUrl="https://custom-server.com/10MB.bin" \
  --set env.mediumFileUrl="https://custom-server.com/100MB.bin" \
  --set env.largeFileUrl="https://custom-server.com/1GB.bin" \
  --create-namespace
```

### Install with Private Registry Authentication

```bash
# Install with GitHub Container Registry authentication
helm install speedtest . \
  --set imagePullSecrets.registry.username="your-github-username" \
  --set imagePullSecrets.registry.password="ghp_your_personal_access_token" \
  --set imagePullSecrets.registry.email="your-email@example.com" \
  --create-namespace
```

## ⚙️ Configuration

### Environment Variables

The chart allows you to configure test file URLs through Helm values:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env.smallFileUrl` | URL for small file test (10MB) | `https://ipv4.download.thinkbroadband.com/10MB.zip` |
| `env.mediumFileUrl` | URL for medium file test (100MB) | `https://ipv4.download.thinkbroadband.com/100MB.zip` |
| `env.largeFileUrl` | URL for large file test (1GB) | `https://ipv4.download.thinkbroadband.com/1GB.zip` |
| `env.port` | Application port | `3000` |
| `env.nodeEnv` | Node.js environment | `production` |

### Application Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `ghcr.io/rpanzer-aviatrix/speedtest` |
| `image.tag` | Container image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `deployment.replicas` | Number of pod replicas | `2` |

### Image Pull Secrets (Private Registry)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `imagePullSecrets.create` | Create image pull secret for private registry | `true` |
| `imagePullSecrets.name` | Name of the image pull secret | `speedtest-registry-secret` |
| `imagePullSecrets.registry.server` | Registry server URL | `ghcr.io` |
| `imagePullSecrets.registry.username` | Registry username (GitHub username) | `""` |
| `imagePullSecrets.registry.password` | Registry password (GitHub token) | `""` |
| `imagePullSecrets.registry.email` | Registry email address | `""` |
| `imagePullSecrets.existingSecret` | Use existing secret instead of creating one | `""` |

### Namespace Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespace.name` | Kubernetes namespace name | `speedtest` |
| `namespace.create` | Create namespace if it doesn't exist | `true` |

### Resource Management

| Parameter | Description | Default |
|-----------|-------------|---------|
| `deployment.resources.requests.memory` | Memory request | `128Mi` |
| `deployment.resources.requests.cpu` | CPU request | `100m` |
| `deployment.resources.limits.memory` | Memory limit | `512Mi` |
| `deployment.resources.limits.cpu` | CPU limit | `500m` |

### Health Checks

| Parameter | Description | Default |
|-----------|-------------|---------|
| `healthCheck.liveness.enabled` | Enable liveness probe | `true` |
| `healthCheck.liveness.path` | Liveness probe path | `/api/test-files` |
| `healthCheck.readiness.enabled` | Enable readiness probe | `true` |
| `healthCheck.readiness.path` | Readiness probe path | `/api/test-files` |

## 📝 Custom Values File

Create a `custom-values.yaml` file for your specific configuration:

```yaml
# custom-values.yaml
namespace:
  name: my-speedtest

image:
  tag: "v1.0.0"

deployment:
  replicas: 3

env:
  smallFileUrl: "https://hetzner-server.com/10MB.bin"
  mediumFileUrl: "https://hetzner-server.com/100MB.bin"
  largeFileUrl: "https://hetzner-server.com/1GB.bin"

deployment:
  resources:
    requests:
      memory: "256Mi"
      cpu: "200m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

Deploy with custom values:

```bash
helm install speedtest . -f custom-values.yaml --create-namespace
```

### Private Registry Authentication Setup

For private repositories on GitHub Container Registry, you need to:

#### 1. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `read:packages` - Download packages from GitHub Package Registry
   - `repo` - If the repository is private
4. Copy the generated token (starts with `ghp_`)

#### 2. Configure Authentication in Values

```yaml
# custom-values.yaml
imagePullSecrets:
  create: true
  registry:
    username: "your-github-username"
    password: "ghp_your_personal_access_token"
    email: "your-email@example.com"

# Rest of your configuration...
env:
  smallFileUrl: "https://example.com/10MB.bin"
```

#### 3. Alternative: Use Existing Secret

If you already have a Docker registry secret:

```yaml
# custom-values.yaml
imagePullSecrets:
  create: false
  existingSecret: "my-existing-registry-secret"
```

Create the existing secret manually:

```bash
kubectl create secret docker-registry my-existing-registry-secret \
  --docker-server=ghcr.io \
  --docker-username=your-github-username \
  --docker-password=ghp_your_personal_access_token \
  --docker-email=your-email@example.com \
  --namespace=speedtest
```

## 🔧 Management Commands

### Upgrade Deployment

```bash
# Upgrade with new values
helm upgrade speedtest . \
  --set image.tag="v1.1.0" \
  --set deployment.replicas=4

# Upgrade with values file
helm upgrade speedtest . -f custom-values.yaml
```

### Check Status

```bash
# Check Helm release status
helm status speedtest

# Check Kubernetes resources
kubectl get all -n speedtest

# View pod logs
kubectl logs -n speedtest -l app=speedtest --follow
```

### Uninstall

```bash
# Uninstall the release
helm uninstall speedtest

# Uninstall and delete namespace
helm uninstall speedtest
kubectl delete namespace speedtest
```

## 🌍 Environment-Specific Deployments

### Development Environment

```bash
helm install speedtest-dev . \
  --namespace speedtest-dev \
  --set deployment.replicas=1 \
  --set image.tag="develop" \
  --set env.nodeEnv="development" \
  --create-namespace
```

### Production Environment

```bash
helm install speedtest-prod . \
  --namespace speedtest-prod \
  --set deployment.replicas=5 \
  --set image.tag="v1.0.0" \
  --set deployment.resources.requests.memory="512Mi" \
  --set deployment.resources.limits.memory="2Gi" \
  --create-namespace
```

### Staging Environment

```bash
helm install speedtest-staging . \
  --namespace speedtest-staging \
  --set deployment.replicas=2 \
  --set image.tag="latest" \
  --create-namespace
```

## 🔍 Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n speedtest
kubectl describe pod <pod-name> -n speedtest
```

### View Logs

```bash
# All pods
kubectl logs -n speedtest -l app=speedtest --tail=100

# Specific pod
kubectl logs -n speedtest <pod-name> --follow
```

### Test Application

```bash
# Port forward to test locally
kubectl port-forward -n speedtest svc/speedtest-service 3000:3000

# Access the application
curl http://localhost:3000/api/test-files
```

### Validate Configuration

```bash
# Check environment variables in pod
kubectl exec -n speedtest <pod-name> -- env | grep -E "(SMALL|MEDIUM|LARGE)_FILE_URL"

# Check Helm values
helm get values speedtest

# Check image pull secrets
kubectl get secrets -n speedtest
kubectl describe secret speedtest-registry-secret -n speedtest
```

### Registry Authentication Issues

```bash
# Check if secret exists and is correctly formatted
kubectl get secret speedtest-registry-secret -n speedtest -o yaml

# Check pod events for image pull errors
kubectl describe pod <pod-name> -n speedtest

# Test Docker authentication manually
echo "ghp_your_token" | docker login ghcr.io -u your-username --password-stdin
docker pull ghcr.io/rpanzer-aviatrix/speedtest:latest

# Verify secret content (decode base64)
kubectl get secret speedtest-registry-secret -n speedtest -o jsonpath='{.data.\.dockerconfigjson}' | base64 --decode
```

## 📊 Monitoring

### Resource Usage

```bash
# Check resource usage
kubectl top pods -n speedtest
kubectl top nodes
```

### Events

```bash
# Check events
kubectl get events -n speedtest --sort-by='.lastTimestamp'
```

## 🔒 Security Considerations

The chart includes security best practices:

- **Non-root user**: Application runs as user ID 1001
- **Read-only filesystem**: Where applicable
- **Dropped capabilities**: Minimal Linux capabilities
- **Resource limits**: CPU and memory constraints
- **Security context**: Pod and container security policies

## 🚀 CI/CD Integration

### GitOps with ArgoCD

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: speedtest
spec:
  source:
    repoURL: https://github.com/rpanzer-aviatrix/speedtest
    path: helm/speedtest-chart
    targetRevision: main
    helm:
      valueFiles:
        - values.yaml
      parameters:
        - name: image.tag
          value: "v1.0.0"
```

### Helm with CI/CD Pipeline

```bash
# In your CI/CD pipeline
helm upgrade --install speedtest ./helm/speedtest-chart \
  --namespace speedtest \
  --set image.tag=$BUILD_TAG \
  --wait --timeout=300s
```

This Helm chart provides a flexible, production-ready deployment solution for the Speed Test application with configurable environment variables and comprehensive management capabilities.
