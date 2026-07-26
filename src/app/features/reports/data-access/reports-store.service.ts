import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ReportsService } from '../../../core/services/reports.service';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import { AccountEntity, AccountType } from '../../ledger/models/ledger.model';
import {
  TrialBalanceSummary,
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceRow,
} from '../models/reports.model';

/**
 * Signal-driven store managing real-time & backend-fetched financial statement reports.
 */
@Injectable({ providedIn: 'root' })
export class ReportsStoreService {
  private readonly reportsService = inject(ReportsService);
  private readonly ledgerStore = inject(LedgerStoreService);

  private readonly trialBalanceBackendSignal = signal<unknown | null>(null);
  private readonly balanceSheetBackendSignal = signal<unknown | null>(null);
  private readonly incomeStatementBackendSignal = signal<unknown | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Active filter state signals
  public readonly selectedAsOfDate = signal<string>(new Date().toISOString().split('T')[0]);
  public readonly selectedStartDate = signal<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  );
  public readonly selectedEndDate = signal<string>(new Date().toISOString().split('T')[0]);

  /**
   * Computed Trial Balance: Merges backend report data with Chart of Accounts metadata.
   */
  public readonly trialBalance = computed<TrialBalanceSummary>(() => {
    const allAccounts = this.ledgerStore.accounts();
    const rawBackend = this.trialBalanceBackendSignal() as any;

    if (rawBackend && (rawBackend.rows || Array.isArray(rawBackend))) {
      const rawRows: any[] = rawBackend.rows || (Array.isArray(rawBackend) ? rawBackend : []);

      const enrichedRows: TrialBalanceRow[] = allAccounts.map((acc) => {
        const matchingBackendRow = rawRows.find(
          (r) => r.accountId === acc.id || r.code === acc.code || r.accountCode === acc.code || r.name === acc.name
        );

        let debit = 0;
        let credit = 0;

        if (matchingBackendRow) {
          debit = Number(matchingBackendRow.debit || 0);
          credit = Number(matchingBackendRow.credit || 0);
          if (!debit && !credit && matchingBackendRow.balance !== undefined) {
            const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
            const bal = Number(matchingBackendRow.balance);
            debit = isDebitNormal ? Math.max(0, bal) : Math.max(0, -bal);
            credit = !isDebitNormal ? Math.max(0, bal) : Math.max(0, -bal);
          }
        }

        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          debit,
          credit,
        };
      });

      const totalDebit = rawBackend.totalDebit !== undefined ? Number(rawBackend.totalDebit) : enrichedRows.reduce((sum, r) => sum + r.debit, 0);
      const totalCredit = rawBackend.totalCredit !== undefined ? Number(rawBackend.totalCredit) : enrichedRows.reduce((sum, r) => sum + r.credit, 0);

      return {
        rows: enrichedRows,
        totalDebit,
        totalCredit,
        isBalanced: rawBackend.isBalanced !== undefined ? Boolean(rawBackend.isBalanced) : Math.abs(totalDebit - totalCredit) < 0.01,
      };
    }

    // Dynamic calculation fallback (when backend has not responded yet)
    const rows: TrialBalanceRow[] = allAccounts.map((acc) => {
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
   * Computed Balance Sheet: Enriches backend response with all account heads.
   */
  public readonly balanceSheet = computed<BalanceSheetData>(() => {
    const allAccounts = this.ledgerStore.accounts();
    const rawBackend = this.balanceSheetBackendSignal() as any;
    const incomeStmt = this.incomeStatement();

    const mapSectionItems = (type: AccountType, backendItems?: any[]) => {
      const categoryAccounts = allAccounts.filter((a) => a.type === type);
      return categoryAccounts.map((acc) => {
        const matched = backendItems?.find(
          (b) => b.code === acc.code || b.accountCode === acc.code || b.name === acc.name || b.accountId === acc.id
        );
        const amount = rawBackend ? (matched ? Number(matched.amount ?? matched.balance ?? 0) : 0) : (acc.balance || 0);
        return {
          code: acc.code,
          name: acc.name,
          amount,
        };
      });
    };

    const assetItems = mapSectionItems('ASSET', rawBackend?.assets?.items);
    const liabilityItems = mapSectionItems('LIABILITY', rawBackend?.liabilities?.items);
    const equityItems = mapSectionItems('EQUITY', rawBackend?.equity?.items);

    if (incomeStmt.netIncome !== 0) {
      equityItems.push({
        code: '3020',
        name: incomeStmt.netIncome >= 0 ? 'Retained Net Earnings (Current P&L Profit)' : 'Retained Net Deficit (Current P&L Loss)',
        amount: incomeStmt.netIncome,
      });
    }

    const totalAssets = rawBackend?.totalAssets !== undefined ? Number(rawBackend.totalAssets) : assetItems.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilities = liabilityItems.reduce((sum, i) => sum + i.amount, 0);
    const totalEquity = equityItems.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilitiesAndEquity = rawBackend?.totalLiabilitiesAndEquity !== undefined ? Number(rawBackend.totalLiabilitiesAndEquity) : totalLiabilities + totalEquity;

    return {
      assets: { title: 'Assets', items: assetItems, total: totalAssets },
      liabilities: { title: 'Liabilities', items: liabilityItems, total: totalLiabilities },
      equity: { title: 'Equity', items: equityItems, total: totalEquity },
      totalAssets,
      totalLiabilitiesAndEquity,
      isBalanced: rawBackend?.isBalanced !== undefined ? Boolean(rawBackend.isBalanced) : Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  });

  /**
   * Computed Income Statement: Enriches backend response with all P&L account heads.
   */
  public readonly incomeStatement = computed<IncomeStatementData>(() => {
    const allAccounts = this.ledgerStore.accounts();
    const rawBackend = this.incomeStatementBackendSignal() as any;

    const mapSectionItems = (type: AccountType, backendItems?: any[]) => {
      const categoryAccounts = allAccounts.filter((a) => a.type === type);
      return categoryAccounts.map((acc) => {
        const matched = backendItems?.find(
          (b) => b.code === acc.code || b.accountCode === acc.code || b.name === acc.name || b.accountId === acc.id
        );
        const amount = rawBackend ? (matched ? Number(matched.amount ?? matched.balance ?? 0) : 0) : (acc.balance || 0);
        return {
          code: acc.code,
          name: acc.name,
          amount,
        };
      });
    };

    const revenues = mapSectionItems('INCOME', rawBackend?.revenues);
    const expenses = mapSectionItems('EXPENSE', rawBackend?.expenses);

    const totalRevenue = rawBackend?.totalRevenue !== undefined ? Number(rawBackend.totalRevenue) : revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = rawBackend?.totalExpenses !== undefined ? Number(rawBackend.totalExpenses) : expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = rawBackend?.netIncome !== undefined ? Number(rawBackend.netIncome) : totalRevenue - totalExpenses;

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
    };
  });

  public readonly isLoading = this.isLoadingSignal.asReadonly();

  /**
   * Fetch all 3 financial statements directly from NestJS backend `/reports` API endpoints with exact date parameters.
   *
   * @param params Optional date filters (asOfDate for Snapshot, startDate & endDate for P&L)
   */
  public loadReports(params?: { asOfDate?: string; startDate?: string; endDate?: string }): void {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const firstDayMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const asOfDate = params?.asOfDate || this.selectedAsOfDate() || todayStr;
    const startDate = params?.startDate || this.selectedStartDate() || firstDayMonthStr;
    const endDate = params?.endDate || this.selectedEndDate() || todayStr;

    // Save active filter state
    this.selectedAsOfDate.set(asOfDate);
    this.selectedStartDate.set(startDate);
    this.selectedEndDate.set(endDate);

    this.isLoadingSignal.set(true);

    this.reportsService
      .getTrialBalance(asOfDate)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res) this.trialBalanceBackendSignal.set(res);
      });

    this.reportsService
      .getBalanceSheet(asOfDate)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res) this.balanceSheetBackendSignal.set(res);
      });

    this.reportsService
      .getIncomeStatement({ startDate, endDate })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        this.isLoadingSignal.set(false);
        if (res) this.incomeStatementBackendSignal.set(res);
      });
  }
}
