import { Component, input, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Standalone Google AdSense Banner Component with Web Vitals Cumulative Layout Shift (CLS)
 * minimum vertical height reservation and platform-guarded browser script execution.
 */
@Component({
  selector: 'app-adsense',
  template: `
    @if (!isDevMode()) {
      <div class="ad-container-wrapper" style="min-height: 250px; width: 100%; display: block;">
        <ins class="adsbygoogle"
             style="display:block"
             [attr.data-ad-client]="client()"
             [attr.data-ad-slot]="slot()"
             [attr.data-ad-format]="format()"
             data-full-width-responsive="true"></ins>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        margin: 1.5rem 0;
      }
    `
  ]
})
export class AdsenseComponent implements OnInit {
  /** AdSense ad unit slot ID */
  readonly slot = input<string>('');
  /** Ad unit layout format */
  readonly format = input<string>('auto');
  /** Google AdSense Publisher Client ID */
  readonly client = input<string>('ca-pub-1649083292065809');

  protected readonly isDevMode = signal(true);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Initializes platform check and triggers AdSense script execution in non-local environments.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        this.isDevMode.set(false);
        try {
          const win = window as unknown as { adsbygoogle?: unknown[] };
          win.adsbygoogle = win.adsbygoogle || [];
          win.adsbygoogle.push({});
        } catch (e: unknown) {
          // Safe fallback
        }
      }
    }
  }
}
