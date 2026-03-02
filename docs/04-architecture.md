# Architecture

## Project Structure

```
cpsc-frontend-ui/
├── src/
│   ├── app/
│   │   ├── app.component.{ts,html,scss}   # Root component (router outlet)
│   │   ├── app.config.ts                  # App bootstrapping + providers
│   │   ├── app.routes.ts                  # Top-level route definitions
│   │   ├── core/                          # Singleton services, guards, models
│   │   │   ├── components/
│   │   │   │   └── confirm-dialog/        # Reusable yes/no dialog
│   │   │   ├── constants/
│   │   │   │   └── app.constants.ts       # DIALOG_WIDTHS, VALIDATION constants
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts          # Protects all authenticated routes
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts    # Adds Authorization header
│   │   │   │   └── error.interceptor.ts   # Handles errors + token refresh
│   │   │   ├── models/
│   │   │   │   ├── analytics.models.ts
│   │   │   │   ├── auth.models.ts
│   │   │   │   ├── goal.models.ts
│   │   │   │   ├── institution.models.ts
│   │   │   │   └── transaction.models.ts
│   │   │   ├── services/
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── goal.service.ts
│   │   │   │   ├── institution.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── transaction.service.ts
│   │   │   └── utils/
│   │   │       ├── date.utils.ts          # formatDate(), formatCurrency()
│   │   │       └── url.utils.ts           # encodeUuidForUrl(), decodeUuidFromUrl()
│   │   ├── features/
│   │   │   ├── analytics/                 # Tabbed analytics dashboard + 6 sub-components
│   │   │   ├── auth/                      # Sign-in, sign-up, confirm, forgot/reset password
│   │   │   ├── dashboard/                 # Main navigation hub
│   │   │   ├── goals/                     # Goals list, goal detail, create/complete dialogs
│   │   │   ├── help/                      # Static help page
│   │   │   ├── institutions/              # Institution list + detail + dialogs
│   │   │   ├── landing/                   # Public marketing page
│   │   │   └── profile-settings/          # Screen name + account deletion
│   │   └── shared/
│   │       └── components/
│   │           └── password-requirements/ # Password strength visual indicator
│   ├── environments/                      # Per-environment API URL config
│   └── styles/
│       └── themes.scss                    # Angular Material custom theme
├── nginx.conf                             # Nginx config for Docker container
├── Dockerfile                             # Multi-stage Angular build → nginx serve
├── docker-compose.yml                     # Local Docker Compose configuration
└── package.json
```

---

## Angular Architecture

### Standalone Components

All components use the Angular `standalone: true` pattern (Angular 18). There are no `NgModule` declarations — each component declares its own imports directly.

### Lazy-Loaded Routes

Every feature is lazy-loaded using `loadComponent()` or `loadChildren()`:

```typescript
{
  path: 'analytics',
  loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES),
  canActivate: [authGuard]
}
```

This keeps the initial bundle small and loads each feature only when navigated to.

### Path Aliases

`tsconfig.json` defines path aliases so imports don't use deep relative paths:

| Alias | Resolves to |
|-------|-------------|
| `@core/*` | `src/app/core/*` |
| `@environments/*` | `src/environments/*` |
| `@shared/*` | `src/app/shared/*` |

---

## Authentication & State Management

### Token Lifecycle

```
Sign In
  → AuthService.signIn()
  → handleAuthSuccess()
    → stores cpsc_access_token in localStorage
    → stores cpsc_refresh_token in localStorage
    → stores cpsc_user in localStorage
    → sets isAuthenticated signal = true

Protected request
  → authInterceptor adds "Authorization: Bearer <access_token>"
  → errorInterceptor catches 401
    → calls AuthService.refreshAccessToken()
    → on success: retries original request with new token
    → on failure: calls AuthService.signOut()

Sign Out / Delete Account
  → clears all localStorage keys
  → sets isAuthenticated signal = false
  → navigates to /auth/sign-in
```

### Reactive State

`AuthService` uses Angular Signals for UI reactivity:

```typescript
isAuthenticated = signal(this.hasValidToken())   // read by header/nav
currentUser = signal<UserProfile | null>(...)    // read by dashboard/header
```

Components inject `AuthService` and read signals directly — no `async` pipe needed for these values.

---

## Route Guard

`authGuard` (`core/guards/auth.guard.ts`) is a functional guard applied to all protected routes:

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/auth/sign-in']);
};
```

---

## URL Encoding for UUIDs

Institution and goal IDs are UUIDs (contain hyphens). They are encoded before use in URL path segments using `url.utils.ts`:

- `encodeUuidForUrl(uuid)` — replaces `-` with `_` for URL safety
- `decodeUuidFromUrl(encoded)` — restores `-` before API calls

This is applied in `InstitutionDetailComponent` and `GoalDetailComponent` when reading `:id` from route params.

---

## Theming

The Angular Material theme is defined in `src/styles/themes.scss` using the `define-theme()` API (Material 3 / M3):

- Custom color palettes defined with `$cpsc-primary-palette` and `$cpsc-accent-palette`
- CSS custom properties in `:root` for supplemental styling outside Material components
- Single theme applied globally — no dark mode currently

Individual component styles (`*.component.scss`) use the Material theme tokens via CSS variables, keeping color definitions in one place.

---

## Shared Utilities

### `date.utils.ts`

| Function | Description |
|----------|-------------|
| `formatDate(timestamp)` | Converts Unix timestamp (ms or s) to a readable date string |
| `formatCurrency(amount)` | Formats number as USD with 2 decimal places |

### `url.utils.ts`

| Function | Description |
|----------|-------------|
| `encodeUuidForUrl(uuid)` | Replaces `-` with `_` for safe URL path segments |
| `decodeUuidFromUrl(encoded)` | Restores `-` from `_` for API calls |

### `app.constants.ts`

Centralized constants to avoid magic strings/numbers across components:

```typescript
DIALOG_WIDTHS = { SMALL: '400px', MEDIUM: '500px', LARGE: '700px', EXTRA_LARGE: '900px' }
VALIDATION = { DESCRIPTION_MAX_LENGTH: 500, NAME_MAX_LENGTH: 255, MIN_AMOUNT: 0.01 }
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | 18.x | Framework |
| `@angular/material` | 18.x | UI component library |
| `@angular/router` | 18.x | Client-side routing |
| `@angular/forms` | 18.x | Reactive forms |
| `rxjs` | 7.8.x | Async/reactive programming |
| `d3` | 7.9.x | Network graph visualization in Analytics |
| `typescript` | 5.4.x | Language |
