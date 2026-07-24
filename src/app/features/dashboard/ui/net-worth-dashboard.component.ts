import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface NetWorthState {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  isLoading: boolean;
}

@Component({
  selector: 'app-net-worth-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1 class="mat-headline-medium">Net Worth Overview</h1>
        <button mat-flat-button color="primary">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </header>

      @if (state().isLoading) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      } @else {
        <div class="metrics-grid">
          <!-- Total Assets -->
          <mat-card class="metric-card type-asset">
            <mat-card-header>
              <mat-card-subtitle>Total Assets</mat-card-subtitle>
              <mat-icon mat-card-avatar>account_balance</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h2 class="metric-value">{{ state().totalAssets | currency:'INR' }}</h2>
            </mat-card-content>
          </mat-card>

          <!-- Total Liabilities -->
          <mat-card class="metric-card type-liability">
            <mat-card-header>
              <mat-card-subtitle>Total Liabilities</mat-card-subtitle>
              <mat-icon mat-card-avatar>credit_card</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h2 class="metric-value">{{ state().totalLiabilities | currency:'INR' }}</h2>
            </mat-card-content>
          </mat-card>

          <!-- Net Worth -->
          <mat-card class="metric-card type-networth" [class.negative]="state().netWorth < 0">
            <mat-card-header>
              <mat-card-subtitle>Net Worth</mat-card-subtitle>
              <mat-icon mat-card-avatar>insights</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h2 class="metric-value">{{ state().netWorth | currency:'INR' }}</h2>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Historical Net Worth</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas
                baseChart
                [data]="lineChartData()"
                [options]="lineChartOptions"
                [type]="lineChartType"
              ></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: var(--mat-sys-spacing-medium, 16px);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      background-color: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      transition: transform 0.2s ease-in-out;

      &:hover {
        transform: translateY(-4px);
      }

      .mat-mdc-card-header {
        align-items: center;
        margin-bottom: 0.5rem;
      }

      mat-icon {
        color: var(--mat-sys-primary);
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    }

    /* Status Coloring */
    .type-asset .metric-value { color: var(--mat-sys-tertiary); }
    .type-liability .metric-value { color: var(--mat-sys-error); }
    .type-networth .metric-value { color: var(--mat-sys-primary); }
    .type-networth.negative .metric-value { color: var(--mat-sys-error); }

    .chart-card {
      background-color: var(--mat-sys-surface-container);
      border-radius: 12px;
    }

    .chart-container {
      position: relative;
      height: 350px;
      width: 100%;
      margin-top: 1rem;
    }
  `]
})
export class NetWorthDashboardComponent {
  // Mock initial state for UI layout
  readonly state = signal<NetWorthState>({
    totalAssets: 3500000,
    totalLiabilities: 1200000,
    netWorth: 2300000,
    isLoading: false,
  });

  public lineChartType: ChartType = 'line';

  public lineChartData = computed<ChartConfiguration['data']>(() => {
    return {
      datasets: [
        {
          data: [1500000, 1800000, 2000000, 2100000, 2300000],
          label: 'Net Worth',
          backgroundColor: 'rgba(1, 136, 209, 0.2)',
          borderColor: '#0188d1',
          pointBackgroundColor: '#0188d1',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#0188d1',
          fill: 'origin',
        },
      ],
      labels: ['January', 'February', 'March', 'April', 'May'],
    };
  });

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };
}
