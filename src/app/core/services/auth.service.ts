import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, map } from 'rxjs';
import { ApiService } from './api.service';

/**
 * User account entity representation matching NestJS backend.
 */
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
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
 * Storage key constant for authentication token.
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
        this.setSession(res.accessToken, res.user);
      })
    );
  }

  /**
   * Execute user registration against NestJS auth endpoint.
   *
   * @param payload User registration fields
   * @returns Observable emitting AuthTokenResult payload
   */
  public register(payload: { name: string; email: string; password: string }): Observable<AuthTokenResult> {
    return this.apiService.post<AuthTokenResult>('/auth/register', payload).pipe(
      tap((res) => {
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
    return this.authTokenSignal();
  }

  /**
   * Sets authentication state upon successful user login.
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
    }
  }

  /**
   * Clears active session and logs out user.
   */
  public logout(): void {
    this.authTokenSignal.set(null);
    this.currentUserSignal.set(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  /**
   * Helper method to initialize token state safely from local storage.
   */
  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Helper method to initialize user state safely from local storage.
   */
  private getInitialUser(): UserEntity | null {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem(AUTH_USER_KEY);
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
