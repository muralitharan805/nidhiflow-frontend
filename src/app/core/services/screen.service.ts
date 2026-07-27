import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

/**
 * Global responsive service driven by Angular CDK BreakpointObserver and Angular Signals.
 * Exposes reactive signals for viewport state and dynamic grid layout calculations.
 */
@Injectable({ providedIn: 'root' })
export class ScreenService {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platformId = inject(PLATFORM_ID);

  /** Signal indicating if the current viewport is Handset/Mobile (< 600px) */
  readonly isMobile = signal<boolean>(false);

  /** Signal indicating if the current viewport is Tablet (600px - 959px) */
  readonly isTablet = signal<boolean>(false);

  /** Signal indicating if the current viewport is Desktop (>= 960px) */
  readonly isDesktop = signal<boolean>(true);

  /** Computed grid column count based on active viewport breakdown */
  readonly gridCols = computed<number>(() => {
    if (this.isMobile()) return 1;
    if (this.isTablet()) return 2;
    return 4;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.breakpointObserver
        .observe([Breakpoints.Handset, Breakpoints.Tablet, Breakpoints.Web])
        .subscribe((result) => {
          const isHandset = result.breakpoints[Breakpoints.Handset] ?? false;
          const isTab = result.breakpoints[Breakpoints.Tablet] ?? false;

          this.isMobile.set(isHandset);
          this.isTablet.set(isTab);
          this.isDesktop.set(!isHandset && !isTab);
        });
    }
  }
}
