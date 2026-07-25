import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { DashboardMetrics, ActivityItem } from '../models/dashboard.model';
import { LedgerService } from '../../../core/services/ledger.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Signal-driven store service for the Dashboard domain feature integrating NestJS Ledger API.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardStoreService {
  private readonly ledgerService = inject(LedgerService);
  private readonly notificationService = inject(NotificationService);

  /**
   * Reactive signal for financial metrics state.
   */
  private readonly metricsSignal = signal<DashboardMetrics>({
    totalAssets: 485000,
    totalLiabilities: 120000,
    netWorth: 365000,
    monthlyIncome: 45000,
    monthlyExpenses: 185000,
    netCashFlow: -140000,
  });

  /**
   * Reactive signal for recent activity log.
   */
  private readonly recentActivitySignal = signal<ActivityItem[]>([
    {
      id: 'act-1',
      description: 'Monthly Salary Credit',
      category: 'Income',
      amount: 45000,
      type: 'CREDIT',
      date: '2026-07-01',
    },
    {
      id: 'act-2',
      description: 'Home Loan EMI Repayment',
      category: 'Debt Repayment',
      amount: 85000,
      type: 'DEBIT',
      date: '2026-07-05',
    },
    {
      id: 'act-3',
      description: 'Grocery & Supplies',
      category: 'Living Expenses',
      amount: 15000,
      type: 'DEBIT',
      date: '2026-07-10',
    },
    {
      id: 'act-4',
      description: 'SIP Mutual Fund Investment',
      category: 'Investments',
      amount: 25000,
      type: 'DEBIT',
      date: '2026-07-15',
    },
  ]);

  /**
   * Public read-only metrics signal.
   */
  public readonly metrics = this.metricsSignal.asReadonly();

  /**
   * Public read-only recent activity signal.
   */
  public readonly recentActivity = this.recentActivitySignal.asReadonly();

  /**
   * Computed signal deriving Net Worth ratio.
   */
  public readonly assetToLiabilityRatio = computed(() => {
    const { totalAssets, totalLiabilities } = this.metricsSignal();
    if (totalLiabilities === 0) return totalAssets;
    return Number((totalAssets / totalLiabilities).toFixed(2));
  });

  /**
   * Synchronize net worth summary from live NestJS backend API.
   */
  public fetchLiveNetWorth(): void {
    this.ledgerService
      .getNetWorth()
      .pipe(
        catchError((err) => {
          console.warn('[DashboardStoreService] Live API sync offline, using local cache:', err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.metricsSignal.update((current) => ({
            ...current,
            totalAssets: data.totalAssets,
            totalLiabilities: data.totalLiabilities,
            netWorth: data.netWorth,
          }));
        }
      });
  }

  /**
   * Update metrics data manually or via WebSocket updates.
   *
   * @param updated Fresh metrics data
   */
  public updateMetrics(updated: Partial<DashboardMetrics>): void {
    this.metricsSignal.update((current) => ({ ...current, ...updated }));
  }

  /**
   * Record a simplified daily expense transaction and sync dashboard.
   */
  public recordExpense(input: { amount: number; description: string; expenseAccountId: string; assetAccountId: string }): void {
    const dto = {
      entryNumber: `JE-EXP-${Date.now()}`,
      description: input.description,
      postings: [
        { accountId: input.expenseAccountId, type: 'DEBIT' as const, amount: input.amount },
        { accountId: input.assetAccountId, type: 'CREDIT' as const, amount: input.amount },
      ]
    };

    this.ledgerService.postJournalEntry(dto).pipe(
      catchError((err) => {
        this.notificationService.showError('Expense Failed', 'Failed to record expense. Please try again.');
        return of(null);
      })
    ).subscribe((entry) => {
      if (entry) {
        this.notificationService.showSuccess('Expense Recorded', 'Your transaction was successfully posted.');
        this.fetchLiveNetWorth();
        
        // Add to local activity feed optimistically
        this.recentActivitySignal.update(acts => [
          {
            id: `act-${Date.now()}`,
            description: input.description,
            category: 'Daily Spend',
            amount: input.amount,
            type: 'DEBIT',
            date: new Date().toISOString()
          },
          ...acts.slice(0, 4) // Keep only recent 5
        ]);
      }
    });
  }
}
