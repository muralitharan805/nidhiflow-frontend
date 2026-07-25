import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { BalanceSheetData } from '../models/reports.model';

@Component({
  selector: 'app-balance-sheet',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="report-card">
      <div class="report-header">
        <div>
          <h3 class="report-title">Balance Sheet (இருப்புநிலைத் தாள்)</h3>
          <p class="report-subtitle">Assets = Liabilities + Equity</p>
        </div>
        <span class="status-badge" [class.badge-success]="data().isBalanced" [class.badge-error]="!data().isBalanced">
          {{ data().isBalanced ? '✓ EQUATION BALANCED' : '⚠ UNBALANCED' }}
        </span>
      </div>

      <div class="balance-sheet-grid">
        <!-- Assets Column -->
        <div class="bs-column">
          <h4 class="column-title text-success">ASSETS (சொத்துக்கள்)</h4>
          <div class="items-list">
            @for (item of data().assets.items; track item.code) {
              <div class="item-row">
                <span><code>{{ item.code }}</code> {{ item.name }}</span>
                <span class="font-mono font-semibold">{{ item.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          <div class="column-total total-success">
            <span>TOTAL ASSETS:</span>
            <span class="font-mono font-bold">{{ data().totalAssets | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <!-- Liabilities & Equity Column -->
        <div class="bs-column">
          <h4 class="column-title text-error">LIABILITIES (பொறுப்புகள் / கடன்கள்)</h4>
          <div class="items-list">
            @for (item of data().liabilities.items; track item.code) {
              <div class="item-row">
                <span><code>{{ item.code }}</code> {{ item.name }}</span>
                <span class="font-mono font-semibold">{{ item.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          <div class="column-subtotal">
            <span>Total Liabilities:</span>
            <span class="font-mono font-bold">{{ data().liabilities.total | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>

          <h4 class="column-title text-primary mt-4">EQUITY (மூலதனம் / நிகர மதிப்பு)</h4>
          <div class="items-list">
            @for (item of data().equity.items; track item.code) {
              <div class="item-row">
                <span><code>{{ item.code }}</code> {{ item.name }}</span>
                <span class="font-mono font-semibold">{{ item.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          <div class="column-subtotal">
            <span>Total Equity:</span>
            <span class="font-mono font-bold">{{ data().equity.total | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>

          <div class="column-total total-primary">
            <span>TOTAL LIABILITIES & EQUITY:</span>
            <span class="font-mono font-bold">{{ data().totalLiabilitiesAndEquity | currency:'INR':'symbol':'1.0-0' }}</span>
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

    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
    }

    .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--mat-sys-success); }
    .badge-error { background: rgba(239, 68, 68, 0.15); color: var(--mat-sys-error); }

    .balance-sheet-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    @media (max-width: 800px) {
      .balance-sheet-grid { grid-template-columns: 1fr; }
    }

    .bs-column {
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .column-title {
      font-size: 0.85rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px dashed var(--mat-sys-outline-variant);
    }

    .text-success { color: var(--mat-sys-success); }
    .text-error { color: var(--mat-sys-error); }
    .text-primary { color: var(--mat-sys-primary); }
    .mt-4 { margin-top: 1rem; }

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

    .column-subtotal {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
      margin-top: 0.5rem;
    }

    .column-total {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      font-weight: 700;
      padding: 0.75rem 0.5rem;
      border-radius: 6px;
      margin-top: 1rem;
    }

    .total-success { background: rgba(16, 185, 129, 0.12); color: var(--mat-sys-success); }
    .total-primary { background: rgba(59, 130, 246, 0.12); color: var(--mat-sys-primary); }

    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
  `]
})
export class BalanceSheetComponent {
  public readonly data = input.required<BalanceSheetData>();
}
