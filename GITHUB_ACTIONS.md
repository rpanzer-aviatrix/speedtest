# GitHub Actions CI/CD Guide

This document explains the automated CI/CD pipeline setup for the Speed Test application using GitHub Actions and GitHub Container Registry (ghcr.io).

## 🚀 Overview

The project includes three automated workflows that provide comprehensive CI/CD capabilities:

1. **Docker Build & Push** - Automated image building and publishing
2. **Security Scanning** - Vulnerability assessment and monitoring  
3. **Testing & Linting** - Code quality and functionality validation

## 🐳 Docker Build & Push Workflow

**File**: `.github/workflows/docker-build-push.yml`

### Triggers
- Push to `main` or `develop` branches
- Git tags starting with `v` (e.g., `v1.0.0`, `v2.1.3`)
- Pull requests to `main` branch

### Features
- ✅ **Multi-platform builds** (linux/amd64, linux/arm64)
- ✅ **Smart tagging** based on branch/tag/PR
- ✅ **Layer caching** for faster builds
- ✅ **Signed attestations** for supply chain security
- ✅ **Automatic registry authentication** via GITHUB_TOKEN

### Required Permissions
The workflow requires the following GitHub token permissions:
- `contents: read` - Read repository contents
- `packages: write` - Push images to GitHub Container Registry
- `id-token: write` - Generate OIDC tokens for attestations
- `attestations: write` - Write build provenance attestations

### Image Tags Generated
| Trigger | Tag Examples |
|---------|-------------|
| Push to `main` | `ghcr.io/rpanzer-aviatrix/speedtest:main` |
| Push to `develop` | `ghcr.io/rpanzer-aviatrix/speedtest:develop` |
| Tag `v1.2.3` | `ghcr.io/rpanzer-aviatrix/speedtest:v1.2.3`, `ghcr.io/rpanzer-aviatrix/speedtest:1.2`, `ghcr.io/rpanzer-aviatrix/speedtest:1` |
| PR #42 | `ghcr.io/rpanzer-aviatrix/speedtest:pr-42` |
| Commit SHA | `ghcr.io/rpanzer-aviatrix/speedtest:sha-abc1234` |

## 🔒 Security Scanning Workflow

**File**: `.github/workflows/security-scan.yml`

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Weekly scheduled scans (Mondays at 2 AM UTC)

### Features
- ✅ **Trivy vulnerability scanner** for comprehensive CVE detection
- ✅ **SARIF report upload** to GitHub Security tab
- ✅ **Fail on critical/high vulnerabilities**
- ✅ **OS and library vulnerability scanning**

### Security Reports
Results are automatically uploaded to:
- **GitHub Security Tab** → Code scanning alerts
- **Pull Request comments** (if vulnerabilities found)

## 🧪 Testing & Linting Workflow

**File**: `.github/workflows/test.yml`

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` branch

### Test Matrix
- **Node.js versions**: 18.x, 20.x
- **Platforms**: Ubuntu Latest

### Validations
- ✅ **Dependency installation** (`npm ci`)
- ✅ **Security audit** (`npm audit`)
- ✅ **Application startup** test
- ✅ **Health endpoint** validation
- ✅ **Docker build** verification
- ✅ **Dockerfile linting** with Hadolint

## 📦 Using Published Images

### Pull from GitHub Container Registry

```bash
# Latest stable version
docker pull ghcr.io/rpanzer-aviatrix/speedtest:latest

# Specific version
docker pull ghcr.io/rpanzer-aviatrix/speedtest:v1.0.0

# Development version
docker pull ghcr.io/rpanzer-aviatrix/speedtest:develop
```

### Authentication (for private repos)

```bash
# Create GitHub personal access token with packages:read scope
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Kubernetes Deployment

The Kubernetes manifests are pre-configured to use GHCR images:

```yaml
# k8s/deployment.yaml
containers:
- name: speedtest
  image: ghcr.io/rpanzer-aviatrix/speedtest:latest
```

## 🔧 Customization

### Environment Variables

Configure the build process using repository secrets:

| Secret | Description | Required |
|--------|-------------|----------|
| `GITHUB_TOKEN` | Automatic token for registry access | ✅ Auto-generated |

### Workflow Modifications

#### Change Target Registry
```yaml
env:
  REGISTRY: your-registry.com  # Change from ghcr.io
  IMAGE_NAME: your-org/speedtest
```

#### Add Build Arguments
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    build-args: |
      NODE_ENV=production
      BUILD_VERSION=${{ github.sha }}
```

#### Custom Platform Support
```yaml
platforms: linux/amd64,linux/arm64,linux/arm/v7
```

## 📊 Monitoring & Troubleshooting

### Check Workflow Status
1. Go to **Actions** tab in your GitHub repository
2. Select the workflow run to see detailed logs
3. Check individual job results

### Common Issues

#### Build Failures
- Check Dockerfile syntax with local `docker build`
- Verify all COPY/ADD source paths exist
- Review build logs for dependency issues

#### Push Failures
- Ensure repository has packages write permissions
- Check if GITHUB_TOKEN has sufficient scope
- Verify registry authentication

#### Security Scan Failures
- Review vulnerability report in Security tab
- Update base image or dependencies
- Consider adding vulnerability exceptions for false positives

### Debugging Commands

```bash
# Test Docker build locally
docker build -t speedtest-test .

# Run security scan locally
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image speedtest-test

# Test multi-platform build
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 .
```

## 🚀 Best Practices

### Version Management
- **Use semantic versioning** for releases (v1.0.0, v1.1.0)
- **Tag stable releases** to trigger versioned image builds
- **Use develop branch** for pre-release testing

### Security
- **Regularly update** base images and dependencies
- **Monitor security alerts** in GitHub Security tab
- **Review and approve** dependency updates via Dependabot

### Performance
- **Leverage build cache** - workflows use GitHub Actions cache
- **Optimize Dockerfile** - use multi-stage builds
- **Minimize image size** - use Alpine base images

### Monitoring
- **Set up notifications** for workflow failures
- **Monitor image vulnerability** reports
- **Track image size** and build times
