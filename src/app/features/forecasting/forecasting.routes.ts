import { Routes } from '@angular/router';

export const FORECASTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-shell/forecasting-page.component').then((m) => m.ForecastingPageComponent),
  },
];
