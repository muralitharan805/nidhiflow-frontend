import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  TrialBalanceSummary,
  BalanceSheetData,
  IncomeStatementData,
} from '../../features/reports/models/reports.model';

/**
 * Enterprise service consuming NestJS backend financial reports endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly apiService = inject(ApiService);

  /**
   * Fetch Trial Balance report from backend.
   *
   * @param asOfDate Optional snapshot target date (ISO format string)
   */
  public getTrialBalance(asOfDate?: string): Observable<TrialBalanceSummary> {
    const params = this.apiService.buildHttpParams({ asOfDate });
    return this.apiService.get<TrialBalanceSummary>('/reports/trial-balance', { params });
  }

  /**
   * Fetch Balance Sheet report from backend.
   *
   * @param asOfDate Optional snapshot target date (ISO format string)
   */
  public getBalanceSheet(asOfDate?: string): Observable<BalanceSheetData> {
    const params = this.apiService.buildHttpParams({ asOfDate });
    return this.apiService.get<BalanceSheetData>('/reports/balance-sheet', { params });
  }

  /**
   * Fetch Income Statement (P&L) report from backend.
   *
   * @param query Optional date range parameters
   */
  public getIncomeStatement(query?: { startDate?: string; endDate?: string }): Observable<IncomeStatementData> {
    const params = this.apiService.buildHttpParams(query || {});
    return this.apiService.get<IncomeStatementData>('/reports/income-statement', { params });
  }
}
