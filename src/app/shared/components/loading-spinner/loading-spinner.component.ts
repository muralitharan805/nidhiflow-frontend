import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Global loading spinner component displaying dynamic progress indicator during pending HTTP requests.
 */
@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay" role="status" aria-label="Loading content">
        <div class="spinner"></div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(2px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--mat-sys-surface-container-high);
      border-top-color: var(--mat-sys-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  protected readonly loadingService = inject(LoadingService);
}
