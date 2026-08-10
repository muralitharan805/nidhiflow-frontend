import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { SeoService } from './core/services/seo.service';

/**
 * Root application component hosting global UI components and router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastNotificationComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-loading-spinner />
    <app-toast-notification />
    <router-outlet />
  `,
  styleUrl: './app.scss'
})
export class App {
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.initRouteTracking();
  }
}
