# Routing and Features

## Route Map

| Path | Component | Auth Required | Description |
|------|-----------|:---:|-------------|
| `/` | `LandingComponent` | No | Public marketing / welcome page |
| `/auth/sign-in` | `SignInComponent` | No | Login page |
| `/auth/sign-up` | `SignUpComponent` | No | Registration page |
| `/auth/confirm-signup` | `ConfirmSignupComponent` | No | Email verification code entry |
| `/auth/forgot-password` | `ForgotPasswordComponent` | No | Initiate password reset |
| `/auth/reset-password` | `ResetPasswordComponent` | No | Enter code + new password |
| `/dashboard` | `DashboardComponent` | Yes | Main home page with navigation cards |
| `/institutions` | `InstitutionsListComponent` | Yes | List all financial institutions |
| `/institutions/:id` | `InstitutionDetailComponent` | Yes | Institution detail + transaction list |
| `/goals` | `GoalsListComponent` | Yes | Goal list (active + completed tabs) |
| `/goals/:id` | `GoalDetailComponent` | Yes | Goal detail with linked institutions |
| `/analytics` | `AnalyticsComponent` | Yes | Analytics dashboard (tabbed) |
| `/profile-settings` | `ProfileSettingsComponent` | Yes | Update screen name, delete account |
| `/help` | `HelpComponent` | Yes | Help and FAQ page |
| `/**` | (redirect) | — | Unknown paths redirect to `/` |

All protected routes use `authGuard` which checks for a valid JWT token in localStorage. Unauthenticated access redirects to `/auth/sign-in`.

---

## Feature Pages

### Landing (`/`)

Public marketing page with animated sections:
- Hero section with Sign Up / Sign In CTAs
- Features overview (tracking accounts, managing transactions, setting goals, analytics)
- Animated scroll-reveal sections using Angular animations
- No authentication or API calls required

### Authentication (`/auth/*`)

Full authentication flow powered by AWS Cognito via the backend.

**Sign Up** → **Confirm Sign Up** → **Sign In** is the new-user journey.

**Forgot Password** → **Reset Password** handles credential recovery.

- Password strength requirements displayed via the `PasswordRequirementsComponent` 
- Confirmation code can be resent from `ConfirmSignupComponent`
- After login, the access token and refresh token are stored in `localStorage`

### Dashboard (`/dashboard`)

Navigation hub with cards linking to all major features:
- Financial Institutions
- Goals
- Analytics

Displays the authenticated user's screen name from the profile stored in `localStorage`.

### Institutions (`/institutions`, `/institutions/:id`)

Full CRUD management for financial accounts.

**Institutions List** (`/institutions`):
- Table of all institutions with starting balance, current balance, and goal allocation %
- Create new institution via dialog (name + starting balance)
- Edit institution inline via dialog (name and/or starting balance)
- Delete institution (with confirmation dialog — cascades on the backend)
- Navigate to institution detail by clicking a row

**Institution Detail** (`/institutions/:id`):
- Institution header with current balance and goal associations
- Full paginated transaction list (5/10/25/50/100 per page)
- Sort transactions newest → oldest or oldest → newest
- **Filter transactions** via dialog — filter by type (DEPOSIT/WITHDRAWAL), amount range, tags, and date range
- Create transaction dialog (type, amount, description, tags)
- Edit transaction dialog (pre-filled with existing values)
- Delete transaction (with confirmation)
- Linked goals expansion panel showing which goals reference this institution

### Goals (`/goals`, `/goals/:id`)

Full goal lifecycle management.

**Goals List** (`/goals`):
- Separate **Active** and **Completed** tabs
- Active goals table: name, target amount, current amount (calculated from linked institutions), progress, actions
- Completed goals table: name, target amount, completion date, actions
- Create goal dialog: name, optional description, optional target amount, linked institutions with % allocation
- Delete goal (with confirmation)
- Navigate to goal detail by clicking a row
- **Complete Goal** button visible when current amount ≥ target amount — opens completion dialog

**Goal Detail** (`/goals/:id`):
- Full goal summary: description, target, current progress, status
- Linked institutions table with balances and allocated percentages
- Linked transactions list (after completion)
- Completion status (active vs. completed with date)

**Complete Goal Dialog**:
- Shows a preview of withdrawal transactions that will be created across linked institutions
- Calculates proportional withdrawal amounts based on institution percentages and target amount
- Confirms goal completion: creates withdrawal transactions, then calls `/api/goals/{id}/complete`

### Analytics (`/analytics`)

Tabbed analytics dashboard powered by Lambda analytics functions.

Six analytics tabs (date range picker at the top applies to all date-range-based tabs):

| Tab | Analytics Type | Date Range | Description |
|-----|---------------|:---:|-------------|
| Health Score | `health` | Optional | Overall financial health score (0-100) with component breakdown and recommendations |
| Cash Flow | `cash_flow` | Required | Income vs. spending summary, trends, metrics, anomaly detection |
| Categories | `categories` | Required | Spending breakdown by transaction tags with diversity metrics |
| Goals | `goals` | N/A | Current goal progress snapshot (no date range) |
| Institutions | `institutions` | Optional | Per-account balance and activity analysis |
| Network | `network` | N/A | Graph of relationships between accounts, categories, and goals |

- Date range picker defaults to 1 Jan 2023 → 31 Dec 2025
- Date range is disabled for the Goals and Network tabs (they are snapshots)
- Each sub-component calls `AnalyticsService.generate()` with the appropriate `analyticsType`
- Health Score tab uses `AnalyticsService.getHealthScore()` separately
- Network tab renders a D3.js force-directed graph visualization
- Loading spinners shown while Lambda functions execute (cold starts can take several seconds)

> Note: `POST /api/analytics/report` (the report generation endpoint) is not currently implemented in the frontend.

### Profile Settings (`/profile-settings`)

- Update screen name (immediately reflected in the header)
- Delete account permanently (requires typed confirmation, cascades deletion through backend)

### Help (`/help`)

Static help and FAQ page. No API calls.

---

## Dialogs

| Dialog | Used In | Purpose |
|--------|---------|---------|
| `CreateInstitutionDialogComponent` | Institutions List + Institution Detail | Create or edit an institution |
| `CreateTransactionDialogComponent` | Institution Detail | Create a new transaction |
| `FilterTransactionsDialogComponent` | Institution Detail | Filter visible transactions by type, amount, tags, date |
| `CreateGoalDialogComponent` | Goals List | Create a new goal with linked institutions |
| `CompleteGoalDialogComponent` | Goals List | Preview withdrawals and confirm goal completion |
| `ConfirmDialogComponent` (shared) | Everywhere | Generic yes/no confirmation for destructive actions |
