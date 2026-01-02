# CPSC Frontend UI

Angular 18 frontend application for the CPSC Cornerstone project.

## Features

- **Modern Angular 18** with standalone components
- **Angular Material** for consistent UI components
- **Modular theming** system for easy style customization
- **JWT Authentication** with AWS Cognito integration
- **Responsive design** optimized for mobile and desktop
- **Route guards** for protected pages
- **HTTP interceptors** for automatic token injection
- **Multi-environment support** (local, devl, acpt, prod)

## Project Structure

```
src/
├── app/
│   ├── core/                    # Core services and guards
│   │   ├── guards/              # Route guards
│   │   ├── interceptors/        # HTTP interceptors
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/            # Core services
│   ├── features/                # Feature modules
│   │   ├── auth/               # Authentication pages
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── confirm-signup/
│   │   └── dashboard/           # Main dashboard
│   ├── shared/                  # Shared components
│   └── app.component.ts         # Root component
├── environments/                # Environment configurations
├── styles/                      # Global styles and themes
│   └── themes.scss             # Material theme customization
└── index.html
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```powershell
# Install dependencies
npm install

# Start development server
npm start

# Application will be available at http://localhost:4200
```

### Building

```powershell
# Build for local/development
npm run build

# Build for specific environment
npm run build:devl   # Development environment
npm run build:acpt   # Acceptance environment
npm run build:prod   # Production environment
```

### Docker

```powershell
# Build Docker image
docker build -t cpsc-frontend-ui .

# Run with Docker Compose
docker-compose up -d

# Application will be available at http://localhost
```

## Customizing the Theme

The application uses a modular theming system. To change the entire application's appearance:

1. Open `src/styles/themes.scss`
2. Modify the color palettes:
   - `$cpsc-primary-palette` - Primary colors
   - `$cpsc-accent-palette` - Accent colors
3. Update CSS variables in `:root` for additional customization

Example:
```scss
:root {
  --primary-color: #1e88e5;      // Change primary color
  --accent-color: #e91e63;       // Change accent color
  --background-color: #fafafa;   // Change background
}
```

All components will automatically use the updated theme.

## Environment Configuration

Update backend API URLs in environment files:

- `src/environments/environment.ts` - Local development
- `src/environments/environment.devl.ts` - Development environment
- `src/environments/environment.acpt.ts` - Acceptance environment
- `src/environments/environment.prod.ts` - Production environment

Example:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.cpsc.example.com/api',
  environmentName: 'prod'
};
```

## Authentication Flow

1. **Sign Up** - Users register with email and password
2. **Confirm** - Users enter verification code from email
3. **Sign In** - Users authenticate and receive JWT tokens
4. **Protected Routes** - Dashboard and other routes require authentication
5. **Auto Token Refresh** - Tokens are automatically attached to API requests

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:devl` - Build for development environment
- `npm run build:acpt` - Build for acceptance environment
- `npm run build:prod` - Build for production environment
- `npm test` - Run unit tests
- `npm run lint` - Lint code

## API Integration

The frontend communicates with the CPSC Backend API. Ensure the backend is running and accessible at the configured `apiUrl` in the environment files.

### API Endpoints Used

- `POST /api/auth/signup` - User registration
- `POST /api/auth/confirm-signup` - Verify email
- `POST /api/auth/login` - User authentication
- `POST /api/auth/resend-code` - Resend verification code
- `GET /api/secure/profile` - Get user profile (requires JWT)

## Deployment

The application is containerized and can be deployed to:

- **AWS ECS/Fargate** - Container orchestration
- **AWS S3 + CloudFront** - Static hosting (after build)
- **Any container platform** - Docker/Kubernetes compatible

See `cpsc-cicd-pipelines/frontend/` for AWS deployment configurations.

## Contributing

1. Create feature branches from `main`
2. Follow Angular style guide
3. Write unit tests for new components
4. Update documentation as needed

## License

Proprietary - CPSC Cornerstone Project
