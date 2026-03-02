# Backend API Implementation

## Overview

This document tracks the frontend implementation status of all backend API endpoints and features for the CPSC Cornerstone project. Cross-referenced with the backend OpenAPI spec (`cpsc-backend-api/src/main/resources/openapi.yaml`).

---

## Implementation Status

| Endpoint Group | Status |
|---------------|:------:|
| Authentication (`/api/auth/*`) | ✅ Fully implemented |
| Profile management (`/api/secure/*`) | ✅ Fully implemented |
| Institutions (`/api/institutions/*`) | ✅ Fully implemented |
| Transactions (`/api/institutions/{id}/transactions/*`) | ✅ Fully implemented |
| Goals (`/api/goals/*`) | ✅ Fully implemented |
| Analytics — generate + health score | ✅ Fully implemented |
| Analytics — report (`/api/analytics/report`) | ❌ Not yet implemented |
| Test endpoint (`/api/hello`) | ❌ Excluded (TestController) |

---

## Authentication Endpoints

### `POST /api/auth/signup`
- **Component:** `SignUpComponent`
- **Service:** `AuthService.signUp()`
- Email + password registration; redirects to confirm-signup on success

### `POST /api/auth/confirm`
- **Component:** `ConfirmSignupComponent`
- **Service:** `AuthService.confirmSignUp()`
- 6-digit verification code entry

### `POST /api/auth/resend-code`
- **Component:** `ConfirmSignupComponent`
- **Service:** `AuthService.resendConfirmationCode(email)`
- Inline button on the confirm-signup page

### `POST /api/auth/forgot-password`
- **Component:** `ForgotPasswordComponent`
- **Service:** `AuthService.forgotPassword()`
- Sends reset code to email; redirects to reset-password page

### `POST /api/auth/confirm-forgot-password`
- **Component:** `ResetPasswordComponent`
- **Service:** `AuthService.confirmForgotPassword()`
- Accepts verification code + new password; includes password match validation

### `POST /api/auth/login`
- **Component:** `SignInComponent`
- **Service:** `AuthService.signIn()`
- Stores `accessToken` and `refreshToken` in `localStorage`; builds `UserProfile` from response fields (`email`, `screenName`)

### `POST /api/auth/refresh-token`
- **Component:** (none — automatic)
- **Interceptor:** `errorInterceptor`
- **Service:** `AuthService.refreshAccessToken()`
- Triggered automatically on any 401 response; retries the original request on success; signs out on failure

---

## Profile / Account Endpoints

### `GET /api/secure/profile`
- **Service:** `AuthService.getUserProfile()`
- Fetches and caches the current user's profile (`email`, `screenName`)
- Called on dashboard load if cached profile is stale

### `PATCH /api/secure/update-screen-name`
- **Component:** `ProfileSettingsComponent`
- **Service:** `AuthService.updateScreenName(request)`
- Updates Cognito screen name; immediately reflects in `currentUser` signal

### `DELETE /api/secure/delete-account`
- **Component:** `ProfileSettingsComponent`
- **Service:** `AuthService.deleteAccount()`
- Requires typed confirmation in a dialog; deletes Cognito user + all DynamoDB data (cascade handled by backend); clears localStorage and redirects to sign-in

---

## Institution Endpoints

All four backend CRUD operations are implemented.

### `POST /api/institutions`
- **Component:** `CreateInstitutionDialogComponent` (used from both `InstitutionsListComponent` and `InstitutionDetailComponent`)
- **Service:** `InstitutionService.createInstitution(request)`
- Fields: `institutionName`, `startingBalance`

### `GET /api/institutions`
- **Component:** `InstitutionsListComponent`, `InstitutionDetailComponent`, `GoalsListComponent`, `GoalDetailComponent`, `AnalyticsComponent`
- **Service:** `InstitutionService.getInstitutions(limit?, lastEvaluatedKey?)`
- Paginated; current UI loads up to 100 institutions in a single call

### `PATCH /api/institutions/{institutionId}`
- **Component:** `CreateInstitutionDialogComponent` (edit mode, pre-filled)
- **Service:** `InstitutionService.editInstitution(id, request)`
- Partial update: `institutionName?`, `startingBalance?`

### `DELETE /api/institutions/{institutionId}`
- **Component:** `InstitutionsListComponent`
- **Service:** `InstitutionService.deleteInstitution(id)`
- Confirmation dialog before deletion; backend cascades to linked transactions and goals

---

## Transaction Endpoints

All four backend CRUD operations are implemented.

### `POST /api/institutions/{institutionId}/transactions`
- **Component:** `CreateTransactionDialogComponent`
- **Service:** `TransactionService.createTransaction(institutionId, request)`
- Fields: `type` (DEPOSIT/WITHDRAWAL), `amount`, `description?`, `tags?`
- Also called internally by `GoalService.completeGoalWithWithdrawal()` during goal completion

### `GET /api/institutions/{institutionId}/transactions`
- **Component:** `InstitutionDetailComponent`
- **Service:** `TransactionService.getInstitutionTransactions(institutionId)`
- Displayed in a paginated, sortable, filterable table
- `FilterTransactionsDialogComponent` allows filtering by: type, amount range, tags, date range

### `PUT /api/institutions/{institutionId}/transactions/{transactionId}`
- **Component:** `CreateTransactionDialogComponent` (edit mode, pre-filled)
- **Service:** `TransactionService.updateTransaction(institutionId, transactionId, request)`

### `DELETE /api/institutions/{institutionId}/transactions/{transactionId}`
- **Component:** `InstitutionDetailComponent`
- **Service:** `TransactionService.deleteTransaction(institutionId, transactionId)`
- Confirmation dialog; list refreshes automatically

---

## Goal Endpoints

All five backend operations are implemented (CRUD + `complete`).

### `POST /api/goals`
- **Component:** `CreateGoalDialogComponent`
- **Service:** `GoalService.createGoal(request)`
- Fields: `name`, `description?`, `targetAmount?`, `linkedInstitutions?: { [id]: percentage }`
- Institution allocation UI: dropdowns to pick institutions + sliders/inputs for percentages; total must ≤ 100%

### `GET /api/goals`
- **Component:** `GoalsListComponent`, `GoalDetailComponent`
- **Service:** `GoalService.getGoals(limit?, lastEvaluatedKey?)`
- Goals are split into **Active** and **Completed** tabs client-side based on `isActive` field

### `PATCH /api/goals/{goalId}`
- **Component:** `CreateGoalDialogComponent` (edit mode)
- **Service:** `GoalService.editGoal(goalId, request)`

### `DELETE /api/goals/{goalId}`
- **Component:** `GoalsListComponent`
- **Service:** `GoalService.deleteGoal(goalId)`
- Confirmation dialog; refreshes list on success

### `POST /api/goals/{goalId}/complete`
- **Component:** `CompleteGoalDialogComponent`
- **Service:** `GoalService.completeGoal(goalId, { transactionIds })`
- **High-level helper:** `GoalService.completeGoalWithWithdrawal(goal, institutions)`

**Complete Goal flow:**
1. `CompleteGoalDialogComponent` calls `GoalService.calculateTransactionPreview()` to show a per-institution breakdown (withdrawal amount, remaining balance after)
2. On confirm, `completeGoalWithWithdrawal()` creates WITHDRAWAL transactions across all linked institutions proportionally (using `forkJoin`)
3. The resulting transaction IDs are passed to `POST /api/goals/{id}/complete`
4. Goal transitions to `isActive: false`, `completedAt` is set

The **Complete Goal** button is shown in the active goals list only when `GoalService.canCompleteGoal()` returns `true` (current amount ≥ target amount).

---

## Analytics Endpoints

### `POST /api/analytics/generate`
- **Component:** `AnalyticsComponent` (delegates to 5 sub-components)
- **Service:** `AnalyticsService.generate(request)`

| Sub-Component | `analyticsType` | Date Range | Visualization |
|---|---|:---:|---|
| `CashFlowComponent` | `cash_flow` | Required | Summary cards + trend charts |
| `CategoriesComponent` | `categories` | Required | Tag breakdown table + charts |
| `GoalsAnalyticsComponent` | `goals` | None (snapshot) | Progress cards with recommendations |
| `InstitutionsAnalyticsComponent` | `institutions` | Optional | Per-account stats table |
| `NetworkComponent` | `network` | None (snapshot) | D3.js force-directed graph |

### `GET /api/analytics/health-score`
- **Component:** `HealthScoreComponent`
- **Service:** `AnalyticsService.getHealthScore(startDate?, endDate?)`
- Displays overall score (0–100), rating label, component breakdown (savings_rate, goal_progress, spending_diversity, account_utilization, transaction_regularity), and recommendations list

### `POST /api/analytics/report`
- ❌ Not implemented — endpoint exists in backend but no frontend UI

---

## Architecture

### Services (`src/app/core/services/`)
| Service | Responsibility |
|---------|---------------|
| `AuthService` | Authentication, token management, reactive auth state (Signals + BehaviorSubject) |
| `InstitutionService` | Institution CRUD |
| `TransactionService` | Transaction CRUD |
| `GoalService` | Goal CRUD + completion logic + goal-amount calculations |
| `AnalyticsService` | Analytics generate + health score |
| `NotificationService` | Snackbar wrapper (success/error/warning/info) |

### Interceptors (`src/app/core/interceptors/`)
| Interceptor | Responsibility |
|-------------|---------------|
| `authInterceptor` | Adds `Authorization: Bearer <token>` to all non-auth requests |
| `errorInterceptor` | Handles 401 (refresh → retry), 403, network errors; shows notifications |

### Models (`src/app/core/models/`)
- `auth.models.ts` — Login, SignUp, UserProfile, ForgotPassword, etc.
- `institution.models.ts` — CreateInstitutionRequest, EditInstitutionRequest, InstitutionResponse
- `transaction.models.ts` — CreateTransactionRequest, UpdateTransactionRequest, TransactionResponse, TransactionType
- `goal.models.ts` — CreateGoalRequest, EditGoalRequest, CompleteGoalRequest, GoalResponse
- `analytics.models.ts` — AnalyticsRequest, AnalyticsResponse, HealthScoreResponse, typed data interfaces for each analytics type

### Feature Components

| Feature | Components |
|---------|-----------|
| Auth | `SignInComponent`, `SignUpComponent`, `ConfirmSignupComponent`, `ForgotPasswordComponent`, `ResetPasswordComponent` |
| Landing | `LandingComponent` |
| Dashboard | `DashboardComponent` |
| Institutions | `InstitutionsListComponent`, `InstitutionDetailComponent`, `CreateInstitutionDialogComponent`, `CreateTransactionDialogComponent`, `FilterTransactionsDialogComponent` |
| Goals | `GoalsListComponent`, `GoalDetailComponent`, `CreateGoalDialogComponent`, `CompleteGoalDialogComponent` |
| Analytics | `AnalyticsComponent`, `HealthScoreComponent`, `CashFlowComponent`, `CategoriesComponent`, `GoalsAnalyticsComponent`, `InstitutionsAnalyticsComponent`, `NetworkComponent` |
| Profile | `ProfileSettingsComponent` |
| Help | `HelpComponent` |

### Shared / Core Components
- `ConfirmDialogComponent` — Reusable yes/no confirmation dialog used across all delete + account deletion flows
- `PasswordRequirementsComponent` — Visual password strength guide displayed on sign-up and reset-password pages

### Routing
```
/                      → LandingComponent
/auth/sign-in          → SignInComponent
/auth/sign-up          → SignUpComponent
/auth/confirm-signup   → ConfirmSignupComponent
/auth/forgot-password  → ForgotPasswordComponent
/auth/reset-password   → ResetPasswordComponent
/dashboard             → DashboardComponent             [auth required]
/institutions          → InstitutionsListComponent      [auth required]
/institutions/:id      → InstitutionDetailComponent     [auth required]
/goals                 → GoalsListComponent             [auth required]
/goals/:id             → GoalDetailComponent            [auth required]
/analytics             → AnalyticsComponent             [auth required]
/profile-settings      → ProfileSettingsComponent       [auth required]
/help                  → HelpComponent                  [auth required]
```

All protected routes use `authGuard`. Institution and goal IDs in URL paths are UUID-encoded (hyphens replaced with underscores) using `url.utils.ts`.

---

## Environment Configuration

API base URLs are set per environment in `src/environments/`:

| Environment | `apiUrl` |
|-------------|----------|
| Local | `http://localhost:8080/api` |
| devl | `https://devl.fullstackcashtrack.com/api` |
| acpt | `https://acpt.fullstackcashtrack.com/api` |
| prod | `https://prod.fullstackcashtrack.com/api` |

---

## Pending / Not Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| `POST /api/analytics/report` | ❌ Not implemented | Backend endpoint fully functional; no frontend UI yet |
| `GET /api/hello` | ❌ Excluded | TestController not relevant to frontend |
| Pagination controls for institutions list | ❌ | Backend supports `limit`/`lastEvaluatedKey`; UI fetches up to 100 at once |
| Pagination controls for goals list | ❌ | Same as above |
| Analytics report page | ❌ | Backend generates PDF/HTML reports; no frontend trigger yet |
