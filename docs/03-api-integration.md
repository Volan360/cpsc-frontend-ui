# API Integration

## Environment URLs

Every service reads `environment.apiUrl` at runtime:

| Environment | `apiUrl` |
|-------------|----------|
| Local | `http://localhost:8080/api` |
| devl | `https://devl.fullstackcashtrack.com/api` |
| acpt | `https://acpt.fullstackcashtrack.com/api` |
| prod | `https://prod.fullstackcashtrack.com/api` |

---

## HTTP Interceptors

Two functional interceptors are registered in `app.config.ts`.

### `authInterceptor` (`core/interceptors/auth.interceptor.ts`)

Clones every outbound request that is NOT to `/auth/*` and adds:

```
Authorization: Bearer <access_token>
```

The token is read from `AuthService.getAccessToken()`, which reads `localStorage['cpsc_access_token']`.

### `errorInterceptor` (`core/interceptors/error.interceptor.ts`)

Handles HTTP error responses uniformly:

| Status | Action |
|--------|--------|
| 0 (network) | Shows "Unable to connect to the server" via `NotificationService` |
| 401 | Attempts token refresh using `AuthService.refreshAccessToken()`; on success the original request is retried; on failure the user is signed out and redirected to `/auth/sign-in` |
| 403 | Shows "You do not have permission" notification |
| 404 | Passes through silently (services handle individually) |
| 5xx | Shows "Server error, please try again later" notification |

Only one refresh attempt is made concurrently — an `isRefreshing` flag prevents parallel refresh races.

---

## Services

### `AuthService` (`core/services/auth.service.ts`)

Handles all Cognito-backed authentication and user management. Stores tokens and user profile in `localStorage`.

**Reactive state:**
- `isAuthenticated` — Angular `signal<boolean>`, updated on login/logout/token events
- `currentUser` — Angular `signal<UserProfile | null>`
- `authState$` — RxJS `BehaviorSubject<AuthState>` for components needing an Observable

| Method | Backend Endpoint | Description |
|--------|-----------------|-------------|
| `signIn(credentials)` | `POST /api/auth/login` | Authenticates, stores tokens, builds user profile from response |
| `signUp(request)` | `POST /api/auth/signup` | Registers new user |
| `confirmSignUp(request)` | `POST /api/auth/confirm` | Submits verification code |
| `resendConfirmationCode(email)` | `POST /api/auth/resend-code` | Resends email code |
| `forgotPassword(request)` | `POST /api/auth/forgot-password` | Initiates password reset |
| `confirmForgotPassword(request)` | `POST /api/auth/confirm-forgot-password` | Completes password reset |
| `getUserProfile()` | `GET /api/secure/profile` | Fetches and caches user profile |
| `updateScreenName(request)` | `PATCH /api/secure/update-screen-name` | Updates name in Cognito + local cache |
| `deleteAccount()` | `DELETE /api/secure/delete-account` | Deletes account, clears auth, redirects |
| `refreshAccessToken()` | `POST /api/auth/refresh-token` | Exchanges refresh token for new access token |
| `signOut()` | (local) | Clears localStorage and redirects to sign-in |

**Token storage keys:**
- `cpsc_access_token` — JWT access token (sent with every protected request)
- `cpsc_refresh_token` — Refresh token (used by `errorInterceptor` on 401)
- `cpsc_user` — Serialized `UserProfile` for display without API round-trip

### `InstitutionService` (`core/services/institution.service.ts`)

| Method | Backend Endpoint | Description |
|--------|-----------------|-------------|
| `createInstitution(request)` | `POST /api/institutions` | Creates institution |
| `getInstitutions(limit?, lastEvaluatedKey?)` | `GET /api/institutions` | Paginated list |
| `editInstitution(id, request)` | `PATCH /api/institutions/{id}` | Edit name/starting balance |
| `deleteInstitution(id)` | `DELETE /api/institutions/{id}` | Delete + cascade |

### `TransactionService` (`core/services/transaction.service.ts`)

| Method | Backend Endpoint | Description |
|--------|-----------------|-------------|
| `createTransaction(institutionId, request)` | `POST /api/institutions/{id}/transactions` | Add transaction |
| `getInstitutionTransactions(institutionId)` | `GET /api/institutions/{id}/transactions` | All transactions for institution |
| `updateTransaction(institutionId, transactionId, request)` | `PUT /api/institutions/{id}/transactions/{txId}` | Edit transaction |
| `deleteTransaction(institutionId, transactionId)` | `DELETE /api/institutions/{id}/transactions/{txId}` | Delete transaction |

### `GoalService` (`core/services/goal.service.ts`)

| Method | Backend Endpoint | Description |
|--------|-----------------|-------------|
| `createGoal(request)` | `POST /api/goals` | Create goal |
| `getGoals(limit?, lastEvaluatedKey?)` | `GET /api/goals` | Paginated list |
| `editGoal(goalId, request)` | `PATCH /api/goals/{id}` | Edit goal |
| `deleteGoal(goalId)` | `DELETE /api/goals/{id}` | Delete goal |
| `completeGoal(goalId, request)` | `POST /api/goals/{id}/complete` | Mark goal complete with transaction IDs |
| `completeGoalWithWithdrawal(goal, institutions)` | (composite) | Creates withdrawal transactions proportionally then calls `completeGoal` |
| `canCompleteGoal(goal, institutions)` | (local) | Returns `true` if current amount ≥ target |
| `calculateCurrentAmount(goal, institutions)` | (local) | Sums `balance × %` across linked institutions |
| `calculateTransactionPreview(goal, institutions)` | (local) | Returns per-institution withdrawal preview array |

`completeGoalWithWithdrawal()` is a high-level helper that:
1. Calculates proportional withdrawals across linked institutions
2. Creates withdrawal transactions via `TransactionService` (using `forkJoin`)
3. Calls `completeGoal` with the resulting transaction IDs

### `AnalyticsService` (`core/services/analytics.service.ts`)

| Method | Backend Endpoint | Description |
|--------|-----------------|-------------|
| `generate(request)` | `POST /api/analytics/generate` | Run analytics (all types except health) |
| `getHealthScore(startDate?, endDate?)` | `GET /api/analytics/health-score` | Financial health score + recommendations |

> `POST /api/analytics/report` is not yet implemented in the frontend.

### `NotificationService` (`core/services/notification.service.ts`)

Thin wrapper around Angular Material Snackbar. Used by all components and `errorInterceptor`.

| Method | Snackbar duration | Description |
|--------|:-----------------:|-------------|
| `success(message)` | 3s | Green success notification |
| `error(message)` | 5s | Red error notification |
| `warning(message)` | 4s | Orange warning notification |
| `info(message)` | 3s | Info notification |

---

## Models

### `auth.models.ts`

| Interface | Used by |
|-----------|---------|
| `LoginRequest` | `AuthService.signIn()` |
| `LoginResponse` | `AuthService.signIn()` — includes `accessToken`, `refreshToken`, `email`, `screenName` |
| `SignUpRequest` | `AuthService.signUp()` |
| `SignUpResponse` | — |
| `ConfirmSignUpRequest` | `AuthService.confirmSignUp()` |
| `UserProfile` | Stored in localStorage; `email`, `screenName`, `authenticated` |
| `AuthState` | `authState$` observable |
| `ForgotPasswordRequest` / `ForgotPasswordResponse` | Password reset flow |
| `ConfirmForgotPasswordRequest` / `ConfirmForgotPasswordResponse` | Password reset confirmation |
| `UpdateScreenNameRequest` / `UpdateScreenNameResponse` | Screen name update |

### `institution.models.ts`

| Interface | Fields |
|-----------|--------|
| `CreateInstitutionRequest` | `institutionName`, `startingBalance` |
| `EditInstitutionRequest` | `institutionName?`, `startingBalance?` |
| `InstitutionResponse` | `institutionId`, `institutionName`, `startingBalance`, `currentBalance`, `createdAt`, `userId`, `allocatedPercent?`, `linkedGoals?` |
| `GetInstitutionsResponse` | `institutions: InstitutionResponse[]`, `nextToken?` |

### `transaction.models.ts`

| Interface | Fields |
|-----------|--------|
| `CreateTransactionRequest` | `type: TransactionType`, `amount`, `description?`, `tags?` |
| `UpdateTransactionRequest` | `type?`, `amount?`, `description?`, `tags?` |
| `TransactionResponse` | `transactionId`, `institutionId`, `type`, `amount`, `description?`, `tags?`, `createdAt`, `userId` |
| `TransactionType` (enum) | `DEPOSIT`, `WITHDRAWAL` |

### `goal.models.ts`

| Interface | Fields |
|-----------|--------|
| `CreateGoalRequest` | `name`, `description?`, `targetAmount?`, `linkedInstitutions?: { [id: string]: number }` |
| `EditGoalRequest` | All fields optional |
| `CompleteGoalRequest` | `transactionIds: string[]` |
| `GoalResponse` | `goalId`, `name`, `description?`, `targetAmount?`, `linkedInstitutions?`, `isCompleted?`, `isActive?`, `linkedTransactions?`, `completedAt?`, `createdAt`, `userId` |
| `GetGoalsResponse` | `goals: GoalResponse[]`, `nextToken?` |

`linkedInstitutions` maps `institutionId → allocation percentage (0–100)`. The total across all linked institutions must not exceed 100%.

### `analytics.models.ts`

| Type / Interface | Description |
|-----------------|-------------|
| `AnalyticsType` | `'cash_flow' \| 'categories' \| 'goals' \| 'institutions' \| 'network' \| 'health'` |
| `AnalyticsRequest` | `analyticsType`, `dateRange?`, `options?` |
| `AnalyticsResponse` | Generic wrapper: `analyticsType`, `userId`, `generatedAt`, `data` (typed per type) |
| `HealthScoreResponse` | `overallScore`, `rating`, `components`, `recommendations`, `periodDays`, `computedAt`, `userId` |
| `CashFlowData` | Summary, metrics, trends (with periods array), anomalies |
| `CategoriesData` | Tag totals/counts/percentages, top categories, diversity |
| `GoalsData` | Goal progress snapshot with at-risk / near-completion insights |
| `InstitutionsData` | Per-institution balance, transaction activity, goal linkage |
| `NetworkData` | Graph with `nodes` (institution/category/goal) and `edges` (weighted flows) |

---

## Backend API Compliance Summary

| Endpoint Group | Frontend Status |
|---------------|:--------------:|
| `POST /api/auth/signup` | ✅ |
| `POST /api/auth/confirm` | ✅ |
| `POST /api/auth/resend-code` | ✅ |
| `POST /api/auth/forgot-password` | ✅ |
| `POST /api/auth/confirm-forgot-password` | ✅ |
| `POST /api/auth/login` | ✅ |
| `POST /api/auth/refresh-token` | ✅ (via error interceptor) |
| `GET /api/secure/profile` | ✅ |
| `PATCH /api/secure/update-screen-name` | ✅ |
| `DELETE /api/secure/delete-account` | ✅ |
| `POST /api/institutions` | ✅ |
| `GET /api/institutions` | ✅ |
| `PATCH /api/institutions/{id}` | ✅ |
| `DELETE /api/institutions/{id}` | ✅ |
| `POST /api/institutions/{id}/transactions` | ✅ |
| `GET /api/institutions/{id}/transactions` | ✅ |
| `PUT /api/institutions/{id}/transactions/{txId}` | ✅ |
| `DELETE /api/institutions/{id}/transactions/{txId}` | ✅ |
| `POST /api/goals` | ✅ |
| `GET /api/goals` | ✅ |
| `PATCH /api/goals/{id}` | ✅ |
| `DELETE /api/goals/{id}` | ✅ |
| `POST /api/goals/{id}/complete` | ✅ |
| `POST /api/analytics/generate` | ✅ |
| `GET /api/analytics/health-score` | ✅ |
| `POST /api/analytics/report` | ❌ Not yet implemented |
| `GET /api/hello` | ❌ Not used (TestController excluded) |
