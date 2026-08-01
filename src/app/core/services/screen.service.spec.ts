import { TestBed } from '@angular/core/testing';
import { ScreenService } from './screen.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ScreenService', () => {
  let service: ScreenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize reactive signals with default states', () => {
    expect(typeof service.isMobile()).toBe('boolean');
    expect(typeof service.isTablet()).toBe('boolean');
    expect(typeof service.isDesktop()).toBe('boolean');
  });

  it('should compute grid column counts according to active breakpoint', () => {
    // Default desktop: 4 columns
    if (service.isDesktop()) {
      expect(service.gridCols()).toBe(4);
    } else if (service.isMobile()) {
      expect(service.gridCols()).toBe(1);
    } else if (service.isTablet()) {
      expect(service.gridCols()).toBe(2);
    }
  });
});
