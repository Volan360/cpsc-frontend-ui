# Deployment

## Environments

| Environment | Trigger | CloudFront URL |
|-------------|---------|----------------|
| devl | Manual pipeline trigger | `https://app-devl.fullstackcashtrack.com` |
| acpt | Auto-deploys on push to `main` | `https://app-acpt.fullstackcashtrack.com` |
| prod | Manual pipeline trigger | `https://www.fullstackcashtrack.com` |

---

## Build Process

The frontend is a **static Angular SPA** deployed to **S3 + CloudFront**. CodeBuild compiles the Angular app and uploads the build artifacts.

### Manual Build

```powershell
# Install dependencies
npm ci

# Build for a specific environment
npm run build:devl   # → dist/cpsc-frontend-ui/browser/
npm run build:acpt
npm run build:prod
```

Artifacts are output to `dist/cpsc-frontend-ui/browser/`. These are the files deployed to the S3 bucket.

### CodeBuild (`buildspec.yml`)

```yaml
phases:
  pre_build:
    commands: npm ci
  build:
    commands: npm run build:$BUILD_ENV   # BUILD_ENV set by pipeline
artifacts:
  base-directory: dist/cpsc-frontend-ui/browser
  files: ['**/*']
```

The `BUILD_ENV` environment variable is set by the CodePipeline/CodeBuild project configuration (`devl`, `acpt`, or `prod`).

---

## AWS Infrastructure

| AWS Service | Role |
|-------------|------|
| **S3** | Stores built static files |
| **CloudFront** | CDN — serves files globally with HTTPS and custom domains |
| **CodeBuild** | Runs `npm ci` + `npm run build:$BUILD_ENV` |
| **CodePipeline** | Orchestrates source → build → deploy |
| **Lambda@Edge** | URL rewriting for Angular client-side routing (`/` serves `index.html` for all paths) |

CloudFront is configured with a Lambda@Edge function that rewrites all non-file requests to `index.html`, enabling Angular's client-side router to handle all navigation.

See `cpsc-cicd-pipelines/frontend/` for the full pipeline and infrastructure configurations.

---

## Docker (Local / Container Testing)

The `Dockerfile` uses a multi-stage build:

1. **Build stage** — Node.js image runs `npm ci` and `npm run build`
2. **Serve stage** — nginx image serves the built files

```powershell
# Build image
docker build -t cpsc-frontend-ui .

# Start container (serves on port 80)
docker-compose up -d

# Access at http://localhost
```

The nginx configuration (`nginx.conf`) includes `try_files $uri $uri/ /index.html` to support client-side routing inside the container.

---

## Start / Stop Services (Non-Production)

The monorepo includes convenience scripts for starting all services together:

```powershell
# From the repo root — starts frontend + backend + Lambda server
.\cpsc-cicd-pipelines\startup-services.ps1

# Stop all services
.\cpsc-cicd-pipelines\shutdown-services.ps1
```

These scripts are intended for local/devl environments only.

---

## Updating the CloudFront Distribution

After deploying new files to S3, create a CloudFront invalidation to clear cached files:

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

For the devl and acpt environments the CodePipeline handles this automatically. For manual deployments to prod, run the invalidation command after upload.
