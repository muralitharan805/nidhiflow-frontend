import { Routes } from '@angular/router';

export const LEDGER_ROUTES: Routes = [
  {
    path: '',
    title: 'Ledger & Chart of Accounts',
    loadComponent: () =>
      import('./feature-shell/ledger-page.component').then((m) => m.LedgerPageComponent),
  },
  {
    path: 'entries',
    title: 'Journal Entries & Audit Trail',
    loadComponent: () =>
      import('./feature-shell/journal-entries-page.component').then((m) => m.JournalEntriesPageComponent),
  },
];
