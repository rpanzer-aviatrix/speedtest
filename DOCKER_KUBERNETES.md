# Docker & Kubernetes Deployment Guide

This guide explains how to build and deploy the Speed Test application using Docker and Kubernetes.

## 🐳 Docker

### Building the Image

```bash
# Build the Docker image
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

Use the automated deployment script:

```bash
# Deploy to default namespace
./k8s/deploy.sh

# Deploy to custom namespace
NAMESPACE=speedtest ./k8s/deploy.sh

# Deploy with custom registry
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
