import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface LoanAmortizationSummary {
  loanName: string;
  principalAmount: number;
  interestRate: number;
  emiAmount: number;
  totalInstallments: number;
  installmentsPaid: number;
  remainingInstallments: number;
  principalPaid: number;
  remainingPrincipal: number;
  interestPaid: number;
  projectedInterestSaved: number;
  payoffDate: Date;
}

@Component({
  selector: 'app-emi-payoff-countdown',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="emi-countdown-card">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">account_balance_wallet</mat-icon>
        <mat-card-title>{{ summary().loanName }} Payoff Countdown</mat-card-title>
        <mat-card-subtitle>EMI: {{ summary().emiAmount | currency:'INR' }} / month @ {{ summary().interestRate }}%</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="progress-section">
          <div class="progress-labels">
            <span class="progress-text">
              <strong>{{ summary().installmentsPaid }}</strong> of <strong>{{ summary().totalInstallments }}</strong> months paid
            </span>
            <span class="percentage-text">{{ progressPercentage() | number:'1.0-1' }}% Completed</span>
          </div>
          
          <mat-progress-bar
            class="payoff-progress"
            mode="determinate"
            [value]="progressPercentage()">
          </mat-progress-bar>
        </div>

        <mat-divider></mat-divider>

        <div class="metrics-grid">
          <div class="metric-item">
            <mat-icon class="icon-tertiary">check_circle</mat-icon>
            <div class="metric-data">
              <span class="metric-label">Principal Paid</span>
              <span class="metric-value">{{ summary().principalPaid | currency:'INR' }}</span>
            </div>
          </div>
          <div class="metric-item">
            <mat-icon class="icon-error">pending_actions</mat-icon>
            <div class="metric-data">
              <span class="metric-label">Remaining Balance</span>
              <span class="metric-value">{{ summary().remainingPrincipal | currency:'INR' }}</span>
            </div>
          </div>
          <div class="metric-item">
            <mat-icon class="icon-primary">event_available</mat-icon>
            <div class="metric-data">
              <span class="metric-label">Debt-Free Date</span>
              <span class="metric-value highlight">{{ summary().payoffDate | date:'mediumDate' }}</span>
            </div>
          </div>
          <div class="metric-item">
            <mat-icon class="icon-accent">savings</mat-icon>
            <div class="metric-data">
              <span class="metric-label">Interest Saved</span>
              <span class="metric-value savings-text">{{ summary().projectedInterestSaved | currency:'INR' }}</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .emi-countdown-card {
      margin-bottom: 1.5rem;
      border-radius: 12px;
      background-color: var(--mat-sys-surface-container-low);
    }

    .progress-section {
      padding: 1.5rem 0;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .progress-text {
      color: var(--mat-sys-on-surface);
    }

    .percentage-text {
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .payoff-progress {
      height: 8px;
      border-radius: 4px;
      
      ::ng-deep .mdc-linear-progress__bar-inner {
        border-radius: 4px;
      }
    }

    mat-divider {
      margin: 0.5rem 0 1.5rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .icon-primary { color: var(--mat-sys-primary); }
    .icon-tertiary { color: var(--mat-sys-tertiary); }
    .icon-error { color: var(--mat-sys-error); }
    .icon-accent { color: var(--mat-sys-secondary); }

    .metric-data {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      
      &.highlight {
        color: var(--mat-sys-primary);
      }

      &.savings-text {
        color: var(--mat-sys-tertiary);
      }
    }
  `]
})
export class EmiPayoffCountdownComponent {
  readonly summary = input.required<LoanAmortizationSummary>();

  readonly progressPercentage = computed(() => {
    const s = this.summary();
    if (s.totalInstallments === 0) return 0;
    return (s.installmentsPaid / s.totalInstallments) * 100;
  });
}
