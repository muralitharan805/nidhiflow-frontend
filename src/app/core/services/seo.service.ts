import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Interface defining metadata parameters for page-level SEO configuration.
 */
export interface SeoConfig {
  /** Page title tag content */
  title: string;
  /** Meta description tag content */
  description: string;
  /** Canonical and Open Graph URL */
  url: string;
  /** Social share image URL */
  image?: string;
  /** Optional override for canonical URL tag */
  canonicalUrl?: string;
}

/**
 * Service providing centralized dynamic SEO meta tag updates, canonical link synchronization,
 * and GA4 Google Analytics navigation tracking across SPA route transitions for NidhiFlow.
 */
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly gaMeasurementId = 'G-F7RG8H1MM1';

  /**
   * Initializes router listeners for automatic GA4 page_view tracking and canonical URL sync on NavigationEnd.
   */
  initRouteTracking(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const fullUrl = `https://nidhiflow.seyalicraft.com${event.urlAfterRedirects}`;
        this.setCanonicalUrl(fullUrl);

        if (isPlatformBrowser(this.platformId)) {
          this.trackGaPageView(event.urlAfterRedirects);
        }
      });
  }

  /**
   * Updates standard Open Graph, Twitter, and meta description tags.
   *
   * @param config The SEO configuration object containing title, description, and URLs.
   */
  setMetaTags(config: SeoConfig): void {
    if (config.title) {
      this.title.setTitle(config.title);
    }

    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:url', content: config.url });
    this.meta.updateTag({ property: 'og:image', content: config.image || `${config.url}/favicon.ico` });
    this.meta.updateTag({ property: 'twitter:card', content: 'summary_large_image' });

    this.setCanonicalUrl(config.canonicalUrl || config.url);
  }

  /**
   * Dynamically updates or creates the <link rel="canonical"> tag in document head.
   * Automatically strips query parameters to maintain clean canonical URLs.
   *
   * @param url The absolute canonical target URL.
   */
  setCanonicalUrl(url?: string): void {
    const rawUrl = url || `https://nidhiflow.seyalicraft.com${this.document.location?.pathname || ''}`;
    const cleanUrl = rawUrl.split('?')[0];
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', cleanUrl);
  }

  /**
   * Emits a page_view event to Google Analytics (gtag) on client-side route transitions.
   *
   * @param pagePath Relative path of the target route.
   */
  private trackGaPageView(pagePath: string): void {
    const win = this.document.defaultView as unknown as { gtag?: (...args: unknown[]) => void };
    if (win && typeof win.gtag === 'function') {
      win.gtag('config', this.gaMeasurementId, {
        page_path: pagePath,
      });
    }
  }
}
