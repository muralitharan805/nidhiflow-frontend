import {
  ApplicationConfig,
  ErrorHandler,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AppTitleStrategy } from './core/strategies/page-title.strategy';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';

/**
 * Global enterprise application configuration providers.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
    ),
    provideAnimationsAsync(),
    {
      provide: TitleStrategy,
      useClass: AppTitleStrategy,
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
};
