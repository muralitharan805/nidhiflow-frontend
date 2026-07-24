import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { NotificationService } from '../services/notification.service';

/**
 * Enterprise global error handler capturing uncaught client exceptions.
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notificationService = inject(NotificationService);
  private readonly zone = inject(NgZone);

  public handleError(error: unknown): void {
    console.error('[GlobalErrorHandler Caught Exception]:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown client error occurred.';

    this.zone.run(() => {
      this.notificationService.showError('Application Error', errorMessage);
    });
  }
}
