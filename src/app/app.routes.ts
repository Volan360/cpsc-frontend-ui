import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'institutions',
    loadChildren: () => import('./features/institutions/institutions.routes').then(m => m.INSTITUTIONS_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'goals',
    loadChildren: () => import('./features/goals/goals.routes').then(m => m.GOALS_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'profile-settings',
    loadComponent: () => import('./features/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
