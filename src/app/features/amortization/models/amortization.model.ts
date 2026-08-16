/**
 * Loan creation input payload.
 */
export interface CreateLoanInput {
  accountId: string;
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  startDate: string;
}

/**
 * Single row in EMI repayment schedule.
 */
export interface AmortizationScheduleItem {
  month: number;
  openingBalance?: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance?: number;
  remainingPrincipal?: number;
  paymentDate: string;
}

/**
 * Full loan amortization response from backend.
 */
export interface LoanAmortizationDetails {
  id?: string;
  accountId?: string;
  principalAmount?: number;
  annualInterestRate?: number;
  tenureMonths?: number;
  monthlyEmi: number;
  startDate?: string;
  payoffDate: string;
  totalInterestPayable: number;
  totalAmountPayable?: number;
  schedule: AmortizationScheduleItem[];
  loan?: {
    id: string;
    accountId: string;
    principalAmount: number;
    annualInterestRate: number;
    tenureMonths: number;
    monthlyEmi: number;
    startDate: string;
    payoffDate: string;
  };
}

/**
 * Prepayment simulation result.
 */
export interface PrepaymentSimulationResult {
  originalPayoffDate: string;
  newPayoffDate: string;
  monthsSaved: number;
  interestSaved: number;
  updatedSchedule: AmortizationScheduleItem[];
}

/**
 * Prepayment input DTO.
 */
export interface PrepaymentInput {
  prepaymentAmount: number;
  prepaymentDate: string;
}
