import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LedgerStoreService } from '../../features/ledger/data-access/ledger-store.service';
import { DashboardStoreService } from '../../features/dashboard/data-access/dashboard-store.service';

/**
 * Enumeration of user roles within NidhiFlow.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER',
}

/**
 * User account entity representation matching NestJS backend.
 */
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole | 'ADMIN' | 'USER' | 'MANAGER';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auth token exchange response payload from NestJS backend.
 */
export interface AuthTokenResult {
  accessToken: string;
  user: UserEntity;
}

/**
 * Storage key constants for authentication token and user profile.
 */
const AUTH_TOKEN_KEY = 'nidhiflow_auth_token';
const AUTH_USER_KEY = 'nidhiflow_auth_user';

/**
 * Service managing user authentication, reactive signal user state, and token lifecycle.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly ledgerStore = inject(LedgerStoreService);
  private readonly dashboardStore = inject(DashboardStoreService);

  /**
   * Internal reactive signal holding the authenticated user state.
   */
  private readonly currentUserSignal = signal<UserEntity | null>(this.getInitialUser());

  /**
   * Internal reactive signal holding authentication token status.
   */
  private readonly authTokenSignal = signal<string | null>(this.getInitialToken());

  /**
   * Public read-only signal for current authenticated user profile.
   */
  public readonly currentUser = this.currentUserSignal.asReadonly();

  /**
   * Public computed signal deriving authentication status.
   */
  public readonly isAuthenticated = computed(() => this.authTokenSignal() !== null);

  /**
   * Public computed signal deriving user role.
   */
  public readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);

  /**
   * Execute login against NestJS auth endpoint.
   *
   * @param credentials Login credentials object
   * @returns Observable emitting AuthTokenResult payload
   */
  public login(credentials: { email: string; password: string }): Observable<AuthTokenResult> {
    return this.apiService.post<AuthTokenResult>('/auth/login', credentials).pipe(
      tap((res) => {
        this.clearStores();
        this.setSession(res.accessToken, res.user);
      })
    );
  }

  /**
   * Execute user registration against NestJS auth endpoint.
   * Resets existing store state before saving new credentials.
   *
   * @param payload User registration fields
   * @returns Observable emitting AuthTokenResult payload
   */
  public register(payload: { name: string; email: string; password: string }): Observable<AuthTokenResult> {
    return this.apiService.post<AuthTokenResult>('/auth/register', payload).pipe(
      tap((res) => {
        this.clearStores();
        this.setSession(res.accessToken, res.user);
      })
    );
  }

  /**
   * Retrieves authorization token safely guarding against SSR environments.
   *
   * @returns Auth token string or null
   */
  public getToken(): string | null {
    const signalToken = this.authTokenSignal();
    if (signalToken) return signalToken;

    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Sets authentication state upon successful user login or registration.
   *
   * @param token Authentication Bearer token string
   * @param user User profile payload
   */
  public setSession(token: string, user: UserEntity): void {
    this.authTokenSignal.set(token);
    this.currentUserSignal.set(user);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem('token', token);
    }
  }

  /**
   * Clears active session, purges localStorage, resets all domain stores, and navigates to login page.
   */
  public logout(): void {
    this.authTokenSignal.set(null);
    this.currentUserSignal.set(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.clear();
    }

    this.clearStores();
    void this.router.navigate(['/auth/login']);
  }

  /**
   * Resets all domain feature stores (Ledger, Dashboard) to prevent cross-user data leakage.
   */
  private clearStores(): void {
    this.ledgerStore.resetStore();
    this.dashboardStore.resetStore();
  }

  /**
   * Helper method to initialize token state safely from local storage.
   */
  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Helper method to initialize user state safely from local storage.
   */
  private getInitialUser(): UserEntity | null {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem('user');
      if (raw) {
        try {
          return JSON.parse(raw) as UserEntity;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
