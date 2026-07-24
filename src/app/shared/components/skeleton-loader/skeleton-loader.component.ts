import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Enterprise skeleton loader UI component displaying animated placeholder states.
 */
@Component({
  selector: 'app-skeleton-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="skeleton-box"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="borderRadius()"
    ></div>
  `,
  styles: [`
    .skeleton-box {
      display: inline-block;
      background: linear-gradient(
        90deg,
        var(--mat-sys-surface-container-low, #e0e0e0) 25%,
        var(--mat-sys-surface-container-high, #f5f5f5) 50%,
        var(--mat-sys-surface-container-low, #e0e0e0) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite linear;
    }

    @keyframes skeleton-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonLoaderComponent {
  public readonly width = input<string>('100%');
  public readonly height = input<string>('1rem');
  public readonly borderRadius = input<string>('4px');
}
