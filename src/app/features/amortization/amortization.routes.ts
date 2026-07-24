import { Routes } from '@angular/router';

export const AMORTIZATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-shell/amortization-page.component').then((m) => m.AmortizationPageComponent),
  },
];
