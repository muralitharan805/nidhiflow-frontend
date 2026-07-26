import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AccountEntity, AccountType } from '../models/ledger.model';

export interface DisplayPostingLine {
  accountId: string;
  accountName?: string;
  accountCode?: string;
  accountType?: AccountType;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export interface DisplayJournalEntry {
  id: string;
  entryNumber: string;
  description: string;
  transactionDate?: string;
  createdAt: string;
  postings: DisplayPostingLine[];
}

/**
 * Presentational component displaying posted double-entry journal transactions with
 * an Easy Mode (User Friendly) vs Advanced Mode (Accounting / Double Entry) toggle and Reversal actions.
 */
@Component({
  selector: 'app-journal-entries-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="entries-list-container">
      <div class="header-row">
        <h3 class="panel-title">📜 Posted Journal Entries</h3>

        <!-- Mode Switcher -->
        <div class="mode-toggle">
          <mat-button-toggle-group
            [value]="viewMode()"
            (change)="viewMode.set($event.value)"
            aria-label="View Mode"
          >
            <mat-button-toggle value="EASY">⚡ Easy View</mat-button-toggle>
            <mat-button-toggle value="ADVANCED">📊 Double-Entry View</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      @if (entries().length === 0) {
        <div class="empty-state">
          <mat-icon>history</mat-icon>
          <p>No journal entries posted yet.</p>
        </div>
      } @else {
        <div class="entries-table-wrapper">
          <table class="entries-table">
            <thead>
              @if (viewMode() === 'EASY') {
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category / Destination</th>
                  <th>Paid From / Source</th>
                  <th class="text-right">Amount</th>
                  <th class="text-center">Action</th>
                </tr>
              } @else {
                <tr>
                  <th>Entry #</th>
                  <th>Description</th>
                  <th>Postings (Debit / Credit)</th>
                  <th>Date</th>
                  <th class="text-center">Action</th>
                </tr>
              }
            </thead>
            <tbody>
              @for (entry of entries(); track entry.id) {
                <tr [class.is-reversed]="isReversal(entry.description)">
                  @if (viewMode() === 'EASY') {
                    <!-- Easy View Columns -->
                    <td class="entry-date">{{ (entry.transactionDate || entry.createdAt) | date:'shortDate' }}</td>
                    <td class="entry-desc">
                      {{ entry.description }}
                      @if (isReversal(entry.description)) {
                        <span class="badge badge-reversed">REVERSAL</span>
                      }
                    </td>
                    <td class="entry-category">
                      <span class="chip chip-category">
                        {{ getCategoryName(entry) }}
                      </span>
                    </td>
                    <td class="entry-source">
                      <span class="chip chip-source">
                        {{ getSourceAccountName(entry) }}
                      </span>
                    </td>
                    <td class="entry-amount text-right">
                      {{ getEntryTotalAmount(entry) | currency:'INR':'symbol':'1.0-0' }}
                    </td>
                  } @else {
                    <!-- Advanced Accounting View Columns -->
                    <td class="entry-num">
                      <code>{{ entry.entryNumber }}</code>
                      @if (isReversal(entry.description)) {
                        <span class="badge badge-reversed">REVERSAL</span>
                      }
                    </td>
                    <td class="entry-desc">{{ entry.description }}</td>
                    <td class="entry-postings">
                      <div class="postings-wrapper">
                        @for (posting of entry.postings; track $index) {
                          <div
                            class="posting-pill"
                            [class.is-debit]="posting.type === 'DEBIT'"
                            [class.is-credit]="posting.type === 'CREDIT'"
                          >
                            <span class="pill-type">{{ posting.type === 'DEBIT' ? 'DR' : 'CR' }}</span>
                            <span class="pill-name">{{ getAccountName(posting) }}</span>
                            <span class="pill-amount">{{ posting.amount | currency:'INR':'symbol':'1.0-0' }}</span>
                          </div>
                        }
                      </div>
                    </td>
                    <td class="entry-date">{{ (entry.transactionDate || entry.createdAt) | date:'shortDate' }}</td>
                  }

                  <!-- Common Action Column -->
                  <td class="text-center">
                    @if (!isReversal(entry.description)) {
                      <button
                        mat-icon-button
                        color="warn"
                        matTooltip="Void / Reverse Entry (Create Reversing Transaction)"
                        (click)="onVoidClick(entry)"
                        aria-label="Void Journal Entry"
                      >
                        <mat-icon>undo</mat-icon>
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
    .entries-list-container {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        opacity: 0.5;
      }
    }

    .entries-table-wrapper {
      overflow-x: auto;
    }

    .entries-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th, td {
        padding: 0.75rem 0.5rem;
        text-align: left;
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

    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }

    .entry-num code {
      font-family: monospace;
      font-weight: 600;
    }

    .badge-reversed {
      display: inline-block;
      margin-left: 0.4rem;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-error);
    }

    .is-reversed {
      opacity: 0.75;
      background: rgba(255, 0, 0, 0.03);
    }

    .chip {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }

    .chip-category {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .chip-source {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .entry-amount {
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .entry-postings {
      vertical-align: middle;
    }

    .postings-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }

    .posting-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .is-debit {
      background: rgba(16, 185, 129, 0.12);
      color: var(--mat-sys-success);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .is-credit {
      background: rgba(239, 68, 68, 0.12);
      color: var(--mat-sys-error);
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .pill-type {
      font-size: 0.65rem;
      font-weight: 800;
      opacity: 0.9;
    }

    .pill-name {
      font-weight: 600;
    }
  `]
})
export class JournalEntriesListComponent {
  private readonly dialog = inject(MatDialog);

  public readonly entries = input.required<DisplayJournalEntry[]>();
  public readonly accounts = input<AccountEntity[]>([]);
  public readonly reverseRequested = output<{ entry: DisplayJournalEntry; reason: string }>();

  /** Current active table view mode ('EASY' for regular users, 'ADVANCED' for accountants). */
  protected readonly viewMode = signal<'EASY' | 'ADVANCED'>('EASY');

  protected isReversal(description: string): boolean {
    return description.startsWith('[REVERSAL]');
  }

  /**
   * Resolves account name using posting property or fallback accounts list lookup.
   */
  protected getAccountName(posting: DisplayPostingLine): string {
    if (posting.accountName) return posting.accountName;
    const found = this.accounts().find((a) => a.id === posting.accountId);
    return found ? found.name : `Acc #${posting.accountId.slice(0, 6)}`;
  }

  /**
   * Resolves Category / Destination Account Name (DEBIT posting / Expense / Income head).
   */
  protected getCategoryName(entry: DisplayJournalEntry): string {
    if (!entry.postings || entry.postings.length === 0) return 'General Ledger';
    
    // Find DEBIT line first (or EXPENSE/INCOME)
    const debitLine = entry.postings.find((p) => p.type === 'DEBIT' || p.accountType === 'EXPENSE' || p.accountType === 'INCOME');
    if (debitLine) {
      return this.getAccountName(debitLine);
    }
    return this.getAccountName(entry.postings[0]);
  }

  /**
   * Resolves Source / Paid From Account Name (CREDIT posting / Asset / Liability head).
   */
  protected getSourceAccountName(entry: DisplayJournalEntry): string {
    if (!entry.postings || entry.postings.length === 0) return 'Cash / Bank';

    // Find CREDIT line (or ASSET/LIABILITY)
    const creditLine = entry.postings.find((p) => p.type === 'CREDIT' || p.accountType === 'ASSET' || p.accountType === 'LIABILITY');
    if (creditLine) {
      return this.getAccountName(creditLine);
    }
    return entry.postings.length > 1 ? this.getAccountName(entry.postings[1]) : 'Cash / Bank';
  }

  /**
   * Calculates entry total transaction amount.
   */
  protected getEntryTotalAmount(entry: DisplayJournalEntry): number {
    if (!entry.postings || entry.postings.length === 0) return 0;
    const debits = entry.postings.filter((p) => p.type === 'DEBIT');
    if (debits.length > 0) {
      return debits.reduce((sum, p) => sum + p.amount, 0);
    }
    return entry.postings[0].amount;
  }

  protected onVoidClick(entry: DisplayJournalEntry): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Void Transaction #${entry.entryNumber}?`,
        message: `This action will post an audit-compliant Reversing Entry to cancel out "${entry.description}". Continuous immutability will be preserved.`,
        confirmText: 'Confirm Void / Reverse',
        cancelText: 'Cancel',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.reverseRequested.emit({ entry, reason: 'User requested cancellation' });
      }
    });
  }
}
