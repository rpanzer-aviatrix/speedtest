# Docker & Kubernetes Deployment Guide

This guide explains how to build and deploy the Speed Test application using Docker and Kubernetes.

## 🐳 Docker

### Using Pre-built Images

Pre-built images are automatically available from GitHub Container Registry:

```bash
# Pull and run the latest stable image
docker run -p 3000:3000 ghcr.io/rpanzer/speedtest:latest

# Pull specific version
docker run -p 3000:3000 ghcr.io/rpanzer/speedtest:v1.0.0

# Pull development version
docker run -p 3000:3000 ghcr.io/rpanzer/speedtest:develop
```

### Building Custom Images

```bash
# Build the Docker image locally
docker build -t speedtest-app:latest .

# Run locally for testing
docker run -p 3000:3000 speedtest-app:latest
```

### Running with Custom Configuration

```bash
# Run with custom test file URLs
docker run -p 3000:3000 \
  -e SMALL_FILE_URL="https://custom-server.com/10MB.bin" \
  -e MEDIUM_FILE_URL="https://custom-server.com/100MB.bin" \
  -e LARGE_FILE_URL="https://custom-server.com/1GB.bin" \
  speedtest-app:latest
```

### Docker Image Features

- ✅ **Multi-stage build** for smaller production image
- ✅ **Non-root user** for security
- ✅ **Health checks** for container orchestration
- ✅ **Signal handling** with dumb-init
- ✅ **Alpine Linux** base for minimal attack surface

## ☸️ Kubernetes

### Quick Deployment

#### Option 1: Use Pre-built Images (Recommended)

Deploy using images from GitHub Container Registry:

```bash
# Deploy to default namespace
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml  # Uses ghcr.io/rpanzer/speedtest:latest
kubectl apply -f k8s/service.yaml

# Deploy to custom namespace
kubectl create namespace speedtest
kubectl apply -f k8s/ -n speedtest
```

#### Option 2: Build and Deploy Custom Images

Build your own images and deploy:

```bash
# Build and deploy with custom registry
DOCKER_REGISTRY=your-registry.com NAMESPACE=speedtest ./k8s/deploy.sh
```

### Kubernetes Manifests

| File | Description |
|------|-------------|
| `deployment.yaml` | Application deployment with 2 replicas |
| `service.yaml` | ClusterIP service for internal access |
| `configmap.yaml` | Configuration for test file URLs |
| `ingress.yaml` | External access with TLS termination |
| `deploy.sh` | Automated deployment script |

### Configuration

#### Environment Variables

Customize test file URLs via ConfigMap:

```yaml
# k8s/configmap.yaml
data:
  SMALL_FILE_URL: "https://your-server.com/10MB.bin"
  MEDIUM_FILE_URL: "https://your-server.com/100MB.bin"
  LARGE_FILE_URL: "https://your-server.com/1GB.bin"
```

#### Resource Limits

Current resource configuration:

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

#### Scaling

Scale the deployment:

```bash
kubectl scale deployment speedtest-app --replicas=5 -n speedtest
```

### Access the Application

#### Port Forwarding (Development)

```bash
kubectl port-forward service/speedtest-service 3000:3000 -n speedtest
# Access: http://localhost:3000
```

#### Ingress (Production)

1. Update domain in `k8s/ingress.yaml`
2. Apply ingress: `kubectl apply -f k8s/ingress.yaml -n speedtest`
3. Access via your domain: `https://speedtest.yourdomain.com`

### Monitoring & Troubleshooting

#### Check deployment status:
```bash
kubectl get pods -l app=speedtest -n speedtest
kubectl rollout status deployment/speedtest-app -n speedtest
```

#### View logs:
```bash
kubectl logs -l app=speedtest -n speedtest --follow
```

#### Health checks:
```bash
kubectl describe deployment speedtest-app -n speedtest
```

## 🔒 Security Features

- **Non-root user**: Application runs as user ID 1001
- **Read-only filesystem**: Where possible
- **Dropped capabilities**: Minimal Linux capabilities
- **Security context**: Pod and container security policies
- **Resource limits**: CPU and memory constraints

## 🚀 Production Considerations

1. **Use specific image tags** instead of `latest`
2. **Configure resource limits** based on your load
3. **Set up monitoring** (Prometheus/Grafana)
4. **Configure log aggregation** (ELK/Fluentd)
5. **Set up backup** for any persistent data
6. **Use secrets** for sensitive configuration
7. **Configure ingress** with proper TLS certificates
8. **Test autoscaling** with HPA if needed

## 📊 Architecture Benefits

- ✅ **Horizontally scalable**: Works with multiple instances
- ✅ **Stateless**: No session storage requirements
- ✅ **Cloud-native**: 12-factor app principles
- ✅ **Container-ready**: Optimized for orchestration
- ✅ **Health monitoring**: Built-in health checks

## 🚀 CI/CD Pipeline

### GitHub Actions Integration

The application includes automated CI/CD workflows:

- **🐳 Automated Docker Builds**: Images are automatically built and pushed to `ghcr.io` on every push to main/develop branches
- **🔒 Security Scanning**: Vulnerability scans with Trivy on every build
- **🧪 Testing**: Multi-platform testing and validation
- **📦 Multi-arch Support**: Builds for AMD64 and ARM64 architectures

### Image Tags

| Event | Image Tags Generated |
|-------|---------------------|
| Push to `main` | `ghcr.io/rpanzer/speedtest:latest`, `ghcr.io/rpanzer/speedtest:main` |
| Push to `develop` | `ghcr.io/rpanzer/speedtest:develop` |
| Git tag `v1.2.3` | `ghcr.io/rpanzer/speedtest:v1.2.3`, `ghcr.io/rpanzer/speedtest:1.2`, `ghcr.io/rpanzer/speedtest:1` |
| Pull Request | `ghcr.io/rpanzer/speedtest:pr-123` |

See [GITHUB_ACTIONS.md](GITHUB_ACTIONS.md) for detailed CI/CD documentation.
