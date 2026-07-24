import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * Storage key constant for persisting application theme preference.
 */
const THEME_STORAGE_KEY = 'app-theme-preference';

/**
 * Service controlling application-wide Dark/Light theme state using Angular Signals.
 * Supports initial OS preference detection and live system theme change updates.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;

  /**
   * Tracks whether the user has manually chosen a theme preference.
   */
  public readonly isUserOverridden = signal<boolean>(this.hasStoredPreference());

  /**
   * Signal tracking dark mode active state. Defaults to Dark Theme with OS detection fallback.
   */
  public readonly isDarkMode = signal<boolean>(this.getInitialThemePreference());

  constructor() {
    // Synchronize HTML element classes and local storage on signal change
    effect(() => {
      const isDark = this.isDarkMode();
      const root = this.document.documentElement;

      if (isDark) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
      } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
      }

      if (isPlatformBrowser(this.platformId) && this.isUserOverridden()) {
        localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
      }
    });

    // Setup live OS system theme listener if running in browser
    if (isPlatformBrowser(this.platformId)) {
      this.initSystemThemeListener();
    }
  }

  /**
   * Toggles active theme between Dark Mode and Light Mode, marking preference as user-overridden.
   */
  public toggleTheme(): void {
    this.isUserOverridden.set(true);
    this.isDarkMode.update((prev) => !prev);
  }

  /**
   * Resets theme to system preference and clears stored user override in localStorage.
   */
  public resetToSystemPreference(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(THEME_STORAGE_KEY);
      this.isUserOverridden.set(false);
      this.isDarkMode.set(this.getSystemThemePreference());
    }
  }

  /**
   * Checks if user has a persisted theme preference in localStorage.
   */
  private hasStoredPreference(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(THEME_STORAGE_KEY) !== null;
    }
    return false;
  }

  /**
   * Reads initial theme preference: stored preference -> OS system detection -> default dark.
   */
  private getInitialThemePreference(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        return saved === 'dark';
      }
      return this.getSystemThemePreference();
    }
    return true; // Default to dark theme on server
  }

  /**
   * Evaluates current OS prefers-color-scheme setting.
   */
  private getSystemThemePreference(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return false;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    }
    return true; // Default to dark theme
  }

  /**
   * Initializes media query listener for real-time OS theme preference changes.
   */
  private initSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (event: MediaQueryListEvent) => {
        if (!this.isUserOverridden()) {
          this.isDarkMode.set(event.matches);
        }
      };

      if (this.mediaQueryList.addEventListener) {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else {
        // Fallback for older browser engines
        this.mediaQueryList.addListener(this.mediaQueryListener);
      }
    }
  }
}

