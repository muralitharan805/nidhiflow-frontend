import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { DashboardStoreService } from '../data-access/dashboard-store.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Dashboard container component presenting financial summary metrics, asset-to-debt ratios, and transaction feeds.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page-container">
      <header class="dashboard-header">
        <div>
          <h2 class="page-title">Executive Financial Summary</h2>
          <p class="page-subtitle">Real-time Double-Entry Ledger Overview & Cash Flow Metrics</p>
        </div>
        <button
          type="button"
          class="btn-refresh"
          (click)="onRefreshData()"
        >
          🔄 Sync Ledger
        </button>
      </header>

      <!-- Key Metrics Summary Grid -->
      <section class="metrics-grid">
        <div class="metric-card card-primary">
          <div class="metric-label">Net Worth</div>
          <div class="metric-value">{{ store.metrics().netWorth | currency:'INR':'symbol':'1.0-0' }}</div>
          <div class="metric-footer">
            <span class="ratio-tag">A/L Ratio: {{ store.assetToLiabilityRatio() }}x</span>
          </div>
        </div>

        <div class="metric-card card-success">
          <div class="metric-label">Total Assets</div>
          <div class="metric-value">{{ store.metrics().totalAssets | currency:'INR':'symbol':'1.0-0' }}</div>
          <div class="metric-footer">Liquid & Fixed Heads</div>
        </div>

        <div class="metric-card card-warning">
          <div class="metric-label">Total Liabilities</div>
          <div class="metric-value">{{ store.metrics().totalLiabilities | currency:'INR':'symbol':'1.0-0' }}</div>
          <div class="metric-footer">Outstanding EMI Loans</div>
        </div>

        <div class="metric-card card-info">
          <div class="metric-label">Monthly Cash Flow</div>
          <div
            class="metric-value"
            [class.text-negative]="store.metrics().netCashFlow < 0"
            [class.text-positive]="store.metrics().netCashFlow >= 0"
          >
            {{ store.metrics().netCashFlow | currency:'INR':'symbol':'1.0-0' }}
          </div>
          <div class="metric-footer">Income vs Expense</div>
        </div>
      </section>

      <!-- Recent Transactions Section -->
      <section class="activity-section">
        <div class="section-header">
          <h3>Recent Journal Postings</h3>
          <span class="badge-count">{{ store.recentActivity().length }} entries</span>
        </div>

        <div class="table-wrapper">
          <table class="activity-table" aria-label="Recent Journal Transactions">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              @for (item of store.recentActivity(); track item.id) {
                <tr>
                  <td class="cell-date">{{ item.date | date:'mediumDate' }}</td>
                  <td class="cell-desc">{{ item.description }}</td>
                  <td>
                    <span class="category-chip">{{ item.category }}</span>
                  </td>
                  <td
                    class="cell-amount text-right"
                    [class.credit]="item.type === 'CREDIT'"
                    [class.debit]="item.type === 'DEBIT'"
                  >
                    {{ item.type === 'CREDIT' ? '+' : '-' }} {{ item.amount | currency:'INR':'symbol':'1.0-0' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="empty-cell">No recent postings recorded in ledger.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant, #49454f);
      margin-top: 0.25rem;
    }

    .btn-refresh {
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      background-color: var(--mat-sys-primary, #1e3c72);
      color: #ffffff;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        opacity: 0.9;
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      padding: 1.25rem;
      border-radius: 12px;
      background-color: var(--mat-sys-surface-container-lowest, #ffffff);
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .metric-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface, #191c20);

      &.text-negative {
        color: var(--mat-sys-error, #ba1a1a);
      }
      &.text-positive {
        color: var(--mat-sys-success, #2e7d32);
      }
    }

    .metric-footer {
      font-size: 0.75rem;
      color: var(--mat-sys-outline, #74777f);

      .ratio-tag {
        font-weight: 600;
        color: var(--mat-sys-primary, #1e3c72);
      }
    }

    .activity-section {
      background-color: var(--mat-sys-surface-container-lowest, #ffffff);
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .badge-count {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      background-color: var(--mat-sys-secondary-container, #dbf0ff);
      color: var(--mat-sys-on-secondary-container, #141b2c);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .activity-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;

      th {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 2px solid var(--mat-sys-outline-variant, #e0e0e0);
        color: var(--mat-sys-on-surface-variant, #49454f);
        font-weight: 600;
      }

      td {
        padding: 0.85rem 0.75rem;
        border-bottom: 1px solid var(--mat-sys-surface-container, #eeeeee);
      }

      .text-right {
        text-align: right;
      }

      .cell-desc {
        font-weight: 500;
      }

      .category-chip {
        display: inline-block;
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        background-color: var(--mat-sys-surface-container, #eeeeee);
        color: var(--mat-sys-on-surface-variant, #49454f);
      }

      .cell-amount {
        font-weight: 600;

        &.credit {
          color: var(--mat-sys-success, #2e7d32);
        }
        &.debit {
          color: var(--mat-sys-on-surface, #191c20);
        }
      }

      .empty-cell {
        text-align: center;
        padding: 2rem;
        color: var(--mat-sys-outline, #74777f);
      }
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  protected readonly store = inject(DashboardStoreService);
  private readonly notificationService = inject(NotificationService);

  public ngOnInit(): void {
    this.store.fetchLiveNetWorth();
  }

  protected onRefreshData(): void {
    this.store.fetchLiveNetWorth();
    this.notificationService.showSuccess('Ledger Synchronized', 'Financial metrics and balances updated.');
  }
}
