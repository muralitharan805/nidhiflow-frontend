import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { LedgerService, JournalEntryEntity } from '../../../core/services/ledger.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AccountEntity,
  NetWorthSummary,
  AccountType,
  AccountCategoryMeta,
  CreateJournalEntryInput,
} from '../models/ledger.model';

/**
 * Signal-driven store for the Ledger domain managing accounts and net worth data.
 */
@Injectable({ providedIn: 'root' })
export class LedgerStoreService {
  private readonly ledgerService = inject(LedgerService);
  private readonly notificationService = inject(NotificationService);

  private readonly rawAccountsSignal = signal<AccountEntity[]>([]);
  private readonly categoryMetaSignal = signal<AccountCategoryMeta[]>([]);
  private readonly netWorthSignal = signal<NetWorthSummary>({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly recentEntriesSignal = signal<
    { id: string; entryNumber: string; description: string; transactionDate?: string; createdAt: string; postings: { accountId: string; accountName?: string; accountCode?: string; accountType?: AccountType; type: 'DEBIT' | 'CREDIT'; amount: number }[] }[]
  >([]);

  /**
   * Computed accounts array with live calculated balances from posted journal entries.
   */
  public readonly accounts = computed<AccountEntity[]>(() => {
    const rawAccounts = this.rawAccountsSignal();
    const entries = this.recentEntriesSignal();

    return rawAccounts.map((acc) => {
      let debitSum = 0;
      let creditSum = 0;

      entries.forEach((entry) => {
        if (entry.postings) {
          entry.postings.forEach((p) => {
            if (p.accountId === acc.id) {
              if (p.type === 'DEBIT') debitSum += p.amount;
              if (p.type === 'CREDIT') creditSum += p.amount;
            }
          });
        }
      });

      const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
      const computedBalance = isDebitNormal ? (debitSum - creditSum) : (creditSum - debitSum);
      const balance = (acc.balance && acc.balance !== 0) ? acc.balance : computedBalance;

      return {
        ...acc,
        balance,
      };
    });
  });

  public readonly categoryMeta = this.categoryMetaSignal.asReadonly();
  public readonly netWorth = this.netWorthSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();
  public readonly recentEntries = this.recentEntriesSignal.asReadonly();

  /** Computed accounts grouped by type for tree display. */
  public readonly accountsByType = computed(() => {
    const types: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
    const accs = this.accounts();
    return types.map((type) => ({
      type,
      accounts: accs.filter((a) => a.type === type),
    }));
  });

  /**
   * Fetch all accounts, category metadata, and net worth from the backend API.
   *
   * @param showLoading Whether to toggle global loading spinner (default: true)
   */
  public loadAll(showLoading = true): void {
    if (showLoading) {
      this.isLoadingSignal.set(true);
    }

    this.ledgerService.getCategoryMetadata().pipe(catchError(() => of([]))).subscribe((meta) => {
      if (meta && meta.length > 0) {
        this.categoryMetaSignal.set(meta);
      }
    });

    this.ledgerService.getNetWorth().pipe(catchError(() => of(null))).subscribe((nw) => {
      if (nw) {
        this.netWorthSignal.set({ totalAssets: nw.totalAssets, totalLiabilities: nw.totalLiabilities, netWorth: nw.netWorth });
      }
    });

    this.ledgerService.getJournalEntries(50).pipe(catchError(() => of([]))).subscribe((entries) => {
      if (entries && entries.length > 0) {
        this.recentEntriesSignal.set(entries);
      }
    });

    this.ledgerService.getAccounts({ limit: 100 }).pipe(catchError(() => of(null))).subscribe((res) => {
      if (showLoading) {
        this.isLoadingSignal.set(false);
      }
      if (res) {
        this.rawAccountsSignal.set(res.items as AccountEntity[]);
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
        this.loadAll(false);
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
        this.loadAll(false);
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
          this.loadAll(false);
        }
      });
  }

  /**
   * Resets all store signals to empty/initial state for clean session termination.
   */
  public resetStore(): void {
    this.rawAccountsSignal.set([]);
    this.categoryMetaSignal.set([]);
    this.netWorthSignal.set({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
    this.recentEntriesSignal.set([]);
    this.isLoadingSignal.set(false);
  }
}
