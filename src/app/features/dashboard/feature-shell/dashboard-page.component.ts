import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardStoreService } from '../data-access/dashboard-store.service';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { QuickExpenseFormComponent } from '../ui/quick-expense-form.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

/**
 * Dashboard container component presenting financial summary metrics, asset-to-debt ratios, and transaction feeds.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, QuickExpenseFormComponent, MatTableModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page-container">
      <header class="dashboard-header">
        <div>
          <h2 class="page-title">Executive Financial Summary</h2>
          <p class="page-subtitle">Real-time Double-Entry Ledger Overview & Cash Flow Metrics</p>
        </div>
        <button
          mat-flat-button
          color="primary"
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
            <span class="ratio-tag">A/L Ratio: {{ store.assetToLiabilityRatioText() }}</span>
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

      <!-- Quick Actions Grid -->
      <section class="quick-actions-section">
        <div class="section-header">
          <h3>⚡ Quick Expense</h3>
        </div>
        <app-quick-expense-form
          [accounts]="ledgerStore.accounts()"
          (expenseSubmitted)="onExpenseSubmit($event)"
        />
      </section>

      <!-- Recent Transactions Section -->
      <section class="activity-section">
        <div class="section-header">
          <div class="header-left">
            <h3>Recent Journal Postings</h3>
            <span class="badge-count">{{ store.recentActivity().length }} entries</span>
          </div>
          <a routerLink="/ledger/entries" class="view-all-link">View All Entries →</a>
        </div>

        <div class="table-wrapper mat-elevation-z1">
          <table mat-table [dataSource]="store.recentActivity()" aria-label="Recent Journal Transactions">
            
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef> Date </th>
              <td mat-cell *matCellDef="let item" class="cell-date"> {{ item.date | date:'mediumDate' }} </td>
            </ng-container>

            <!-- Description Column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef> Description </th>
              <td mat-cell *matCellDef="let item" class="cell-desc"> {{ item.description }} </td>
            </ng-container>

            <!-- Category Column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef> Category </th>
              <td mat-cell *matCellDef="let item"> 
                <span class="category-chip">{{ item.category }}</span>
              </td>
            </ng-container>

            <!-- Paid From / Source Account Column -->
            <ng-container matColumnDef="sourceAccount">
              <th mat-header-cell *matHeaderCellDef> Paid From </th>
              <td mat-cell *matCellDef="let item"> 
                <span class="source-chip">{{ item.sourceAccount || 'Cash / Bank' }}</span>
              </td>
            </ng-container>

            <!-- Amount Column -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef class="text-right"> Amount </th>
              <td mat-cell *matCellDef="let item" class="cell-amount text-right"
                  [class.credit]="item.type === 'CREDIT'"
                  [class.debit]="item.type === 'DEBIT'">
                {{ item.type === 'CREDIT' ? '+' : '-' }} {{ item.amount | currency:'INR':'symbol':'1.0-0' }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            
            <!-- Empty State handled by CSS/condition or just empty table -->
          </table>
          @if (store.recentActivity().length === 0) {
            <div class="empty-cell">No recent postings recorded in ledger.</div>
          }
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
      color: var(--mat-sys-on-surface-variant);
      margin-top: 0.25rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      padding: 1.25rem;
      border-radius: 12px;
      background-color: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .metric-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);

      &.text-negative {
        color: var(--mat-sys-error);
      }
      &.text-positive {
        color: var(--mat-sys-success);
      }
    }

    .metric-footer {
      font-size: 0.75rem;
      color: var(--mat-sys-outline);

      .ratio-tag {
        font-weight: 600;
        color: var(--mat-sys-primary);
      }
    }

    .activity-section, .quick-actions-section {
      background-color: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
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

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .view-all-link {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--mat-sys-primary);
      text-decoration: none;
      transition: color 0.15s ease-in-out;

      &:hover {
        text-decoration: underline;
      }
    }

    .badge-count {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
    }

    table {
      width: 100%;
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
      background-color: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-weight: 500;
    }

    .source-chip {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font-weight: 500;
    }

    .cell-amount {
      font-weight: 600;

      &.credit {
        color: var(--mat-sys-success);
      }
      &.debit {
        color: var(--mat-sys-on-surface);
      }
    }

    .empty-cell {
      text-align: center;
      padding: 2rem;
      color: var(--mat-sys-outline);
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  protected readonly store = inject(DashboardStoreService);
  protected readonly ledgerStore = inject(LedgerStoreService);
  private readonly notificationService = inject(NotificationService);
  
  protected readonly displayedColumns: string[] = ['date', 'description', 'category', 'sourceAccount', 'amount'];

  public ngOnInit(): void {
    this.store.fetchLiveNetWorth();
    this.ledgerStore.loadAll();
  }

  protected onExpenseSubmit(input: { amount: number; description: string; expenseAccountId: string; assetAccountId: string }): void {
    this.store.recordExpense(input);
  }

  protected onRefreshData(): void {
    this.store.fetchLiveNetWorth();
    this.ledgerStore.loadAll(false);
    this.notificationService.showSuccess('Ledger Synchronized', 'Financial metrics and balances updated.');
  }
}
