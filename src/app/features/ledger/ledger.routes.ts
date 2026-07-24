import { Routes } from '@angular/router';

export const LEDGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-shell/ledger-page.component').then((m) => m.LedgerPageComponent),
  },
];
