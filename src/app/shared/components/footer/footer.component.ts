import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Reusable Footer component providing brand summary, navigation links,
 * legal compliance endpoints, and dynamic copyright year.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="app-footer">
      <div class="footer-container">
        <!-- Brand & Tagline -->
        <div class="footer-brand">
          <div class="brand-logo-group">
            <span class="footer-logo" role="img" aria-label="nidhiFlow logo">💰</span>
            <span class="footer-brand-title">nidhiFlow</span>
          </div>
          <p class="footer-description">
            Personal Finance, Double-Entry Accounting & Wealth Engine.
          </p>
        </div>

        <!-- Quick Navigation Links -->
        <div class="footer-section">
          <h3 class="footer-heading">Quick Links</h3>
          <ul class="footer-links">
            <li><a routerLink="/dashboard">Dashboard</a></li>
            <li><a routerLink="/ledger">Ledger Accounts</a></li>
            <li><a routerLink="/loans">EMI Loans</a></li>
            <li><a routerLink="/reports">Reports</a></li>
          </ul>
        </div>

        <!-- Legal & Compliance Links -->
        <div class="footer-section">
          <h3 class="footer-heading">Legal & Privacy</h3>
          <ul class="footer-links">
            <li><a routerLink="/privacy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <!-- Copyright & Bottom Bar -->
      <div class="footer-bottom">
        <p>&copy; {{ currentYear() }} nidhiFlow. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: var(--mat-sys-surface-container-low, #1e293b);
      color: var(--mat-sys-on-surface-variant, #94a3b8);
      border-top: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.1));
      padding: 2rem 1.5rem 1.5rem;
      margin-top: 2rem;
      font-size: 0.875rem;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 2rem;
    }

    .brand-logo-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .footer-logo {
      font-size: 1.5rem;
    }

    .footer-brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface, #ffffff);
    }

    .footer-description {
      margin: 0;
      line-height: 1.5;
      color: var(--mat-sys-on-surface-variant, #94a3b8);
    }

    .footer-heading {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-on-surface, #ffffff);
      margin-bottom: 0.75rem;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      a {
        color: var(--mat-sys-on-surface-variant, #94a3b8);
        text-decoration: none;
        transition: color 0.15s ease-in-out;
        min-height: 44px;
        display: inline-flex;
        align-items: center;

        &:hover {
          color: var(--mat-sys-primary, #3b82f6);
        }
      }
    }

    .footer-bottom {
      max-width: 1200px;
      margin: 1.5rem auto 0;
      padding-top: 1rem;
      border-top: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.05));
      text-align: center;

      p {
        margin: 0;
        font-size: 0.75rem;
      }
    }

    @media (max-width: 767.98px) {
      .footer-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .app-footer {
        padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
      }
    }
  `]
})
export class FooterComponent {
  /** Dynamic current year signal for copyright display */
  readonly currentYear = signal<number>(new Date().getFullYear());
}
