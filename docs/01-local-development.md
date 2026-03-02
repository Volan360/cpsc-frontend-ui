# Local Development

## Prerequisites

| Tool | Required Version |
|------|-----------------|
| Node.js | 20.x or higher |
| npm | 10.x or higher |

## First-Time Setup

```powershell
# Clone / navigate into the frontend directory
cd cpsc-frontend-ui

# Install dependencies
npm install
```

## Running the Development Server

```powershell
npm start
```

Application runs at `http://localhost:4200`. The dev server hot-reloads on file changes.

The frontend expects the backend API to be available at `http://localhost:8080`. Start the backend first:

```powershell
# Terminal 1 — local Lambda analytics server
cd cpsc-analytics-scripts
.\run-local.ps1

# Terminal 2 — Spring Boot backend
cd cpsc-backend-api
.\run-local.ps1

# Terminal 3 — Angular dev server
cd cpsc-frontend-ui
npm start
```

## Environment Configuration

API base URLs are configured in `src/environments/`:

| File | Environment | API URL |
|------|-------------|---------|
| `environment.ts` | local | `http://localhost:8080/api` |
| `environment.devl.ts` | devl | `https://devl.fullstackcashtrack.com/api` |
| `environment.acpt.ts` | acpt | `https://acpt.fullstackcashtrack.com/api` |
| `environment.prod.ts` | prod | `https://prod.fullstackcashtrack.com/api` |

These files are selected automatically by the Angular CLI build configuration — no manual editing is needed for standard deployments.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at `http://localhost:4200` |
| `npm run build` | Build for local/default configuration |
| `npm run build:devl` | Production build targeting devl environment |
| `npm run build:acpt` | Production build targeting acpt environment |
| `npm run build:prod` | Production build targeting prod environment |
| `npm test` | Run unit tests (Karma + Jasmine) |
| `npm run lint` | Lint source code |
| `npm run watch` | Build and watch for changes (development mode) |

## Docker (Local)

```powershell
# Build image
docker build -t cpsc-frontend-ui .

# Run with Docker Compose (serves on port 80 via nginx)
docker-compose up -d
```

Container available at `http://localhost`. The nginx config is in `nginx.conf` at the project root.

## Customizing the Theme

The application uses Angular Material with a custom theme defined in `src/styles/themes.scss`.

To change the overall color scheme:

1. Open `src/styles/themes.scss`
2. Modify `$cpsc-primary-palette` and `$cpsc-accent-palette`
3. Update CSS custom properties in `:root` for additional overrides:

```scss
:root {
  --primary-color: #1e88e5;      // Primary color
  --accent-color: #e91e63;       // Accent color
  --background-color: #fafafa;   // Page background
}
```

All Material components pick up the updated theme automatically.

## Troubleshooting

### `npm install` fails
- Ensure Node.js 20.x is installed: `node --version`
- Delete `node_modules` and `package-lock.json`, then retry

### API calls fail (CORS or network errors)
- Verify the backend is running at `http://localhost:8080`
- Confirm the local Lambda server is running at `http://localhost:9001` (required for analytics)
- Check that the backend CORS config allows `http://localhost:4200`

### Token not attached to requests
- Check browser localStorage for `cpsc_access_token`
- If missing, sign in again — the token is stored after a successful login response
