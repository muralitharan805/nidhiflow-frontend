import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { DashboardMetrics, ActivityItem } from '../models/dashboard.model';
import { LedgerService } from '../../../core/services/ledger.service';

/**
 * Signal-driven store service for the Dashboard domain feature integrating NestJS Ledger API.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardStoreService {
  private readonly ledgerService = inject(LedgerService);

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
}
