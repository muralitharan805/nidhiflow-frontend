import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        title: 'Dashboard Overview',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'ledger',
        title: 'Ledger & Chart of Accounts',
        loadChildren: () =>
          import('./features/ledger/ledger.routes').then((m) => m.LEDGER_ROUTES),
      },
      {
        path: 'loans',
        title: 'EMI Loan Amortization',
        loadChildren: () =>
          import('./features/amortization/amortization.routes').then((m) => m.AMORTIZATION_ROUTES),
      },
      {
        path: 'forecasting',
        title: 'Financial Forecasting',
        loadChildren: () =>
          import('./features/forecasting/forecasting.routes').then((m) => m.FORECASTING_ROUTES),
      },
      {
        path: 'reports',
        title: 'Financial Reports & Statements',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        title: 'Personal Finance & Net Worth Tracker',
        loadComponent: () =>
          import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
