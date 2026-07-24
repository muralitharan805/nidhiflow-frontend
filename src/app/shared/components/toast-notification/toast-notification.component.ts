import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Toast notification overlay component rendering dynamic notification popups.
 */
@Component({
  selector: 'app-toast-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="toast-card"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-info]="toast.type === 'info'"
          [class.toast-warning]="toast.type === 'warning'"
          role="alert"
        >
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>!</span> }
              @default { <span>ℹ</span> }
            }
          </div>

          <div class="toast-body">
            <strong class="toast-title">{{ toast.title }}</strong>
            <p class="toast-message">{{ toast.message }}</p>
          </div>

          <button
            type="button"
            class="toast-close-btn"
            aria-label="Dismiss notification"
            (click)="notificationService.dismissToast(toast.id)"
          >
            ✕
          </button>
        </div>
      }
    </aside>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      background-color: var(--mat-sys-surface-container-high, #ffffff);
      color: var(--mat-sys-on-surface, #1c1b1f);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid var(--mat-sys-primary, #6750a4);
      transition: all 0.2s ease-in-out;
    }

    .toast-success {
      border-left-color: var(--mat-sys-success, #2e7d32);
    }
    .toast-error {
      border-left-color: var(--mat-sys-error, #b3261e);
    }
    .toast-warning {
      border-left-color: var(--mat-sys-warning, #ed6c02);
    }
    .toast-info {
      border-left-color: var(--mat-sys-primary, #0288d1);
    }

    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      font-weight: bold;
    }

    .toast-body {
      flex: 1;
    }

    .toast-title {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .toast-message {
      margin: 0;
      font-size: 0.825rem;
      opacity: 0.9;
    }

    .toast-close-btn {
      background: transparent;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: currentColor;
      opacity: 0.6;
      padding: 0 0.25rem;
      line-height: 1;
    }

    .toast-close-btn:hover {
      opacity: 1;
    }
  `]
})
export class ToastNotificationComponent {
  protected readonly notificationService = inject(NotificationService);
}
