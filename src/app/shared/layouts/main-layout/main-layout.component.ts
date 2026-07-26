import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Main application shell layout including top navbar, sidebar navigation, and primary view content.
 */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-layout-container">
      <!-- Top Bar Header -->
      <header class="app-header">
        <div class="header-brand">
          <button
            type="button"
            class="toggle-sidebar-btn"
            aria-label="Toggle navigation drawer"
            (click)="toggleSidebar()"
          >
            ☰
          </button>
          <span class="brand-logo">💰</span>
          <h1 class="brand-title">nidhiFlow</h1>
        </div>

        <div class="header-actions">
          <app-theme-toggle />
          @if (authService.isAuthenticated()) {
            <span class="user-badge">{{ authService.currentUser()?.name || 'User' }}</span>
            <button type="button" class="btn-logout" (click)="onLogout()">Logout</button>
          } @else {
            <a routerLink="/auth/login" class="btn-login">Login</a>
          }
        </div>
      </header>

      <div class="app-body">
        <!-- Sidebar Navigation -->
        <aside class="app-sidebar" [class.sidebar-collapsed]="isSidebarCollapsed()">
          <nav class="sidebar-nav">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="nav-icon">📊</span>
              <span class="nav-label">Dashboard</span>
            </a>
            <a
              routerLink="/ledger"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item"
            >
              <span class="nav-icon">📖</span>
              <span class="nav-label">Ledger</span>
            </a>
            <a
              routerLink="/ledger/entries"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="nav-icon">📜</span>
              <span class="nav-label">Journal Entries</span>
            </a>
            <a
              routerLink="/loans"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="nav-icon">🏠</span>
              <span class="nav-label">EMI Loans</span>
            </a>
            <a
              routerLink="/forecasting"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="nav-icon">📈</span>
              <span class="nav-label">Forecasting</span>
            </a>
            <a
              routerLink="/reports"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="nav-icon">📋</span>
              <span class="nav-label">Reports</span>
            </a>
          </nav>
        </aside>

        <!-- Main Viewport Content -->
        <main class="app-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }

    .app-header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      background-color: var(--mat-sys-surface-container-high);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      z-index: 100;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .toggle-sidebar-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .brand-logo {
      font-size: 1.5rem;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-badge {
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      background-color: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .btn-logout, .btn-login {
      padding: 0.4rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }

    .btn-logout {
      border: 1px solid var(--mat-sys-outline);
      background: transparent;
      color: var(--mat-sys-on-surface);

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .btn-login {
      background-color: var(--mat-sys-primary);
      color: #ffffff;
      border: none;
    }

    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .app-sidebar {
      width: 240px;
      background-color: var(--mat-sys-surface-container-low);
      border-right: 1px solid var(--mat-sys-outline-variant);
      transition: width 0.2s ease-in-out;

      &.sidebar-collapsed {
        width: 64px;

        .nav-label {
          display: none;
        }
      }
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 1rem 0.5rem;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
      font-weight: 500;
      transition: background 0.15s ease-in-out;

      &:hover {
        background-color: rgba(103, 80, 164, 0.08);
      }

      &.active {
        background-color: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
        font-weight: 600;
      }
    }

    .nav-icon {
      font-size: 1.2rem;
    }

    .app-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }
  `]
})
export class MainLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly isSidebarCollapsed = signal<boolean>(false);

  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}
