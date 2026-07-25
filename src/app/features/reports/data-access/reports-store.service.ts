import { Injectable, computed, inject } from '@angular/core';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import {
  TrialBalanceSummary,
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceRow,
} from '../models/reports.model';

/**
 * Signal-driven store service generating double-entry financial statements in real time.
 */
@Injectable({ providedIn: 'root' })
export class ReportsStoreService {
  private readonly ledgerStore = inject(LedgerStoreService);

  /**
   * Computed Trial Balance: Listing all accounts with Debit vs Credit balance.
   * Asserts \sum Debits = \sum Credits.
   */
  public readonly trialBalance = computed<TrialBalanceSummary>(() => {
    const accounts = this.ledgerStore.accounts();
    const rows: TrialBalanceRow[] = accounts.map((acc) => {
      const balance = acc.balance || 0;
      const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: isDebitNormal ? Math.max(0, balance) : Math.max(0, -balance),
        credit: !isDebitNormal ? Math.max(0, balance) : Math.max(0, -balance),
      };
    });

    const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  });

  /**
   * Computed Balance Sheet: Assets = Liabilities + Equity
   */
  public readonly balanceSheet = computed<BalanceSheetData>(() => {
    const accounts = this.ledgerStore.accounts();

    const assetItems = accounts
      .filter((a) => a.type === 'ASSET')
      .map((a) => ({ code: a.code, name: a.name, amount: a.balance || 0 }));

    const liabilityItems = accounts
      .filter((a) => a.type === 'LIABILITY')
      .map((a) => ({ code: a.code, name: a.name, amount: a.balance || 0 }));

    const equityItems = accounts
      .filter((a) => a.type === 'EQUITY')
      .map((a) => ({ code: a.code, name: a.name, amount: a.balance || 0 }));

    const totalAssets = assetItems.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilities = liabilityItems.reduce((sum, i) => sum + i.amount, 0);
    const totalEquity = equityItems.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      assets: { title: 'Assets', items: assetItems, total: totalAssets },
      liabilities: { title: 'Liabilities', items: liabilityItems, total: totalLiabilities },
      equity: { title: 'Equity', items: equityItems, total: totalEquity },
      totalAssets,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  });

  /**
   * Computed Income Statement (Profit & Loss): Net Income = Revenue - Expenses
   */
  public readonly incomeStatement = computed<IncomeStatementData>(() => {
    const accounts = this.ledgerStore.accounts();

    const revenues = accounts
      .filter((a) => a.type === 'INCOME')
      .map((a) => ({ code: a.code, name: a.name, amount: a.balance || 0 }));

    const expenses = accounts
      .filter((a) => a.type === 'EXPENSE')
      .map((a) => ({ code: a.code, name: a.name, amount: a.balance || 0 }));

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
    };
  });
}
