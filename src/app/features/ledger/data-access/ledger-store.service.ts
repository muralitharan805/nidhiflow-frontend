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

  public readonly accounts = this.accountsSignal.asReadonly();
  public readonly netWorth = this.netWorthSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();

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
    this.ledgerService.postJournalEntry({
      description: input.description,
      reference: input.reference,
      lines: input.lines,
    }).pipe(
      catchError(() => {
        this.notificationService.showError('Entry Failed', 'Unbalanced entry rejected. Ensure Σ Debits = Σ Credits.');
        return of(null);
      })
    ).subscribe((entry) => {
      if (entry) {
        this.notificationService.showSuccess('Entry Posted', `Journal entry #${(entry as JournalEntryEntity).entryNumber} recorded.`);
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
}
