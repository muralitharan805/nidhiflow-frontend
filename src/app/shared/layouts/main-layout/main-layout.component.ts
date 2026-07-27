import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';
import { ScreenService } from '../../../core/services/screen.service';

/**
 * Main application shell layout including top navbar, responsive sidebar navigation, and mobile bottom bar.
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
            <span class="user-badge" [class.hidden-mobile]="screenService.isMobile()">
              {{ authService.currentUser()?.name || 'User' }}
            </span>
            <button type="button" class="btn-logout" (click)="onLogout()">Logout</button>
          } @else {
            <a routerLink="/auth/login" class="btn-login">Login</a>
          }
        </div>
      </header>

      <div class="app-body">
        <!-- Sidebar Navigation (Hidden/Collapsed on Mobile) -->
        <aside
          class="app-sidebar"
          [class.sidebar-collapsed]="isSidebarCollapsed() || screenService.isMobile()"
          [class.hidden-mobile]="screenService.isMobile() && isSidebarCollapsed()"
        >
          <nav class="sidebar-nav">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-item"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon">📊</span>
              <span class="nav-label">Dashboard</span>
            </a>
            <a
              routerLink="/ledger"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon">📖</span>
              <span class="nav-label">Ledger</span>
            </a>
            <a
              routerLink="/ledger/entries"
              routerLinkActive="active"
              class="nav-item"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon">📜</span>
              <span class="nav-label">Journal Entries</span>
            </a>
            <a
              routerLink="/loans"
              routerLinkActive="active"
              class="nav-item"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon">🏠</span>
              <span class="nav-label">EMI Loans</span>
            </a>
            <a
              routerLink="/forecasting"
              routerLinkActive="active"
              class="nav-item"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon">📈</span>
              <span class="nav-label">Forecasting</span>
            </a>
            <a
              routerLink="/reports"
              routerLinkActive="active"
              class="nav-item"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon">📋</span>
              <span class="nav-label">Reports</span>
            </a>
          </nav>
        </aside>

        <!-- Main Viewport Content -->
        <main class="app-content" [class.has-bottom-nav]="screenService.isMobile()">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile Bottom Navigation Bar (Handset Devices Only) -->
      @if (screenService.isMobile()) {
        <nav class="mobile-bottom-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="bottom-nav-item">
            <span class="bottom-nav-icon">📊</span>
            <span class="bottom-nav-label">Dashboard</span>
          </a>
          <a routerLink="/ledger" routerLinkActive="active" class="bottom-nav-item">
            <span class="bottom-nav-icon">📖</span>
            <span class="bottom-nav-label">Ledger</span>
          </a>
          <a routerLink="/loans" routerLinkActive="active" class="bottom-nav-item">
            <span class="bottom-nav-icon">🏠</span>
            <span class="bottom-nav-label">Loans</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="bottom-nav-item">
            <span class="bottom-nav-icon">📋</span>
            <span class="bottom-nav-label">Reports</span>
          </a>
        </nav>
      }
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
      padding: 0 1.25rem;
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
      gap: 0.75rem;
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
      padding: 0.4rem 0.85rem;
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
      position: relative;
    }

    .app-sidebar {
      width: 240px;
      background-color: var(--mat-sys-surface-container-low);
      border-right: 1px solid var(--mat-sys-outline-variant);
      transition: width 0.2s ease-in-out, transform 0.2s ease-in-out;
      z-index: 90;

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
      min-height: 44px;

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
      padding: 1.25rem;
      overflow-y: auto;

      &.has-bottom-nav {
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
      }
    }

    .mobile-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background-color: var(--mat-sys-surface-container-high);
      border-top: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      z-index: 1000;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.75rem;
      gap: 2px;
      min-width: 56px;
      min-height: 44px;

      &.active {
        color: var(--mat-sys-primary);
        font-weight: 700;

        .bottom-nav-icon {
          transform: scale(1.15);
        }
      }
    }

    .bottom-nav-icon {
      font-size: 1.25rem;
      transition: transform 0.15s ease-in-out;
    }

    @media (max-width: 599.98px) {
      .hidden-mobile {
        display: none !important;
      }
      .app-content {
        padding: 0.85rem;
      }
    }
  `]
})
export class MainLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly screenService = inject(ScreenService);
  protected readonly isSidebarCollapsed = signal<boolean>(true);

  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }

  protected onNavItemClick(): void {
    if (this.screenService.isMobile()) {
      this.isSidebarCollapsed.set(true);
    }
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}

