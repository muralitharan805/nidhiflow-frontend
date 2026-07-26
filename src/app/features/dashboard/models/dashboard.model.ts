/**
 * Financial metrics summary overview representation.
 */
export interface DashboardMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
}

/**
 * Recent ledger activity item entry.
 */
export interface ActivityItem {
  id: string;
  description: string;
  category: string;
  sourceAccount?: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  date: string;
}
