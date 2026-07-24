import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Interactive header button toggling Dark and Light theme modes.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-icon-button
      [matTooltip]="themeService.isDarkMode() ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
      (click)="themeService.toggleTheme()"
      aria-label="Toggle Dark/Light Theme"
    >
      <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: [`
    button {
      color: var(--mat-sys-on-surface);
    }
  `]
})
export class ThemeToggleComponent {
  public readonly themeService = inject(ThemeService);
}
