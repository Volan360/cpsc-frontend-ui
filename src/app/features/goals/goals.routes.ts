import { Routes } from '@angular/router';

export const GOALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./goals-list/goals-list.component').then(m => m.GoalsListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./goal-detail/goal-detail.component').then(m => m.GoalDetailComponent)
  }
];
