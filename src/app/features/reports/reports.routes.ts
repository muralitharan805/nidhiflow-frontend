import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-shell/reports-page.component').then((m) => m.ReportsPageComponent),
  },
];
