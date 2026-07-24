import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateLoanInput,
  LoanAmortizationDetails,
  PrepaymentInput,
  PrepaymentSimulationResult,
} from '../../features/amortization/models/amortization.model';

/**
 * Service consuming NestJS EMI Loan Amortization endpoints.
 */
@Injectable({ providedIn: 'root' })
export class AmortizationService {
  private readonly apiService = inject(ApiService);

  /**
   * Create a new loan and generate full amortization schedule.
   *
   * @param dto Loan creation payload
   * @returns Observable emitting LoanAmortizationDetails
   */
  public createLoan(dto: CreateLoanInput): Observable<LoanAmortizationDetails> {
    return this.apiService.post<LoanAmortizationDetails>('/amortization/loans', dto);
  }

  /**
   * Simulate a lump-sum prepayment on an existing loan.
   *
   * @param loanId Target loan ID
   * @param dto Prepayment input
   * @returns Observable emitting PrepaymentSimulationResult
   */
  public simulatePrepayment(loanId: string, dto: PrepaymentInput): Observable<PrepaymentSimulationResult> {
    return this.apiService.post<PrepaymentSimulationResult>(`/amortization/loans/${loanId}/prepayment`, dto);
  }
}
