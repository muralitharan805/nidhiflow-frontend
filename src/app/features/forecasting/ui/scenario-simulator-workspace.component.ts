import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface SimulationParams {
  salaryGrowthRate: number;
  inflationRates: {
    groceries: number;
    housing: number;
    lifestyle: number;
    healthcare: number;
  };
  yearsToSimulate: number;
}

export interface SimulationResult {
  deficitCrossoverYear: number | null;
  finalNetWorth: number;
}

@Component({
  selector: 'app-scenario-simulator-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="simulator-workspace">
      <!-- Warning Banner for Deficit Crossover -->
      @if (crossoverYear()) {
        <div class="warning-banner" role="alert">
          <mat-icon>warning</mat-icon>
          <div class="banner-content">
            <strong>Deficit Warning:</strong> Based on these parameters, your expenses and loan obligations will exceed your income in year <strong>{{ crossoverYear() }}</strong>.
          </div>
        </div>
      }

      <div class="workspace-grid">
        <!-- Configuration Panel -->
        <mat-card class="config-panel">
          <mat-card-header>
            <mat-icon mat-card-avatar>tune</mat-icon>
            <mat-card-title>Simulation Parameters</mat-card-title>
            <mat-card-subtitle>Adjust inflation and growth rates</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="configForm" (ngSubmit)="onRunSimulation()" class="config-form">
              
              <div class="form-section">
                <h3 class="section-title">Income Growth</h3>
                <div class="slider-container">
                  <label>Annual Salary Growth ({{ salaryGrowthControl.value }}%)</label>
                  <mat-slider min="0" max="20" step="1" discrete>
                    <input matSliderThumb formControlName="salaryGrowthRate">
                  </mat-slider>
                </div>
              </div>

              <div class="form-section" formGroupName="inflationRates">
                <h3 class="section-title">Category Inflation Rates (%)</h3>
                <div class="inflation-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Groceries</mat-label>
                    <input matInput type="number" formControlName="groceries" min="0" max="30">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Housing / Rent</mat-label>
                    <input matInput type="number" formControlName="housing" min="0" max="30">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Lifestyle</mat-label>
                    <input matInput type="number" formControlName="lifestyle" min="0" max="30">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Healthcare</mat-label>
                    <input matInput type="number" formControlName="healthcare" min="0" max="30">
                  </mat-form-field>
                </div>
              </div>

              <div class="form-section">
                <h3 class="section-title">Timeline</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Years to Simulate</mat-label>
                  <input matInput type="number" formControlName="yearsToSimulate" min="1" max="50">
                </mat-form-field>
              </div>

              <button mat-flat-button color="primary" type="submit" class="submit-btn" [disabled]="configForm.invalid">
                <mat-icon>play_arrow</mat-icon> Run Simulation
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Summary Panel -->
        <mat-card class="summary-panel">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">assessment</mat-icon>
            <mat-card-title>Simulation Results</mat-card-title>
          </mat-card-header>
          <mat-card-content class="summary-content">
            <div class="result-metric">
              <span class="result-label">Projected Final Net Worth (Year {{ configForm.value.yearsToSimulate }})</span>
              <span class="result-value">{{ (result()?.finalNetWorth | currency:'INR':'symbol':'1.0-0') || '---' }}</span>
            </div>
            
            <div class="illustration-placeholder">
               <mat-icon class="large-icon">query_stats</mat-icon>
               <p>Adjust parameters and run the simulation to see detailed forecasting charts.</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .simulator-workspace {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .warning-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      border-radius: 8px;
      border-left: 4px solid var(--mat-sys-error);

      mat-icon {
        color: var(--mat-sys-error);
      }
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;

      @media (min-width: 992px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    .config-panel, .summary-panel {
      background-color: var(--mat-sys-surface-container);
      border-radius: 12px;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
      }
      
      mat-slider {
        margin: 0 -8px;
      }
    }

    .inflation-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .submit-btn {
      align-self: flex-start;
      margin-top: 1rem;
      padding: 0 2rem;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .result-metric {
      background: var(--mat-sys-surface-container-high);
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-left: 4px solid var(--mat-sys-primary);
    }

    .result-label {
      font-size: 0.875rem;
      color: var(--mat-sys-outline);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .result-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .illustration-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 250px;
      color: var(--mat-sys-outline);
      text-align: center;
      padding: 2rem;
      
      .large-icon {
        font-size: 4rem;
        height: 4rem;
        width: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }
    }
  `]
})
export class ScenarioSimulatorWorkspaceComponent {
  readonly result = input<SimulationResult | null>(null);
  readonly simulationRun = output<SimulationParams>();

  readonly crossoverYear = computed(() => this.result()?.deficitCrossoverYear);

  readonly configForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      salaryGrowthRate: [5, [Validators.required, Validators.min(0)]],
      inflationRates: this.fb.group({
        groceries: [8, [Validators.required, Validators.min(0)]],
        housing: [5, [Validators.required, Validators.min(0)]],
        lifestyle: [10, [Validators.required, Validators.min(0)]],
        healthcare: [12, [Validators.required, Validators.min(0)]],
      }),
      yearsToSimulate: [10, [Validators.required, Validators.min(1), Validators.max(50)]]
    });
  }

  get salaryGrowthControl() {
    return this.configForm.get('salaryGrowthRate')!;
  }

  onRunSimulation() {
    if (this.configForm.valid) {
      this.simulationRun.emit(this.configForm.value as SimulationParams);
    }
  }
}
