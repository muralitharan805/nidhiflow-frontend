/**
 * Account type classification following The Accounting Equation.
 */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

/**
 * Posting line direction in double-entry bookkeeping.
 */
export type PostingType = 'DEBIT' | 'CREDIT';

/**
 * Chart of Accounts single account head entity.
 */
export interface AccountEntity {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  parentId?: string;
  children?: AccountEntity[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated accounts list response.
 */
export interface AccountsPage {
  items: AccountEntity[];
  total: number;
}

/**
 * Net Worth calculation summary.
 */
export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Single posting line for a journal entry.
 */
export interface JournalPostingLineInput {
  accountId: string;
  type: PostingType;
  amount: number;
}

/**
 * DTO for creating a balanced double-entry journal entry.
 */
export interface CreateJournalEntryInput {
  description: string;
  reference?: string;
  lines: JournalPostingLineInput[];
}

/**
 * Journal entry entity returned by backend.
 */
export interface JournalEntryEntity {
  id: string;
  entryNumber: string;
  description: string;
  reference?: string;
  transactionDate: string;
  createdAt: string;
}
