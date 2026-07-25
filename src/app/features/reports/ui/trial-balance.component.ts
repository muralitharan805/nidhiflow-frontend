import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TrialBalanceSummary } from '../models/reports.model';

@Component({
  selector: 'app-trial-balance',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="report-card">
      <div class="report-header">
        <div>
          <h3 class="report-title">Trial Balance (இருப்புச் சோதனையறிக்கை)</h3>
          <p class="report-subtitle">Verifies that total debits equal total credits across all accounts</p>
        </div>
        <span class="status-badge" [class.badge-success]="data().isBalanced" [class.badge-error]="!data().isBalanced">
          {{ data().isBalanced ? '✓ BALANCED (Σ Debits = Σ Credits)' : '⚠ UNBALANCED' }}
        </span>
      </div>

      <div class="table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th class="text-right">Debit (₹)</th>
              <th class="text-right">Credit (₹)</th>
            </tr>
          </thead>
          <tbody>
            @for (row of data().rows; track row.code) {
              <tr>
                <td><code>{{ row.code }}</code></td>
                <td class="font-medium">{{ row.name }}</td>
                <td><span class="type-pill">{{ row.type }}</span></td>
                <td class="text-right font-mono">{{ row.debit > 0 ? (row.debit | currency:'INR':'symbol':'1.0-0') : '—' }}</td>
                <td class="text-right font-mono">{{ row.credit > 0 ? (row.credit | currency:'INR':'symbol':'1.0-0') : '—' }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="3" class="text-right font-bold">TOTAL:</td>
              <td class="text-right font-bold font-mono">{{ data().totalDebit | currency:'INR':'symbol':'1.0-0' }}</td>
              <td class="text-right font-bold font-mono">{{ data().totalCredit | currency:'INR':'symbol':'1.0-0' }}</td>
            </tr>
          </tfoot>
        </table>
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

    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      color: var(--mat-sys-success);
    }

    .badge-error {
      background: rgba(239, 68, 68, 0.15);
      color: var(--mat-sys-error);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th, td {
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.5px;
      }
    }

    .text-right { text-align: right; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }

    .type-pill {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      background: var(--mat-sys-surface-container-high);
    }

    .summary-row td {
      border-top: 2px solid var(--mat-sys-outline);
      border-bottom: 2px double var(--mat-sys-outline);
      font-size: 0.95rem;
    }
  `]
})
export class TrialBalanceComponent {
  public readonly data = input.required<TrialBalanceSummary>();
}
