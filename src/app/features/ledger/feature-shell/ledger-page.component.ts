import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { LedgerStoreService } from '../data-access/ledger-store.service';
import { ChartOfAccountsComponent } from '../ui/chart-of-accounts.component';
import { JournalEntryFormComponent } from '../ui/journal-entry-form.component';
import { CreateAccountFormComponent } from '../ui/create-account-form.component';
import { JournalEntriesListComponent } from '../ui/journal-entries-list.component';
import { CreateJournalEntryInput, AccountType } from '../models/ledger.model';

/**
 * Ledger container page presenting Chart of Accounts and journal entry posting form.
 */
@Component({
  selector: 'app-ledger-page',
  imports: [CurrencyPipe, ChartOfAccountsComponent, JournalEntryFormComponent, CreateAccountFormComponent, JournalEntriesListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ledger-page">
      <header class="page-header">
        <div>
          <h2 class="page-title">Ledger & Chart of Accounts</h2>
          <p class="page-subtitle">Double-entry bookkeeping — Σ Debits must equal Σ Credits</p>
        </div>

        <!-- Net Worth Summary Banner -->
        <div class="net-worth-banner">
          <div class="nw-metric">
            <span class="nw-label">Assets</span>
            <span class="nw-value nw-positive">{{ store.netWorth().totalAssets | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="nw-divider">−</div>
          <div class="nw-metric">
            <span class="nw-label">Liabilities</span>
            <span class="nw-value nw-negative">{{ store.netWorth().totalLiabilities | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="nw-divider">=</div>
          <div class="nw-metric">
            <span class="nw-label">Net Worth</span>
            <span class="nw-value nw-primary">{{ store.netWorth().netWorth | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      </header>

      @if (store.isLoading()) {
        <div class="loading-state" role="status" aria-label="Loading ledger data">
          <div class="loading-spinner"></div>
          <span>Fetching ledger data...</span>
        </div>
      } @else {
        <div class="ledger-grid">
          <!-- Chart of Accounts Panel -->
          <section class="panel">
            <div class="panel-header-row">
              <h3 class="panel-title">📊 Chart of Accounts</h3>
              <button class="btn-outline" (click)="toggleCreateAccount()">
                {{ isCreatingAccount() ? 'Cancel' : '+ New Account' }}
              </button>
            </div>
            
            @if (isCreatingAccount()) {
              <div class="mb-4">
                <app-create-account-form (accountSubmitted)="onAccountSubmit($event)" />
              </div>
            }

            <app-chart-of-accounts [accountsByType]="store.accountsByType()" [categoryMeta]="store.categoryMeta()" />
          </section>

          <!-- Journal Entry Panel -->
          <section class="panel">
            <h3 class="panel-title">✏️ Post Journal Entry</h3>
            <app-journal-entry-form
              [accounts]="store.accounts()"
              (entrySubmitted)="onEntrySubmit($event)"
            />
          </section>
        </div>

        <!-- Posted Journal Entries Section with Reversal Support -->
        <app-journal-entries-list
          [entries]="store.recentEntries()"
          [accounts]="store.accounts()"
          (reverseRequested)="onReverseRequested($event)"
        />
      }
    </div>
  `,
  styles: [`
    .ledger-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
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

    .net-worth-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 0.75rem 1.25rem;
    }

    .nw-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .nw-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--mat-sys-outline);
      letter-spacing: 0.5px;
    }

    .nw-value {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .nw-positive { color: var(--mat-sys-success); }
    .nw-negative { color: var(--mat-sys-error); }
    .nw-primary  { color: var(--mat-sys-primary); }

    .nw-divider {
      font-size: 1.25rem;
      color: var(--mat-sys-outline);
      font-weight: 300;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--mat-sys-outline-variant);
      border-top-color: var(--mat-sys-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .ledger-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    @media (max-width: 900px) {
      .ledger-grid { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .panel-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .mb-4 { margin-bottom: 1.5rem; }

    .btn-outline {
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      border: 1px solid var(--mat-sys-primary);
      color: var(--mat-sys-primary);
      background: transparent;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: var(--mat-sys-primary-container);
      }
    }

    @media (max-width: 599.98px) {
      .ledger-page {
        gap: 1rem;
      }
      .page-title {
        font-size: 1.15rem;
      }
      .page-subtitle {
        font-size: 0.75rem;
      }
      .net-worth-banner {
        width: 100%;
        padding: 0.5rem 0.75rem;
        gap: 0.4rem;
        justify-content: space-around;
      }
      .nw-label {
        font-size: 0.625rem;
      }
      .nw-value {
        font-size: 0.9rem;
      }
      .nw-divider {
        font-size: 0.9rem;
      }
      .panel {
        padding: 0.75rem;
        border-radius: 10px;
      }
      .panel-header-row {
        gap: 0.35rem;
        margin-bottom: 0.75rem;
      }
      .panel-title {
        font-size: 0.9rem;
      }
      .btn-outline {
        padding: 0.3rem 0.6rem;
        font-size: 0.725rem;
        white-space: nowrap;
      }
    }
  `]
})
export class LedgerPageComponent implements OnInit {
  protected readonly store = inject(LedgerStoreService);
  
  // Local UI state for form toggle
  protected readonly isCreatingAccount = signal(false);

  public ngOnInit(): void {
    this.store.loadAll();
  }

  protected toggleCreateAccount(): void {
    this.isCreatingAccount.update(v => !v);
  }

  protected onAccountSubmit(input: { code: string; name: string; type: AccountType; description?: string }): void {
    this.store.createAccount(input);
    this.isCreatingAccount.set(false);
  }

  protected onEntrySubmit(input: CreateJournalEntryInput): void {
    this.store.postJournalEntry(input);
  }

  protected onReverseRequested(event: { entry: { entryNumber: string; description: string; postings: { accountId: string; type: 'DEBIT' | 'CREDIT'; amount: number }[] }; reason: string }): void {
    this.store.reverseJournalEntry(event.entry, event.reason);
  }
}
