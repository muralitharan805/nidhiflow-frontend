import { Injectable, signal } from '@angular/core';

/**
 * Toast severity level options.
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Single Toast Notification item payload.
 */
export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
}

/**
 * Enterprise Notification Service broadcasting dynamic UI toast alerts using Signals.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /**
   * Default display duration in milliseconds for toasts.
   */
  private readonly DEFAULT_DURATION_MS = 5000;

  /**
   * Signal holding active toast notification queue.
   */
  private readonly toastQueueSignal = signal<ToastMessage[]>([]);

  /**
   * Read-only signal exposing active toasts.
   */
  public readonly toasts = this.toastQueueSignal.asReadonly();

  /**
   * Dispatch a success toast notification.
   *
   * @param title Header title of the toast
   * @param message Body text description
   * @param durationMs Display duration in milliseconds
   */
  public showSuccess(title: string, message: string, durationMs?: number): void {
    this.addToast('success', title, message, durationMs);
  }

  /**
   * Dispatch an error toast notification.
   *
   * @param title Header title of the toast
   * @param message Body text description
   * @param durationMs Display duration in milliseconds
   */
  public showError(title: string, message: string, durationMs?: number): void {
    this.addToast('error', title, message, durationMs);
  }

  /**
   * Dispatch an informational toast notification.
   *
   * @param title Header title of the toast
   * @param message Body text description
   * @param durationMs Display duration in milliseconds
   */
  public showInfo(title: string, message: string, durationMs?: number): void {
    this.addToast('info', title, message, durationMs);
  }

  /**
   * Dispatch a warning toast notification.
   *
   * @param title Header title of the toast
   * @param message Body text description
   * @param durationMs Display duration in milliseconds
   */
  public showWarning(title: string, message: string, durationMs?: number): void {
    this.addToast('warning', title, message, durationMs);
  }

  /**
   * Manually dismiss a toast by ID.
   *
   * @param toastId Unique identifier of the target toast
   */
  public dismissToast(toastId: string): void {
    this.toastQueueSignal.update((current) => current.filter((t) => t.id !== toastId));
  }

  /**
   * Internal helper to enqueue new toast item.
   */
  private addToast(type: ToastType, title: string, message: string, durationMs?: number): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = durationMs ?? this.DEFAULT_DURATION_MS;

    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      durationMs: duration,
    };

    this.toastQueueSignal.update((current) => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }
  }
}
