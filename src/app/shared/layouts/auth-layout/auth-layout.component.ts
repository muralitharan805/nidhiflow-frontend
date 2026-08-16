import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Centered layout shell for authentication and login/signup screens.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-layout-container">
      <div class="auth-card-shell">
        <header class="auth-header">
          <span class="auth-logo">💰</span>
          <h1 class="auth-title">nidhiFlow</h1>
          <p class="auth-subtitle">Personal Finance, Double-Entry Accounting & Wealth Engine</p>
        </header>

        <section class="auth-body">
          <router-outlet />
        </section>

        <footer class="auth-seo-footer">
          <h2 class="seo-feature-title">Enterprise Finance Capabilities</h2>
          <div class="seo-feature-badges">
            <span class="badge">Double-Entry Accounting</span>
            <span class="badge">EMI Amortization</span>
            <span class="badge">Real-time Ledgers</span>
            <span class="badge">Audit Trail</span>
          </div>
        </footer>
      </div>
    </main>
  `,
  styles: [`
    .auth-layout-container {
      min-height: 100vh;
      width: 100vw;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1.5rem;
    }

    .auth-card-shell {
      width: 100%;
      max-width: 440px;
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      color: #ffffff;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth-logo {
      font-size: 3rem;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .auth-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
    }

    .auth-subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
      margin-top: 0.25rem;
      line-height: 1.4;
    }

    .auth-body {
      width: 100%;
    }

    .auth-seo-footer {
      margin-top: 2rem;
      padding-top: 1.25rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.15);
      text-align: center;
    }

    .seo-feature-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }

    .seo-feature-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .badge {
      font-size: 0.725rem;
      padding: 0.25rem 0.6rem;
      border-radius: 12px;
      background: rgba(148, 163, 184, 0.12);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 500;
    }
  `]
})
export class AuthLayoutComponent {}
