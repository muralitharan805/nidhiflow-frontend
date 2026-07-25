import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface DisplayJournalEntry {
  id: string;
  entryNumber: string;
  description: string;
  transactionDate?: string;
  createdAt: string;
  postings: { accountId: string; accountName?: string; type: 'DEBIT' | 'CREDIT'; amount: number }[];
}

/**
 * Presentational component displaying posted double-entry journal transactions with Reversal actions.
 */
@Component({
  selector: 'app-journal-entries-list',
  imports: [CurrencyPipe, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="entries-list-container">
      <h3 class="panel-title">📜 Posted Journal Entries</h3>

      @if (entries().length === 0) {
        <div class="empty-state">
          <mat-icon>history</mat-icon>
          <p>No journal entries posted yet.</p>
        </div>
      } @else {
        <div class="entries-table-wrapper">
          <table class="entries-table">
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Description</th>
                <th>Postings (Debit / Credit)</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.id) {
                <tr [class.is-reversed]="isReversal(entry.description)">
                  <td class="entry-num">
                    <code>{{ entry.entryNumber }}</code>
                    @if (isReversal(entry.description)) {
                      <span class="badge badge-reversed">REVERSAL</span>
                    }
                  </td>
                  <td class="entry-desc">{{ entry.description }}</td>
                  <td class="entry-postings">
                    @for (posting of entry.postings; track $index) {
                      <div class="posting-pill" [class.is-debit]="posting.type === 'DEBIT'" [class.is-credit]="posting.type === 'CREDIT'">
                        <span class="pill-type">{{ posting.type }}</span>
                        <span class="pill-amount">{{ posting.amount | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                    }
                  </td>
                  <td class="entry-date">{{ (entry.transactionDate || entry.createdAt) | date:'shortDate' }}</td>
                  <td>
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

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 1rem;
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

    .entry-postings {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .posting-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .is-debit {
      background: rgba(16, 185, 129, 0.12);
      color: var(--mat-sys-success);
    }

    .is-credit {
      background: rgba(239, 68, 68, 0.12);
      color: var(--mat-sys-error);
    }

    .pill-type {
      font-size: 0.65rem;
      font-weight: 700;
      opacity: 0.8;
    }
  `]
})
export class JournalEntriesListComponent {
  private readonly dialog = inject(MatDialog);

  public readonly entries = input.required<DisplayJournalEntry[]>();
  public readonly reverseRequested = output<{ entry: DisplayJournalEntry; reason: string }>();

  protected isReversal(description: string): boolean {
    return description.startsWith('[REVERSAL]');
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
