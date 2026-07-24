import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render toggle button with proper aria label', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-label')).toBe('Toggle Dark/Light Theme');
  });

  it('should call toggleTheme when button is clicked', () => {
    const initialMode = themeService.isDarkMode();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    button?.click();
    fixture.detectChanges();
    expect(themeService.isDarkMode()).toBe(!initialMode);
  });
});
