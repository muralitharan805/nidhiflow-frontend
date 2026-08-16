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
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netCashFlow: 0,
  });

  /**
   * Reactive signal for recent activity log.
   */
  private readonly recentActivitySignal = signal<ActivityItem[]>([]);

  /**
   * Public read-only metrics signal.
   */
  public readonly metrics = this.metricsSignal.asReadonly();

  /**
   * Public read-only recent activity signal.
   */
  public readonly recentActivity = this.recentActivitySignal.asReadonly();

  /**
   * Computed signal deriving formatted Net Worth ratio or Debt-Free indicator.
   */
  public readonly assetToLiabilityRatioText = computed(() => {
    const { totalAssets, totalLiabilities } = this.metricsSignal();
    if (totalLiabilities === 0) {
      return totalAssets > 0 ? 'Debt-Free 🎯' : '0.00x';
    }
    return `${(totalAssets / totalLiabilities).toFixed(2)}x`;
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

    this.ledgerService
      .getJournalEntries(5)
      .pipe(catchError(() => of([])))
      .subscribe((entries) => {
        if (entries && entries.length > 0) {
          const activities: ActivityItem[] = entries.map((e) => {
            const isStartingBalance = e.description.toLowerCase().includes('starting') || e.description.toLowerCase().includes('initial');
            const debitPosting = e.postings.find((p) => p.type === 'DEBIT');
            const creditPosting = e.postings.find((p) => p.type === 'CREDIT');

            let categoryName = debitPosting?.accountName || 'General Ledger';
            let sourceAccName = creditPosting?.accountName || 'Cash / Bank';
            let itemType: 'DEBIT' | 'CREDIT' = 'DEBIT';

            if (isStartingBalance) {
              categoryName = 'Starting Capital';
              sourceAccName = creditPosting?.accountName || 'Opening Balance Equity';
              itemType = 'CREDIT';
            }

            return {
              id: e.id,
              description: e.description,
              category: categoryName,
              sourceAccount: sourceAccName,
              amount: debitPosting ? debitPosting.amount : (e.postings[0]?.amount || 0),
              type: itemType,
              date: e.transactionDate || e.createdAt,
            };
          });
          this.recentActivitySignal.set(activities);
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

  /**
   * Resets metrics and activity signals to empty defaults for clean session termination.
   */
  public resetStore(): void {
    this.metricsSignal.set({
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netCashFlow: 0,
    });
    this.recentActivitySignal.set([]);
  }
}
