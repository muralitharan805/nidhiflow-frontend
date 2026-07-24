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
          <p class="auth-subtitle">Personal Finance & Ledger Engine</p>
        </header>

        <section class="auth-body">
          <router-outlet />
        </section>
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
      margin-bottom: 2rem;
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
    }

    .auth-body {
      width: 100%;
    }
  `]
})
export class AuthLayoutComponent {}
