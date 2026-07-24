import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScenarioSimulatorWorkspaceComponent, SimulationParams, SimulationResult } from './scenario-simulator-workspace.component';

@Component({
  selector: 'app-financial-forecasting',
  standalone: true,
  imports: [CommonModule, ScenarioSimulatorWorkspaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="forecasting-container">
      <header class="page-header">
        <h1 class="mat-headline-medium">Financial Forecasting & Simulation</h1>
        <p class="subtitle">Model your future net worth based on multi-year inflation and salary growth scenarios.</p>
      </header>
      
      <app-scenario-simulator-workspace
        [result]="simulationResult()"
        (simulationRun)="onRunSimulation($event)">
      </app-scenario-simulator-workspace>
    </div>
  `,
  styles: [`
    .forecasting-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: var(--mat-sys-spacing-medium, 16px);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      h1 {
        margin: 0;
        color: var(--mat-sys-on-surface);
      }

      .subtitle {
        color: var(--mat-sys-on-surface-variant);
        font-size: 1rem;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class FinancialForecastingComponent {
  
  readonly simulationResult = signal<SimulationResult | null>(null);

  onRunSimulation(params: SimulationParams) {
    // Mock simulation logic using the multi-year inflation math: E_{k, t} = E_{k, 0} * (1 + i_k)^t
    // In a real scenario, this would call a SimulationService hitting the NestJS backend
    
    console.log('Running simulation with params:', params);

    // Dummy logic to simulate a deficit crossover
    // If average inflation is significantly higher than salary growth, we will trigger a warning.
    const avgInflation = (params.inflationRates.groceries + 
                          params.inflationRates.housing + 
                          params.inflationRates.lifestyle + 
                          params.inflationRates.healthcare) / 4;

    let crossoverYear: number | null = null;
    let finalNetWorth = 5000000; // Base starting NW

    if (avgInflation > params.salaryGrowthRate) {
      // Deficit happens around year 5 for this mock calculation
      crossoverYear = Math.min(5, params.yearsToSimulate);
      finalNetWorth = finalNetWorth - (100000 * params.yearsToSimulate);
    } else {
      // Healthy growth
      finalNetWorth = finalNetWorth + (500000 * params.yearsToSimulate * (params.salaryGrowthRate / 100));
    }

    this.simulationResult.set({
      deficitCrossoverYear: crossoverYear,
      finalNetWorth: finalNetWorth
    });
  }
}
