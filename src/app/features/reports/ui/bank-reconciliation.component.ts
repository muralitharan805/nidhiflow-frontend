import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface BankStatementRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  matchedEntryId?: string;
  isMatched: boolean;
}

@Component({
  selector: 'app-bank-reconciliation',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reconciliation-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">🏦 Bank Statement Auto-Reconciliation</h3>
          <p class="card-subtitle">Upload bank statement CSV and match transactions against your double-entry ledger</p>
        </div>

        <div class="upload-btn-wrapper">
          <button mat-flat-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon> Upload CSV Statement
          </button>
          <input #fileInput type="file" accept=".csv" class="hidden-file-input" (change)="onFileSelected($event)" />
        </div>
      </div>

      <!-- Sample Load Helper -->
      @if (statementRows().length === 0) {
        <div class="empty-upload-box">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <p class="upload-title">Drop your Bank CSV Statement here</p>
          <p class="upload-sub">Format expected: Date, Description, Amount, Type (DEBIT/CREDIT)</p>
          <button mat-stroked-button color="primary" (click)="loadSampleStatement()">
            ⚡ Load Sample Bank Statement for Demo
          </button>
        </div>
      } @else {
        <!-- Reconciliation Summary Bar -->
        <div class="recon-summary-bar">
          <div class="summary-chip text-success">
            <span class="chip-label">Matched Items:</span>
            <strong>{{ matchedCount() }} / {{ statementRows().length }}</strong>
          </div>
          <div class="summary-chip text-warn">
            <span class="chip-label">Unmatched Items:</span>
            <strong>{{ unmatchedCount() }}</strong>
          </div>
          <div class="summary-chip">
            <span class="chip-label">Reconciliation Rate:</span>
            <strong>{{ matchPercentage() | number:'1.0-0' }}%</strong>
          </div>
        </div>

        <!-- Statement Items Table -->
        <div class="table-wrapper">
          <table class="recon-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Date</th>
                <th>Statement Description</th>
                <th class="text-right">Amount (₹)</th>
                <th>Type</th>
                <th>Reconciliation Action</th>
              </tr>
            </thead>
            <tbody>
              @for (row of statementRows(); track row.id) {
                <tr [class.row-matched]="row.isMatched">
                  <td>
                    @if (row.isMatched) {
                      <span class="status-pill status-matched">✓ MATCHED</span>
                    } @else {
                      <span class="status-pill status-unmatched">⚠ UNMATCHED</span>
                    }
                  </td>
                  <td>{{ row.date | date:'shortDate' }}</td>
                  <td class="font-medium">{{ row.description }}</td>
                  <td class="text-right font-mono font-bold" [class.text-debit]="row.type === 'DEBIT'" [class.text-credit]="row.type === 'CREDIT'">
                    {{ row.amount | currency:'INR':'symbol':'1.0-0' }}
                  </td>
                  <td>
                    <span class="type-badge" [class.type-debit]="row.type === 'DEBIT'" [class.type-credit]="row.type === 'CREDIT'">
                      {{ row.type }}
                    </span>
                  </td>
                  <td>
                    @if (row.isMatched) {
                      <span class="matched-text">Linked to Ledger</span>
                    } @else {
                      <button
                        mat-stroked-button
                        color="primary"
                        class="btn-sm"
                        (click)="postUnmatchedToLedger(row)"
                      >
                        + Post to Ledger
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .reconciliation-card {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }

    .card-subtitle {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0.25rem 0 0;
    }

    .hidden-file-input { display: none; }

    .empty-upload-box {
      border: 2px dashed var(--mat-sys-outline);
      border-radius: 12px;
      padding: 3rem 1.5rem;
      text-align: center;
      background: var(--mat-sys-surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;

      .upload-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--mat-sys-primary);
      }

      .upload-title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
      }

      .upload-sub {
        font-size: 0.85rem;
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }
    }

    .recon-summary-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .summary-chip {
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.85rem;
      display: flex;
      gap: 0.5rem;
    }

    .text-success { color: var(--mat-sys-success); }
    .text-warn { color: var(--mat-sys-error); }

    .table-wrapper { overflow-x: auto; }

    .recon-table {
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

    .row-matched {
      background: rgba(16, 185, 129, 0.03);
    }

    .status-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }

    .status-matched {
      background: rgba(16, 185, 129, 0.15);
      color: var(--mat-sys-success);
    }

    .status-unmatched {
      background: rgba(239, 68, 68, 0.15);
      color: var(--mat-sys-error);
    }

    .type-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .type-debit { background: rgba(239, 68, 68, 0.12); color: var(--mat-sys-error); }
    .type-credit { background: rgba(16, 185, 129, 0.12); color: var(--mat-sys-success); }

    .text-debit { color: var(--mat-sys-error); }
    .text-credit { color: var(--mat-sys-success); }

    .btn-sm {
      font-size: 0.75rem;
      line-height: 1.5;
      padding: 0 0.5rem;
    }

    .matched-text {
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
    }

    .text-right { text-align: right; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
  `]
})
export class BankReconciliationComponent {
  private readonly ledgerStore = inject(LedgerStoreService);
  private readonly notificationService = inject(NotificationService);

  public readonly statementRows = signal<BankStatementRow[]>([]);

  public readonly matchedCount = computed(() =>
    this.statementRows().filter((r) => r.isMatched).length
  );

  public readonly unmatchedCount = computed(() =>
    this.statementRows().filter((r) => !r.isMatched).length
  );

  public readonly matchPercentage = computed(() => {
    const total = this.statementRows().length;
    if (total === 0) return 0;
    return (this.matchedCount() / total) * 100;
  });

  public loadSampleStatement(): void {
    const samples: BankStatementRow[] = [
      {
        id: 'stmt-1',
        date: '2026-07-01',
        description: 'Monthly Salary Credit - Tech Corp',
        amount: 45000,
        type: 'CREDIT',
        isMatched: true,
      },
      {
        id: 'stmt-2',
        date: '2026-07-05',
        description: 'ACH Home Loan EMI Debit',
        amount: 85000,
        type: 'DEBIT',
        isMatched: true,
      },
      {
        id: 'stmt-3',
        date: '2026-07-12',
        description: 'UPI - Supermarket Groceries',
        amount: 3200,
        type: 'DEBIT',
        isMatched: false,
      },
      {
        id: 'stmt-4',
        date: '2026-07-18',
        description: 'NEFT - Dividend Credit from Stocks',
        amount: 4500,
        type: 'CREDIT',
        isMatched: false,
      },
    ];

    this.statementRows.set(samples);
    this.notificationService.showSuccess('Statement Loaded', 'Sample bank statement loaded for reconciliation demo.');
  }

  public onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseCsvContent(text);
    };
    reader.readAsText(file);
  }

  private parseCsvContent(csvText: string): void {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      this.notificationService.showError('Invalid CSV', 'CSV file must contain a header and data rows.');
      return;
    }

    const rows: BankStatementRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length >= 4) {
        rows.push({
          id: `csv-${i}`,
          date: cols[0] || new Date().toISOString(),
          description: cols[1] || 'Bank Transaction',
          amount: parseFloat(cols[2]) || 0,
          type: cols[3].toUpperCase().includes('CREDIT') ? 'CREDIT' : 'DEBIT',
          isMatched: false,
        });
      }
    }

    this.statementRows.set(rows);
    this.notificationService.showSuccess('CSV Parsed', `Successfully parsed ${rows.length} statement transactions.`);
  }

  public postUnmatchedToLedger(row: BankStatementRow): void {
    const assetAcc = this.ledgerStore.accounts().find((a) => a.type === 'ASSET');
    const targetAcc = this.ledgerStore.accounts().find((a) =>
      row.type === 'DEBIT' ? a.type === 'EXPENSE' : a.type === 'INCOME'
    );

    if (!assetAcc || !targetAcc) {
      this.notificationService.showError('Posting Failed', 'Need matching Asset & Expense/Income accounts in Chart of Accounts.');
      return;
    }

    this.ledgerStore.postJournalEntry({
      entryNumber: `STMT-${Date.now()}`,
      description: `[RECONCILED] ${row.description}`,
      postings: [
        { accountId: targetAcc.id, type: row.type === 'DEBIT' ? 'DEBIT' : 'CREDIT', amount: row.amount },
        { accountId: assetAcc.id, type: row.type === 'DEBIT' ? 'CREDIT' : 'DEBIT', amount: row.amount },
      ],
    });

    // Mark row as matched
    this.statementRows.update((rows) =>
      rows.map((r) => (r.id === row.id ? { ...r, isMatched: true } : r))
    );
  }
}
