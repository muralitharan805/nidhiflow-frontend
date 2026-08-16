import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

/**
 * Public Terms of Service page component defining acceptable usage, disclaimer of financial advice,
 * and intellectual property terms for nidhiFlow.
 */
@Component({
  selector: 'app-terms-of-service',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="legal-page-container">
      <header class="legal-header">
        <h1 class="legal-title">Terms of Service</h1>
        <p class="legal-subtitle">
          Last Updated: August 16, 2026 &bull; nidhiFlow Personal Finance Platform
        </p>
      </header>

      <div class="legal-content">
        <section class="policy-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using <strong>nidhiFlow</strong> at <code>https://nidhiflow.seyalicraft.com</code>,
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue
            use of the application.
          </p>
        </section>

        <section class="policy-section highlight-box">
          <h2>2. Disclaimer of Financial Advice</h2>
          <p>
            nidhiFlow provides personal finance accounting tools, double-entry ledger calculations, and EMI loan
            amortization schedules for informational and educational purposes only.
          </p>
          <p>
            <strong>nidhiFlow does not provide professional tax, legal, investment, or financial advice.</strong>
            Calculations and projections should be verified with a certified financial advisor or accountant prior
            to executing major financial transactions.
          </p>
        </section>

        <section class="policy-section">
          <h2>3. User Account Responsibility</h2>
          <p>
            You are responsible for maintaining the confidentiality of your session credentials and ensuring that
            your device access remains secure. We reserve the right to modify or discontinue features to maintain
            system integrity and platform security.
          </p>
        </section>

        <section class="policy-section">
          <h2>4. Intellectual Property</h2>
          <p>
            All application source code, interface designs, branding logos, and documentation related to nidhiFlow are
            the exclusive property of <strong>SeyaliCraft</strong>. Unauthorized copying, re-distribution, or commercial
            resale without explicit permission is prohibited.
          </p>
        </section>

        <section class="policy-section">
          <h2>5. Limitation of Liability</h2>
          <p>
            nidhiFlow and its maintainers shall not be liable for any indirect, incidental, or consequential damages
            arising from the use of, or inability to use, our web application or software services.
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
export class TermsOfServiceComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'Terms of Service — nidhiFlow Finance Engine',
      description: 'Terms of service, user agreement, disclaimer of financial advice, and usage guidelines for nidhiFlow.',
      url: 'https://nidhiflow.seyalicraft.com/terms',
    });
  }
}
