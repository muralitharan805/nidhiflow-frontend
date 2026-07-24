import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Enterprise empty state component for presenting clean zero-data placeholder displays.
 */
@Component({
  selector: 'app-empty-state',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state-container">
      <div class="icon-wrapper">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-description">{{ description() }}</p>

      @if (actionLabel()) {
        <button mat-flat-button color="primary" (click)="actionClicked.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      background-color: var(--mat-sys-surface-container-lowest, #ffffff);
      border: 1px dashed var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: var(--mat-sys-corner-medium, 12px);
    }

    .icon-wrapper {
      font-size: 3rem;
      color: var(--mat-sys-outline);
      margin-bottom: 1rem;

      mat-icon {
        width: 64px;
        height: 64px;
        font-size: 64px;
      }
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 0 0 0.5rem 0;
    }

    .empty-description {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
      max-width: 400px;
      margin: 0 0 1.5rem 0;
    }
  `]
})
export class EmptyStateComponent {
  public readonly icon = input<string>('inbox');
  public readonly title = input<string>('No Data Found');
  public readonly description = input<string>('There are no items to display at this time.');
  public readonly actionLabel = input<string | null>(null);

  public readonly actionClicked = output<void>();
}
