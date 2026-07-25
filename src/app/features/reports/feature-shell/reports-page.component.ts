import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { ReportsStoreService } from '../data-access/reports-store.service';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import { TrialBalanceComponent } from '../ui/trial-balance.component';
import { BalanceSheetComponent } from '../ui/balance-sheet.component';
import { IncomeStatementComponent } from '../ui/income-statement.component';
import { BankReconciliationComponent } from '../ui/bank-reconciliation.component';

/**
 * Enterprise Financial Reports page container presenting Trial Balance, Balance Sheet, P&L, and Bank Reconciliation.
 */
@Component({
  selector: 'app-reports-page',
  imports: [
    MatTabsModule,
    MatIconModule,
    TrialBalanceComponent,
    BalanceSheetComponent,
    IncomeStatementComponent,
    BankReconciliationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reports-page">
      <header class="page-header">
        <div>
          <h2 class="page-title">Enterprise Financial Statements & Reconciliation</h2>
          <p class="page-subtitle">Real-time reports derived directly from immutable double-entry ledger</p>
        </div>
      </header>

      <mat-tab-group animationDuration="200ms">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">table_chart</mat-icon>
            Trial Balance (இருப்புச் சோதனை)
          </ng-template>
          <div class="tab-content">
            <app-trial-balance [data]="reportsStore.trialBalance()" />
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">account_balance</mat-icon>
            Balance Sheet (இருப்புநிலைத் தாள்)
          </ng-template>
          <div class="tab-content">
            <app-balance-sheet [data]="reportsStore.balanceSheet()" />
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">trending_up</mat-icon>
            Income Statement (P&L)
          </ng-template>
          <div class="tab-content">
            <app-income-statement [data]="reportsStore.incomeStatement()" />
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">sync_alt</mat-icon>
            Bank Reconciliation (வங்கி ஒப்பிடுதல்)
          </ng-template>
          <div class="tab-content">
            <app-bank-reconciliation />
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      margin-bottom: 0.5rem;
    }

    .page-title {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0.25rem 0 0;
    }

    .tab-icon {
      margin-right: 0.5rem;
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
    }

    .tab-content {
      padding-top: 1.25rem;
    }
  `]
})
export class ReportsPageComponent implements OnInit {
  protected readonly reportsStore = inject(ReportsStoreService);
  private readonly ledgerStore = inject(LedgerStoreService);

  public ngOnInit(): void {
    this.ledgerStore.loadAll();
  }
}
