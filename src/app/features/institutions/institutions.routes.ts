import { Routes } from '@angular/router';

export const INSTITUTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./institutions-list/institutions-list.component').then(m => m.InstitutionsListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./institution-detail/institution-detail.component').then(m => m.InstitutionDetailComponent)
  }
];
