import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ReportsStoreService } from '../data-access/reports-store.service';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import { TrialBalanceComponent } from '../ui/trial-balance.component';
import { BalanceSheetComponent } from '../ui/balance-sheet.component';
import { IncomeStatementComponent } from '../ui/income-statement.component';
import { BankReconciliationComponent } from '../ui/bank-reconciliation.component';

/**
 * Enterprise Financial Reports page container presenting Trial Balance, Balance Sheet, P&L, and Bank Reconciliation with Date Filters.
 */
@Component({
  selector: 'app-reports-page',
  imports: [
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    TrialBalanceComponent,
    BalanceSheetComponent,
    IncomeStatementComponent,
    BankReconciliationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reports-page">
      <header class="page-header">
        <div class="header-main">
          <h2 class="page-title">Enterprise Financial Statements & Reconciliation</h2>
          <p class="page-subtitle">Real-time reports derived directly from immutable double-entry ledger</p>
        </div>

        <!-- Date Range Filter Bar -->
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="preset-field">
            <mat-label>Quick Period</mat-label>
            <mat-select [value]="activePreset()" (selectionChange)="onPresetChange($event.value)">
              <mat-option value="THIS_MONTH">📅 Current Month (This Month)</mat-option>
              <mat-option value="LAST_MONTH">📅 Last Month</mat-option>
              <mat-option value="YEAR_TO_DATE">📊 Year to Date (YTD)</mat-option>
              <mat-option value="CUSTOM">⚙️ Custom Date Range</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>P&L Start Date</mat-label>
            <input
              matInput
              type="date"
              [ngModel]="reportsStore.selectedStartDate()"
              (ngModelChange)="onStartDateChange($event)"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>P&L End Date</mat-label>
            <input
              matInput
              type="date"
              [ngModel]="reportsStore.selectedEndDate()"
              (ngModelChange)="onEndDateChange($event)"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>As-Of Date (Snapshot)</mat-label>
            <input
              matInput
              type="date"
              [ngModel]="reportsStore.selectedAsOfDate()"
              (ngModelChange)="onAsOfDateChange($event)"
            />
          </mat-form-field>

          <button mat-flat-button color="primary" type="button" class="apply-btn" (click)="applyFilters()">
            <mat-icon>refresh</mat-icon> Apply Filter
          </button>
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
      display: flex;
      flex-direction: column;
      gap: 1rem;
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

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      padding: 0.75rem 1rem 0.25rem;
      border-radius: 10px;
    }

    .preset-field {
      width: 220px;
    }

    .date-field {
      width: 170px;
    }

    .apply-btn {
      height: 48px;
      margin-bottom: 22px;
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

  protected readonly activePreset = signal<string>('THIS_MONTH');

  public ngOnInit(): void {
    this.ledgerStore.loadAll();
    this.applyFilters();
  }

  protected onPresetChange(preset: string): void {
    this.activePreset.set(preset);
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0];

    if (preset === 'THIS_MONTH') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (preset === 'LAST_MONTH') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(lastMonthEnd.getDate()).padStart(2, '0')}`;
    } else if (preset === 'YEAR_TO_DATE') {
      startDate = `${now.getFullYear()}-01-01`;
    }

    if (startDate) {
      this.reportsStore.loadReports({
        startDate,
        endDate,
        asOfDate: endDate,
      });
    }
  }

  protected onStartDateChange(val: string): void {
    this.activePreset.set('CUSTOM');
    this.reportsStore.selectedStartDate.set(val);
  }

  protected onEndDateChange(val: string): void {
    this.activePreset.set('CUSTOM');
    this.reportsStore.selectedEndDate.set(val);
  }

  protected onAsOfDateChange(val: string): void {
    this.activePreset.set('CUSTOM');
    this.reportsStore.selectedAsOfDate.set(val);
  }

  protected applyFilters(): void {
    this.reportsStore.loadReports({
      startDate: this.reportsStore.selectedStartDate(),
      endDate: this.reportsStore.selectedEndDate(),
      asOfDate: this.reportsStore.selectedAsOfDate(),
    });
  }
}
