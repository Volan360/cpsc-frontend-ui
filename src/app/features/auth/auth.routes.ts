import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.component').then(m => m.SignInComponent)
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'confirm',
    loadComponent: () => import('./confirm-signup/confirm-signup.component').then(m => m.ConfirmSignupComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full'
  }
];
