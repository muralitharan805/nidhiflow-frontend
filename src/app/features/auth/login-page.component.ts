import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Login page component with reactive form submitting credentials to NestJS auth endpoint.
 */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="email" class="form-label">Email Address</label>
        <input
          id="email"
          type="email"
          class="form-input"
          formControlName="email"
          placeholder="you@example.com"
          autocomplete="email"
          [class.input-error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
        />
        @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
          <span class="field-error" role="alert">Email is required.</span>
        }
        @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
          <span class="field-error" role="alert">Please enter a valid email address.</span>
        }
      </div>

      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <input
          id="password"
          type="password"
          class="form-input"
          formControlName="password"
          placeholder="••••••••"
          autocomplete="current-password"
          [class.input-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
        />
        @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
          <span class="field-error" role="alert">Password is required.</span>
        }
        @if (loginForm.get('password')?.hasError('minlength') && loginForm.get('password')?.touched) {
          <span class="field-error" role="alert">Password must be at least 6 characters.</span>
        }
      </div>

      @if (authError()) {
        <div class="auth-error-banner" role="alert">
          {{ authError() }}
        </div>
      }

      <button
        type="submit"
        class="btn-submit"
        [disabled]="isLoading()"
        [attr.aria-busy]="isLoading()"
      >
        @if (isLoading()) {
          <span>Authenticating...</span>
        } @else {
          <span>Login to nidhiFlow</span>
        }
      </button>

      <p class="register-prompt">
        Don't have an account?
        <button type="button" class="btn-link" (click)="toggleMode()">
          {{ isRegisterMode() ? 'Back to Login' : 'Create Account' }}
        </button>
      </p>
    </form>

    @if (isRegisterMode()) {
      <form class="login-form" [formGroup]="registerForm" (ngSubmit)="onRegister()">
        <div class="form-group">
          <label for="reg-name" class="form-label">Full Name</label>
          <input id="reg-name" type="text" class="form-input" formControlName="name" placeholder="Your Name" autocomplete="name" />
        </div>
        <div class="form-group">
          <label for="reg-email" class="form-label">Email Address</label>
          <input id="reg-email" type="email" class="form-input" formControlName="email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="reg-password" class="form-label">Password</label>
          <input id="reg-password" type="password" class="form-input" formControlName="password" placeholder="Min. 6 characters" autocomplete="new-password" />
        </div>
        <button type="submit" class="btn-submit" [disabled]="isLoading()">
          {{ isLoading() ? 'Registering...' : 'Create Account' }}
        </button>
      </form>
    }
  `,
  styles: [`
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.85);
    }

    .form-input {
      padding: 0.65rem 0.875rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s ease;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.12);
      }

      &.input-error {
        border-color: #f87171;
      }
    }

    .field-error {
      font-size: 0.75rem;
      color: #f87171;
    }

    .auth-error-banner {
      padding: 0.65rem 0.875rem;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      font-size: 0.875rem;
    }

    .btn-submit {
      padding: 0.75rem;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s ease;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .register-prompt {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      margin: 0;
    }

    .btn-link {
      background: transparent;
      border: none;
      color: #93c5fd;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly authError = signal<string | null>(null);
  protected readonly isRegisterMode = signal<boolean>(false);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected toggleMode(): void {
    this.isRegisterMode.update((v) => !v);
    this.authError.set(null);
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authError.set(null);

    const { email, password } = this.loginForm.getRawValue();
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.showSuccess('Welcome back!', 'Login successful.');
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.authError.set('Invalid email or password. Please try again.');
      },
    });
  }

  protected onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authError.set(null);

    const { name, email, password } = this.registerForm.getRawValue();
    this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.showSuccess('Account created!', 'Welcome to nidhiFlow.');
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.authError.set('Registration failed. Email may already be taken.');
      },
    });
  }
}
