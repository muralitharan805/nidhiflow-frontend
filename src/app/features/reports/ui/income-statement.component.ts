import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { IncomeStatementData } from '../models/reports.model';

@Component({
  selector: 'app-income-statement',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="report-card">
      <div class="report-header">
        <div>
          <h3 class="report-title">Income Statement / Profit & Loss (வருமான அறிக்கை)</h3>
          <p class="report-subtitle">Net Income = Total Revenues − Total Expenses</p>
        </div>
        <div class="net-income-box" [class.is-profit]="data().netIncome >= 0" [class.is-loss]="data().netIncome < 0">
          <span class="box-label">{{ data().netIncome >= 0 ? 'NET PROFIT' : 'NET LOSS' }}</span>
          <span class="box-value">{{ data().netIncome | currency:'INR':'symbol':'1.0-0' }}</span>
        </div>
      </div>

      <div class="pnl-grid">
        <!-- Revenues Section -->
        <div class="pnl-section">
          <h4 class="section-title text-success">INCOME / REVENUES (வருமானம்)</h4>
          <div class="items-list">
            @for (rev of data().revenues; track rev.code) {
              <div class="item-row">
                <span><code>{{ rev.code }}</code> {{ rev.name }}</span>
                <span class="font-mono font-semibold text-success">+{{ rev.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          <div class="section-total">
            <span>Total Income:</span>
            <span class="font-mono font-bold text-success">{{ data().totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <!-- Expenses Section -->
        <div class="pnl-section">
          <h4 class="section-title text-error">EXPENSES (செலவுகள்)</h4>
          <div class="items-list">
            @for (exp of data().expenses; track exp.code) {
              <div class="item-row">
                <span><code>{{ exp.code }}</code> {{ exp.name }}</span>
                <span class="font-mono font-semibold text-error">−{{ exp.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          <div class="section-total">
            <span>Total Expenses:</span>
            <span class="font-mono font-bold text-error">{{ data().totalExpenses | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-card {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }

    .report-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }

    .report-subtitle {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0.25rem 0 0;
    }

    .net-income-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }

    .is-profit {
      background: rgba(16, 185, 129, 0.15);
      color: var(--mat-sys-success);
    }

    .is-loss {
      background: rgba(239, 68, 68, 0.15);
      color: var(--mat-sys-error);
    }

    .box-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .box-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: monospace;
    }

    .pnl-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    @media (max-width: 800px) {
      .pnl-grid { grid-template-columns: 1fr; }
    }

    .pnl-section {
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px dashed var(--mat-sys-outline-variant);
    }

    .text-success { color: var(--mat-sys-success); }
    .text-error { color: var(--mat-sys-error); }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;

      code {
        font-family: monospace;
        font-size: 0.75rem;
        background: var(--mat-sys-surface-container-high);
        padding: 0.1rem 0.3rem;
        border-radius: 4px;
      }
    }

    .section-total {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      font-weight: 700;
      padding-top: 0.75rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
      margin-top: 1rem;
    }

    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
  `]
})
export class IncomeStatementComponent {
  public readonly data = input.required<IncomeStatementData>();
}
