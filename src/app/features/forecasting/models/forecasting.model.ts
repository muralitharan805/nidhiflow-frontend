/**
 * Single category expense with annual inflation rate for simulation.
 */
export interface CategoryInflationInput {
  category: string;
  baseAnnualExpense: number;
  inflationRate: number;
}

/**
 * Simulation request payload matching NestJS SimulateScenarioDto.
 */
export interface SimulateScenarioInput {
  scenarioName: string;
  initialAnnualIncome: number;
  incomeGrowthRate: number;
  annualEmiObligation?: number;
  projectionYears?: number;
  categoryInflations: CategoryInflationInput[];
}

/**
 * Single year projection item from forecasting simulation.
 */
export interface YearlyProjectionItem {
  year: number;
  projectedIncome: number;
  projectedExpenses: number;
  annualEmiObligation: number;
  totalOutflow: number;
  netCashflow: number;
  projectedNetWorth: number;
  isDeficitYear: boolean;
}

/**
 * Full simulation result from NestJS forecasting endpoint.
 */
export interface SimulationResult {
  scenarioName: string;
  projectionYears: number;
  deficitCrossoverYear: number | null;
  hasDeficitCrossover: boolean;
  initialNetWorth: number;
  projectedFinalNetWorth: number;
  yearlyProjections: YearlyProjectionItem[];
}
