import { Injectable, signal, computed } from '@angular/core';

/**
 * Service managing global application loading spinner states using Signals.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  /**
   * Internal signal tracking active request counter.
   */
  private readonly activeRequestsSignal = signal<number>(0);

  /**
   * Public computed signal deriving boolean loading status.
   */
  public readonly isLoading = computed(() => this.activeRequestsSignal() > 0);

  /**
   * Increment active request counter to display loading state.
   */
  public show(): void {
    this.activeRequestsSignal.update((count) => count + 1);
  }

  /**
   * Decrement active request counter when a request completes.
   */
  public hide(): void {
    this.activeRequestsSignal.update((count) => Math.max(0, count - 1));
  }

  /**
   * Force reset active request counter to zero.
   */
  public reset(): void {
    this.activeRequestsSignal.set(0);
  }
}
