import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SimulateScenarioInput, SimulationResult } from '../../features/forecasting/models/forecasting.model';

/**
 * Service consuming NestJS Financial Forecasting & What-If Simulation endpoints.
 */
@Injectable({ providedIn: 'root' })
export class ForecastingService {
  private readonly apiService = inject(ApiService);

  /**
   * Run a transient multi-year inflation and cashflow simulation scenario.
   *
   * @param dto Simulation parameters including income, growth rate, and category inflations
   * @returns Observable emitting SimulationResult with year-by-year projections
   */
  public simulateScenario(dto: SimulateScenarioInput): Observable<SimulationResult> {
    return this.apiService.post<SimulationResult>('/forecasting/simulate', dto);
  }
}
