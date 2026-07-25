import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { LedgerService, JournalEntryEntity } from '../../../core/services/ledger.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AccountEntity,
  NetWorthSummary,
  AccountType,
  CreateJournalEntryInput,
} from '../models/ledger.model';

/**
 * Signal-driven store for the Ledger domain managing accounts and net worth data.
 */
@Injectable({ providedIn: 'root' })
export class LedgerStoreService {
  private readonly ledgerService = inject(LedgerService);
  private readonly notificationService = inject(NotificationService);

  private readonly accountsSignal = signal<AccountEntity[]>([]);
  private readonly netWorthSignal = signal<NetWorthSummary>({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly recentEntriesSignal = signal<
    { id: string; entryNumber: string; description: string; transactionDate?: string; createdAt: string; postings: { accountId: string; type: 'DEBIT' | 'CREDIT'; amount: number }[] }[]
  >([
    {
      id: 'entry-seed-1',
      entryNumber: 'JE-1001',
      description: 'Opening Balance Setup',
      createdAt: new Date().toISOString(),
      postings: [
        { accountId: 'acc-asset', type: 'DEBIT', amount: 50000 },
        { accountId: 'acc-equity', type: 'CREDIT', amount: 50000 },
      ],
    },
  ]);

  public readonly accounts = this.accountsSignal.asReadonly();
  public readonly netWorth = this.netWorthSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();
  public readonly recentEntries = this.recentEntriesSignal.asReadonly();

  /** Computed accounts grouped by type for tree display. */
  public readonly accountsByType = computed(() => {
    const types: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
    return types.map((type) => ({
      type,
      accounts: this.accountsSignal().filter((a) => a.type === type),
    }));
  });

  /**
   * Fetch all accounts and net worth from the backend API.
   */
  public loadAll(): void {
    this.isLoadingSignal.set(true);

    this.ledgerService.getNetWorth().pipe(catchError(() => of(null))).subscribe((nw) => {
      if (nw) {
        this.netWorthSignal.set({ totalAssets: nw.totalAssets, totalLiabilities: nw.totalLiabilities, netWorth: nw.netWorth });
      }
    });

    this.ledgerService.getAccounts({ limit: 100 }).pipe(catchError(() => of(null))).subscribe((res) => {
      this.isLoadingSignal.set(false);
      if (res) {
        this.accountsSignal.set(res.items as AccountEntity[]);
      }
    });
  }

  /**
   * Post a balanced double-entry journal entry to the backend.
   *
   * @param input Journal entry creation payload
   */
  public postJournalEntry(input: CreateJournalEntryInput): void {
    const postings = input.postings || input.lines || [];
    const entryNumber = input.entryNumber || `JE-${Date.now()}`;
    this.ledgerService.postJournalEntry({
      entryNumber,
      description: input.description,
      postings,
    }).pipe(
      catchError(() => {
        this.notificationService.showError('Entry Failed', 'Unbalanced entry rejected. Ensure Σ Debits = Σ Credits.');
        return of(null);
      })
    ).subscribe((entry) => {
      if (entry) {
        this.notificationService.showSuccess('Entry Posted', `Journal entry #${entry.entryNumber || entryNumber} recorded.`);
        this.recentEntriesSignal.update(entries => [
          {
            id: entry.id || `entry-${Date.now()}`,
            entryNumber: entry.entryNumber || entryNumber,
            description: input.description,
            createdAt: entry.createdAt || new Date().toISOString(),
            postings,
          },
          ...entries,
        ]);
        this.loadAll();
      }
    });
  }

  /**
   * Create a new account head in the backend and reload the ledger state.
   *
   * @param input Account creation payload
   */
  public createAccount(input: { code: string; name: string; type: AccountType; description?: string }): void {
    this.ledgerService.createAccount(input).pipe(
      catchError(() => {
        this.notificationService.showError('Account Creation Failed', 'Failed to create account. Ensure the code is unique.');
        return of(null);
      })
    ).subscribe((account) => {
      if (account) {
        this.notificationService.showSuccess('Account Created', `Account ${account.name} (${account.code}) created successfully.`);
        this.loadAll();
      }
    });
  }

  /**
   * Reverse an existing journal entry by posting an audit-compliant reversing transaction.
   *
   * @param originalEntry Target transaction details
   * @param reason Audit explanation for reversal
   */
  public reverseJournalEntry(
    originalEntry: { entryNumber: string; description: string; postings: { accountId: string; type: 'DEBIT' | 'CREDIT'; amount: number }[] },
    reason: string
  ): void {
    this.ledgerService
      .reverseJournalEntry(originalEntry, reason)
      .pipe(
        catchError(() => {
          this.notificationService.showError('Reversal Failed', 'Failed to post reversing entry. Please try again.');
          return of(null);
        })
      )
      .subscribe((entry) => {
        if (entry) {
          this.notificationService.showSuccess(
            'Transaction Reversed',
            `Reversing entry #${entry.entryNumber} posted successfully.`
          );
          const reversedPostings = originalEntry.postings.map(p => ({
            accountId: p.accountId,
            type: p.type === 'DEBIT' ? ('CREDIT' as const) : ('DEBIT' as const),
            amount: p.amount,
          }));
          this.recentEntriesSignal.update(entries => [
            {
              id: entry.id || `entry-${Date.now()}`,
              entryNumber: entry.entryNumber,
              description: `[REVERSAL] ${reason ? reason + ' — ' : ''}${originalEntry.description}`,
              createdAt: new Date().toISOString(),
              postings: reversedPostings,
            },
            ...entries,
          ]);
          this.loadAll();
        }
      });
  }
}
