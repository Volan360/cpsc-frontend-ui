# CPSC Frontend UI

Angular 18 SPA for the CPSC Cornerstone financial tracking application.

**Stack:** Angular 18 · Angular Material 18 · TypeScript · D3.js · nginx · AWS S3 + CloudFront

---

## Quick Start

```powershell
# Install dependencies
npm install

# Start development server (http://localhost:4200)
npm start
```

The frontend expects the backend at `http://localhost:8080`. See [docs/01-local-development.md](docs/01-local-development.md) for the full three-terminal startup sequence (Lambda server + backend + frontend).

---

## Documentation

| File | Contents |
|------|----------|
| [docs/01-local-development.md](docs/01-local-development.md) | Prerequisites, dev server, environment config, Docker, scripts, troubleshooting |
| [docs/02-routing-and-features.md](docs/02-routing-and-features.md) | All routes, page descriptions, dialogs |
| [docs/03-api-integration.md](docs/03-api-integration.md) | Services, models, interceptors, backend endpoint mapping |
| [docs/04-architecture.md](docs/04-architecture.md) | Project structure, standalone components, state management, theming |
| [docs/05-deployment.md](docs/05-deployment.md) | S3 + CloudFront, CodePipeline, Docker |

For frontend–backend integration compliance: [BACKEND-IMPLEMENTATION.md](BACKEND-IMPLEMENTATION.md)

---

## Features

- **Landing page** — Public marketing page with animated sections
- **Authentication** — Full Cognito flow: sign up, confirm, sign in, forgot/reset password
- **Institutions** — CRUD: create, view, edit, delete financial accounts
- **Transactions** — CRUD: create, view, edit, delete, filter transactions per institution
- **Goals** — Full lifecycle: create, track progress, complete with automatic withdrawal creation
- **Analytics** — 6-tab dashboard (Health Score, Cash Flow, Categories, Goals, Institutions, Network) powered by Lambda
- **Profile Settings** — Update screen name, delete account
- **Help** — FAQ and help page
- **Automatic token refresh** — 401 responses silently refresh the JWT and retry the request

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server at `http://localhost:4200` |
| `npm run build:devl` | Build targeting devl environment |
| `npm run build:acpt` | Build targeting acpt environment |
| `npm run build:prod` | Build targeting prod environment |
| `npm test` | Run unit tests |
| `npm run lint` | Lint source |

---

## Environments

| Environment | Frontend URL |
|-------------|-------------|
| Local | `http://localhost:4200` |
| devl | `https://app-devl.fullstackcashtrack.com` |
| acpt | `https://app-acpt.fullstackcashtrack.com` |
| prod | `https://www.fullstackcashtrack.com` |
