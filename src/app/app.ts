import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';

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
export class App {}
