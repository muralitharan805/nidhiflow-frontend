import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

/**
 * Public Privacy Policy page component ensuring full Google AdSense, GDPR,
 * and search crawler policy compliance for nidhiFlow.
 */
@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="legal-page-container">
      <header class="legal-header">
        <h1 class="legal-title">Privacy Policy</h1>
        <p class="legal-subtitle">
          Last Updated: August 16, 2026 &bull; nidhiFlow Personal Finance Platform
        </p>
      </header>

      <div class="legal-content">
        <section class="policy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to <strong>nidhiFlow</strong> ("we", "our", or "us"), hosted at
            <code>https://nidhiflow.seyalicraft.com</code>. We respect your privacy and are committed to
            protecting your personal and financial data. This Privacy Policy explains how we collect, use,
            and safeguard information when you use our web application.
          </p>
        </section>

        <section class="policy-section">
          <h2>2. Data Collection & Local Processing</h2>
          <p>
            nidhiFlow operates primarily as a privacy-focused financial management tool. Your double-entry
            accounting ledgers, EMI loan schedules, and financial forecasting calculations are processed securely
            and retained within your authorized user session. We do not sell, rent, or trade your financial records.
          </p>
        </section>

        <section class="policy-section highlight-box">
          <h2>3. Third-Party Advertising & Google AdSense DART Cookies</h2>
          <p>
            We use third-party advertising services, specifically <strong>Google AdSense</strong>, to serve
            advertisements when you visit our website.
          </p>
          <ul>
            <li>
              Google, as a third-party vendor, uses cookies to serve ads on <code>nidhiflow.seyalicraft.com</code>.
            </li>
            <li>
              Google's use of advertising cookies enables it and its partners to serve ads to users based on their
              visit to our sites and/or other sites on the Internet.
            </li>
            <li>
              Users may opt out of personalized advertising by visiting
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>.
            </li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>4. Analytics & Log Data</h2>
          <p>
            We use <strong>Google Analytics 4 (GA4)</strong> to understand anonymous aggregate traffic patterns
            and improve site navigation. GA4 collects non-personally identifiable information such as browser type,
            device viewport width, and page routes visited. Analytics payloads are automatically sanitized and
            do not contain financial transactions, account numbers, or credentials.
          </p>
        </section>

        <section class="policy-section">
          <h2>5. Cookies & Web Storage</h2>
          <p>
            nidhiFlow utilizes browser <code>localStorage</code> solely for preserving user UI preferences,
            such as dark/light theme selection. You may clear your browser storage at any time through your
            browser settings.
          </p>
        </section>

        <section class="policy-section">
          <h2>6. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy or data privacy practices, please contact us at
            <a href="https://seyalicraft.com" target="_blank" rel="noopener noreferrer">SeyaliCraft Support</a>.
          </p>
        </section>

        <div class="legal-actions">
          <a routerLink="/" class="btn-back">&larr; Back to Home</a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .legal-page-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      color: var(--mat-sys-on-surface, #e2e8f0);
    }

    .legal-header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.1));
      padding-bottom: 1.5rem;
    }

    .legal-title {
      font-size: 2.25rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .legal-subtitle {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant, #94a3b8);
      margin: 0;
    }

    .legal-content {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      line-height: 1.7;
      font-size: 0.95rem;
    }

    .policy-section {
      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 0.75rem 0;
        color: var(--mat-sys-on-surface, #f8fafc);
      }

      p {
        margin: 0 0 0.75rem 0;
        color: var(--mat-sys-on-surface-variant, #cbd5e1);
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;
        color: var(--mat-sys-on-surface-variant, #cbd5e1);

        li {
          margin-bottom: 0.5rem;
        }
      }

      a {
        color: var(--mat-sys-primary, #60a5fa);
        text-decoration: underline;

        &:hover {
          color: #93c5fd;
        }
      }
    }

    .highlight-box {
      background: rgba(59, 130, 246, 0.08);
      border-left: 4px solid var(--mat-sys-primary, #3b82f6);
      padding: 1.25rem 1.5rem;
      border-radius: 0 8px 8px 0;
    }

    .legal-actions {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px dashed var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.1));
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      background-color: var(--mat-sys-secondary-container, #334155);
      color: var(--mat-sys-on-secondary-container, #f8fafc);
      text-decoration: none;
      font-weight: 600;
      min-height: 44px;
      transition: background 0.15s ease-in-out;

      &:hover {
        background-color: #475569;
      }
    }
  `]
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'Privacy Policy — nidhiFlow Finance Engine',
      description: 'Privacy policy, Google AdSense third-party cookie disclosure, GA4 analytics transparency, and data protection terms for nidhiFlow.',
      url: 'https://nidhiflow.seyalicraft.com/privacy',
    });
  }
}
