# Speed Test Web Application

A modern web application that runs network speed tests from the server environment by downloading large files and providing real-time progress updates via Server-Sent Events (SSE).

## Features

- **Three File Size Options**: Choose from 10MB, 100MB, or 1GB test files
- **Real-time Progress**: Live progress updates via Server-Sent Events
- **Beautiful UI**: Modern, responsive design with progress bar and statistics
- **Server-side Testing**: Tests run from the server environment, not the client
- **Speed Metrics**: Shows download speed, elapsed time, and progress percentage
- **TLS Certificate Handling**: Ignores expired/invalid TLS certificates for speed test downloads
- **CI/CD Ready**: Automated Docker builds and security scanning with GitHub Actions
- **Helm Chart**: Production-ready Kubernetes deployment with configurable values

## Installation

### Option 1: Run with Docker (Recommended)

```bash
# Pull and run the latest image from GitHub Container Registry
docker run -p 3000:3000 ghcr.io/rpanzer-aviatrix/speedtest:latest

# Or with custom configuration
docker run -p 3000:3000 \
  -e SMALL_FILE_URL="https://your-server.com/10MB.bin" \
  -e MEDIUM_FILE_URL="https://your-server.com/100MB.bin" \
  -e LARGE_FILE_URL="https://your-server.com/1GB.bin" \
  ghcr.io/rpanzer-aviatrix/speedtest:latest
```

### Option 2: Deploy with Helm (Kubernetes)

```bash
# Install with Helm (creates namespace and deployment)
cd helm/speedtest-chart
helm install speedtest . --create-namespace

# Or with custom test file URLs
helm install speedtest . \
  --set env.smallFileUrl="https://your-server.com/10MB.bin" \
  --set env.mediumFileUrl="https://your-server.com/100MB.bin" \
  --set env.largeFileUrl="https://your-server.com/1GB.bin" \
  --create-namespace

# For private registry (requires GitHub Personal Access Token)
helm install speedtest . \
  --set imagePullSecrets.registry.username="your-github-username" \
  --set imagePullSecrets.registry.password="ghp_your_token" \
  --set imagePullSecrets.registry.email="your-email@example.com" \
  --create-namespace

# Access via port-forward
kubectl port-forward -n speedtest deployment/speedtest-app 3000:3000
```

See [HELM_DEPLOYMENT.md](HELM_DEPLOYMENT.md) for detailed Helm deployment guide.

### Option 3: Run from Source

1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure test file URLs by setting environment variables:
```bash
export SMALL_FILE_URL="https://your-server.com/10MB.bin"
export MEDIUM_FILE_URL="https://your-server.com/100MB.bin"
export LARGE_FILE_URL="https://your-server.com/1GB.bin"
```

3. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Select a file size option (Small: 10MB, Medium: 100MB, Large: 1GB)
2. Click "Run Speed Test" to start the download test
3. Watch the real-time progress bar and statistics
4. View the final results including average download speed

## API Endpoints

- `GET /` - Serves the main application
- `POST /api/speedtest` - Starts a speed test with the selected file size
- `GET /api/progress/:sessionId` - Server-Sent Events endpoint for progress updates
- `GET /api/test-files` - Returns available test file configurations

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Real-time Communication**: Server-Sent Events (SSE)
- **HTTP Client**: Axios for file downloads with progress tracking

## Test Files

By default, the application uses public test files from ThinkBroadband's speed test servers:
- Small: 10MB file
- Medium: 100MB file  
- Large: 1GB file

## Configuration

### Environment Variables

The application supports the following environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `PORT` | Server port | `3000` |
| `SMALL_FILE_URL` | URL for small file test (10MB) | `https://ipv4.download.thinkbroadband.com/10MB.zip` |
| `MEDIUM_FILE_URL` | URL for medium file test (100MB) | `https://ipv4.download.thinkbroadband.com/100MB.zip` |
| `LARGE_FILE_URL` | URL for large file test (1GB) | `https://ipv4.download.thinkbroadband.com/1GB.zip` |

### Alternative Speed Test Servers

You can configure the application to use different speed test servers:

**Hetzner (Germany):**
```bash
export SMALL_FILE_URL="https://ash-speed.hetzner.com/10MB.bin"
export MEDIUM_FILE_URL="https://ash-speed.hetzner.com/100MB.bin"
export LARGE_FILE_URL="https://ash-speed.hetzner.com/1GB.bin"
```

**Using with Docker:**
```bash
docker run -e SMALL_FILE_URL="https://custom-server.com/10MB.bin" \
           -e MEDIUM_FILE_URL="https://custom-server.com/100MB.bin" \
           -e LARGE_FILE_URL="https://custom-server.com/1GB.bin" \
           -p 3000:3000 speedtest-app
```

**Using .env file:**
Copy the example configuration file and customize it:
```bash
cp env.example .env
# Edit .env file with your preferred text editor
```

Example `.env` file content:
```env
PORT=3000
SMALL_FILE_URL=https://your-server.com/10MB.bin
MEDIUM_FILE_URL=https://your-server.com/100MB.bin
LARGE_FILE_URL=https://your-server.com/1GB.bin
```

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

## CI/CD

This project includes automated GitHub Actions workflows:

### Workflows

- **🐳 Docker Build & Push** (`docker-build-push.yml`)
  - Builds Docker images on push to main/develop branches
  - Pushes to GitHub Container Registry (ghcr.io)
  - Supports multi-platform builds (amd64, arm64)
  - Creates signed attestations for supply chain security

- **🔒 Security Scan** (`security-scan.yml`)
  - Runs Trivy vulnerability scans on Docker images
  - Uploads results to GitHub Security tab
  - Scheduled weekly scans
  - Fails on critical/high vulnerabilities

- **🧪 Test & Lint** (`test.yml`)
  - Tests application startup and health endpoints
  - Validates Docker build process
  - Lints Dockerfile with Hadolint
  - Runs on multiple Node.js versions

### Container Images

Pre-built images are available at:
```
ghcr.io/rpanzer-aviatrix/speedtest:latest
ghcr.io/rpanzer-aviatrix/speedtest:main
ghcr.io/rpanzer-aviatrix/speedtest:v1.0.0
```

Images are automatically built and pushed on:
- Push to `main` or `develop` branches
- Git tags starting with `v` (e.g., `v1.0.0`)

For detailed CI/CD documentation, see [GITHUB_ACTIONS.md](GITHUB_ACTIONS.md).

## Helm Chart

The application includes a production-ready Helm chart for Kubernetes deployment:

- **Configurable Environment Variables**: Test file URLs configured as Helm values
- **Namespace Management**: Automatic namespace creation
- **Health Checks**: Built-in liveness and readiness probes
- **Security**: Non-root user execution and security contexts
- **Resource Management**: Configurable CPU and memory limits

For complete Helm deployment guide, see [HELM_DEPLOYMENT.md](HELM_DEPLOYMENT.md).

## License

MIT License
