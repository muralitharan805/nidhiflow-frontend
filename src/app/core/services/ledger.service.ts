import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Account Head classification type.
 */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

/**
 * Single Account Head entity.
 */
export interface AccountEntity {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new account head.
 */
export interface CreateAccountDto {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  parentId?: string;
}

/**
 * Net Worth summary payload from NestJS backend.
 */
export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Posting line for double-entry journal.
 */
export interface JournalPostingLineDto {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

/**
 * DTO for creating balanced journal entries expected by NestJS backend API.
 */
export interface CreateJournalEntryDto {
  entryNumber?: string;
  description: string;
  transactionDate?: string;
  postings: JournalPostingLineDto[];
}

/**
 * Journal Entry response item.
 */
export interface JournalEntryEntity {
  id: string;
  entryNumber: string;
  description: string;
  reference?: string;
  postingDate: string;
  createdAt: string;
}

/**
 * Enterprise service consuming NestJS Ledger & Net Worth endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  private readonly apiService = inject(ApiService);

  /**
   * Calculate current Net Worth summary from double-entry ledger.
   *
   * @returns Observable emitting NetWorthSummary
   */
  public getNetWorth(): Observable<NetWorthSummary> {
    return this.apiService.get<NetWorthSummary>('/ledger/net-worth');
  }

  /**
   * Fetch Chart of Accounts listing.
   *
   * @param query Optional filtering and pagination params
   * @returns Observable emitting accounts array and total count
   */
  public getAccounts(query?: { type?: AccountType; search?: string; page?: number; limit?: number }): Observable<{ items: AccountEntity[]; total: number }> {
    const params = this.apiService.buildHttpParams(query || {});
    return this.apiService.get<{ items: AccountEntity[]; total: number }>('/ledger/accounts', { params });
  }

  /**
   * Post a balanced double-entry journal transaction.
   *
   * @param dto Journal entry creation payload
   * @returns Observable emitting created JournalEntryEntity
   */
  public postJournalEntry(dto: CreateJournalEntryDto): Observable<JournalEntryEntity> {
    const payload = {
      ...dto,
      entryNumber: dto.entryNumber || `JE-${Date.now()}`,
    };
    return this.apiService.post<JournalEntryEntity>('/ledger/entries', payload);
  }

  /**
   * Reverse an existing journal entry by posting an opposite reversing transaction.
   *
   * @param originalEntry Target journal entry to reverse
   * @param reason Audit rationale for reversal
   * @returns Observable emitting created reversing JournalEntryEntity
   */
  public reverseJournalEntry(
    originalEntry: { entryNumber: string; description: string; postings: JournalPostingLineDto[] },
    reason: string
  ): Observable<JournalEntryEntity> {
    const reversedPostings: JournalPostingLineDto[] = originalEntry.postings.map((p) => ({
      accountId: p.accountId,
      type: p.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amount: p.amount,
    }));

    const dto: CreateJournalEntryDto = {
      entryNumber: `REV-${originalEntry.entryNumber}-${Math.floor(100 + Math.random() * 900)}`,
      description: `[REVERSAL] ${reason ? reason + ' — ' : ''}${originalEntry.description}`,
      postings: reversedPostings,
    };

    return this.postJournalEntry(dto);
  }

  /**
   * Create a new Account Head in the Chart of Accounts.
   *
   * @param dto Account creation payload
   * @returns Observable emitting created AccountEntity
   */
  public createAccount(dto: CreateAccountDto): Observable<AccountEntity> {
    return this.apiService.post<AccountEntity>('/ledger/accounts', dto);
  }
}
