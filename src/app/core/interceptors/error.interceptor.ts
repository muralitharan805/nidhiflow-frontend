import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor handling error status codes and notifying users.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 401:
            notificationService.showError('Session Expired', 'Please log in again to continue.');
            authService.logout();
            void router.navigate(['/auth/login']);
            break;

          case 403:
            notificationService.showError('Access Denied', 'You do not have permission to access this resource.');
            break;

          case 404:
            notificationService.showWarning('Resource Not Found', 'The requested endpoint does not exist.');
            break;

          case 500:
          case 502:
          case 503:
            notificationService.showError('Server Error', 'An unexpected server error occurred. Please try again later.');
            break;

          default:
            notificationService.showError(
              'Request Failed',
              error.error?.message || 'An error occurred while processing your request.'
            );
            break;
        }
      }

      return throwError(() => error);
    })
  );
};
