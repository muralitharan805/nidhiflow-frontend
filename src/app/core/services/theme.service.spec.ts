import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with isDarkMode signal', () => {
    expect(typeof service.isDarkMode()).toBe('boolean');
  });

  it('should toggle theme and set user overridden flag', () => {
    const initialMode = service.isDarkMode();
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(!initialMode);
    expect(service.isUserOverridden()).toBe(true);
  });

  it('should reset to system preference and clear user override', () => {
    service.toggleTheme();
    expect(service.isUserOverridden()).toBe(true);

    service.resetToSystemPreference();
    expect(service.isUserOverridden()).toBe(false);
  });
});
