import {
  Component, ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ForecastingService } from '../../../core/services/forecasting.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SimulationResult, CategoryInflationInput } from '../models/forecasting.model';

/**
 * Interactive "What-If" financial scenario simulator workspace.
 */
@Component({
  selector: 'app-forecasting-page',
  imports: [ReactiveFormsModule, CurrencyPipe, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="forecasting-page">
      <header class="page-header">
        <h2 class="page-title">📈 Financial Forecasting Simulator</h2>
        <p class="page-subtitle">
          Multi-year What-If scenario engine · Eₖ,ₜ = Eₖ,₀ × (1 + iₖ)ᵗ · Deficit Crossover Detection
        </p>
      </header>

      <div class="simulator-layout">
        <!-- Input Panel -->
        <section class="panel inputs-panel">
          <h3 class="panel-title">⚙️ Scenario Parameters</h3>

          <form class="scenario-form" [formGroup]="scenarioForm" (ngSubmit)="onRunSimulation()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Scenario Name</mat-label>
              <input matInput type="text" formControlName="scenarioName" placeholder="e.g. Conservative 5-Year Plan" />
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Annual Income (₹)</mat-label>
                <input matInput type="number" formControlName="initialAnnualIncome" placeholder="1200000" />
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Income Growth Rate (% p.a.)</mat-label>
                <input matInput type="number" formControlName="incomeGrowthRate" placeholder="5" step="0.5" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Projection Years</mat-label>
                <input matInput type="number" formControlName="projectionYears" placeholder="5" min="1" max="30" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Annual EMI Obligation (₹)</mat-label>
                <input matInput type="number" formControlName="annualEmiObligation" placeholder="0 (auto-fetch)" />
              </mat-form-field>
            </div>

            <!-- Category Inflations -->
            <div class="categories-section">
              <div class="categories-header">
                <span class="form-label">Expense Categories & Inflation Rates</span>
                <button mat-stroked-button color="primary" type="button" (click)="addCategory()">+ Add Category</button>
              </div>

              <div formArrayName="categoryInflations" class="categories-list">
                @for (cat of categoryArray.controls; track $index) {
                  <div [formGroupName]="$index" class="category-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Category</mat-label>
                      <input matInput type="text" formControlName="category" placeholder="e.g. Groceries" />
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Base Annual ₹</mat-label>
                      <input matInput type="number" formControlName="baseAnnualExpense" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Inflation %</mat-label>
                      <input matInput type="number" formControlName="inflationRate" placeholder="8" step="0.5" />
                    </mat-form-field>
                    
                    <div class="remove-action">
                      @if (categoryArray.length > 1) {
                        <button mat-icon-button color="warn" type="button" (click)="removeCategory($index)" aria-label="Remove category">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <button mat-flat-button color="primary" type="submit" [disabled]="scenarioForm.invalid || isLoading()">
              @if (isLoading()) { ⏳ Running Simulation... } @else { 🚀 Run Simulation }
            </button>
          </form>
        </section>

        <!-- Results Panel -->
        <section class="panel results-panel">
          <h3 class="panel-title">📊 Simulation Results</h3>

          @if (!simulationResult()) {
            <div class="empty-results">
              <div class="empty-icon">🔮</div>
              <p>Configure scenario parameters and click <strong>Run Simulation</strong> to see multi-year financial projections.</p>
            </div>
          } @else {
            <!-- Deficit Crossover Warning -->
            @if (simulationResult()!.hasDeficitCrossover) {
              <div class="deficit-banner" role="alert">
                <span class="deficit-icon">⚠️</span>
                <div>
                  <strong>Deficit Crossover Detected!</strong>
                  <p>Annual expenses + EMI will exceed income starting <strong>Year {{ simulationResult()!.deficitCrossoverYear }}</strong>. Net worth begins declining.</p>
                </div>
              </div>
            } @else {
              <div class="surplus-banner" role="status">
                <span>✅</span>
                <strong>Scenario Healthy — No deficit crossover detected over {{ simulationResult()!.projectionYears }} years.</strong>
              </div>
            }

            <!-- Summary Metrics -->
            <div class="summary-metrics">
              <div class="summary-metric">
                <span class="sm-label">Initial Net Worth</span>
                <span class="sm-value">{{ simulationResult()!.initialNetWorth | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-metric">
                <span class="sm-label">Projected Net Worth (Year {{ simulationResult()!.projectionYears }})</span>
                <span class="sm-value" [class.negative-nw]="simulationResult()!.projectedFinalNetWorth < 0">
                  {{ simulationResult()!.projectedFinalNetWorth | currency:'INR':'symbol':'1.0-0' }}
                </span>
              </div>
            </div>

            <!-- Year-by-Year Projection Table -->
            <div class="projection-table-wrap mat-elevation-z1">
              <table mat-table [dataSource]="simulationResult()!.yearlyProjections" aria-label="Multi-year financial projection">
                
                <!-- Year Column -->
                <ng-container matColumnDef="year">
                  <th mat-header-cell *matHeaderCellDef> Year </th>
                  <td mat-cell *matCellDef="let row" [class.deficit-row]="row.isDeficitYear"> 
                    <span class="year-badge" [class.year-deficit]="row.isDeficitYear">
                      Y{{ row.year }} @if (row.isDeficitYear) { ⚠️ }
                    </span>
                  </td>
                </ng-container>

                <!-- Income Column -->
                <ng-container matColumnDef="income">
                  <th mat-header-cell *matHeaderCellDef class="text-right"> Income </th>
                  <td mat-cell *matCellDef="let row" class="text-right income-col" [class.deficit-row]="row.isDeficitYear"> 
                    {{ row.projectedIncome | currency:'INR':'symbol':'1.0-0' }} 
                  </td>
                </ng-container>

                <!-- Expenses Column -->
                <ng-container matColumnDef="expenses">
                  <th mat-header-cell *matHeaderCellDef class="text-right"> Expenses </th>
                  <td mat-cell *matCellDef="let row" class="text-right" [class.deficit-row]="row.isDeficitYear"> 
                    {{ row.projectedExpenses | currency:'INR':'symbol':'1.0-0' }} 
                  </td>
                </ng-container>

                <!-- EMI Column -->
                <ng-container matColumnDef="emi">
                  <th mat-header-cell *matHeaderCellDef class="text-right"> EMI </th>
                  <td mat-cell *matCellDef="let row" class="text-right" [class.deficit-row]="row.isDeficitYear"> 
                    {{ row.annualEmiObligation | currency:'INR':'symbol':'1.0-0' }} 
                  </td>
                </ng-container>

                <!-- Cashflow Column -->
                <ng-container matColumnDef="cashflow">
                  <th mat-header-cell *matHeaderCellDef class="text-right"> Net Cashflow </th>
                  <td mat-cell *matCellDef="let row" class="text-right" [class.deficit-row]="row.isDeficitYear"
                      [class.cashflow-positive]="row.netCashflow >= 0" [class.cashflow-negative]="row.netCashflow < 0"> 
                    {{ row.netCashflow | currency:'INR':'symbol':'1.0-0' }} 
                  </td>
                </ng-container>

                <!-- Net Worth Column -->
                <ng-container matColumnDef="netWorth">
                  <th mat-header-cell *matHeaderCellDef class="text-right"> Net Worth </th>
                  <td mat-cell *matCellDef="let row" class="text-right" [class.deficit-row]="row.isDeficitYear"
                      [class.nw-negative]="row.projectedNetWorth < 0"> 
                    {{ row.projectedNetWorth | currency:'INR':'symbol':'1.0-0' }} 
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .forecasting-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-title { font-size: 1.4rem; font-weight: 700; margin: 0; }
    .page-subtitle { font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); margin: 0.25rem 0 0; }

    .simulator-layout {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 1.25rem;
      align-items: start;

      @media (max-width: 1000px) { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .panel-title { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .form-label { font-size: 0.8rem; font-weight: 600; color: var(--mat-sys-on-surface-variant); }

    .full-width { width: 100%; }

    .categories-section { display: flex; flex-direction: column; gap: 0.5rem; }

    .categories-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .categories-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .category-row {
      display: grid;
      grid-template-columns: 1fr 120px 100px 48px;
      gap: 0.75rem;
      align-items: center;
    }

    .remove-action {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 22px; /* align with input field without hint */
    }

    /* Results */
    .empty-results {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--mat-sys-outline);
    }

    .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }

    .deficit-banner {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(186, 26, 26, 0.08);
      border: 1px solid var(--mat-sys-error);
      border-radius: 8px;
      color: var(--mat-sys-error);
      margin-bottom: 1rem;

      .deficit-icon { font-size: 1.5rem; }
      p { margin: 0.25rem 0 0; font-size: 0.875rem; }
    }

    .surplus-banner {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(46, 125, 50, 0.08);
      border: 1px solid var(--mat-sys-success);
      border-radius: 8px;
      color: var(--mat-sys-success);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .summary-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .summary-metric {
      padding: 0.75rem;
      background: var(--mat-sys-surface-container-low);
      border-radius: 8px;
    }

    .sm-label { font-size: 0.75rem; color: var(--mat-sys-outline); display: block; margin-bottom: 0.25rem; }
    .sm-value { font-size: 1.1rem; font-weight: 700; }
    .negative-nw { color: var(--mat-sys-error); }

    .projection-table-wrap { overflow-x: auto; border-radius: 8px; }

    table {
      width: 100%;
    }

    .text-right { text-align: right; }

    .deficit-row {
      background: rgba(186, 26, 26, 0.04);
    }

    .year-badge {
      display: inline-block;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
      background: var(--mat-sys-surface-container);
    }

    .year-deficit { background: rgba(186, 26, 26, 0.15); color: var(--mat-sys-error); }

    .income-col { color: var(--mat-sys-success); }
    .cashflow-positive { color: var(--mat-sys-success); font-weight: 600; }
    .cashflow-negative { color: var(--mat-sys-error); font-weight: 600; }
    .nw-negative { color: var(--mat-sys-error); }
  `]
})
export class ForecastingPageComponent {
  private readonly forecastingService = inject(ForecastingService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly simulationResult = signal<SimulationResult | null>(null);

  protected readonly displayedColumns: string[] = ['year', 'income', 'expenses', 'emi', 'cashflow', 'netWorth'];

  protected readonly scenarioForm = this.fb.group({
    scenarioName: ['5-Year Financial Projection', Validators.required],
    initialAnnualIncome: [1200000, [Validators.required, Validators.min(1)]],
    incomeGrowthRate: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
    projectionYears: [5, [Validators.min(1), Validators.max(30)]],
    annualEmiObligation: [null as number | null],
    categoryInflations: this.fb.array([
      this.buildCategory('Groceries & Food', 120000, 8),
      this.buildCategory('Rent / Housing', 300000, 6),
      this.buildCategory('Transportation', 60000, 5),
      this.buildCategory('Healthcare', 40000, 10),
    ]),
  });

  get categoryArray(): FormArray {
    return this.scenarioForm.get('categoryInflations') as FormArray;
  }

  protected addCategory(): void {
    this.categoryArray.push(this.buildCategory('', 0, 0));
  }

  protected removeCategory(index: number): void {
    if (this.categoryArray.length > 1) {
      this.categoryArray.removeAt(index);
    }
  }

  protected onRunSimulation(): void {
    if (this.scenarioForm.invalid) return;
    this.isLoading.set(true);

    const raw = this.scenarioForm.getRawValue();
    const categoryInflations: CategoryInflationInput[] = (
      raw.categoryInflations as { category: string; baseAnnualExpense: number; inflationRate: number }[]
    ).map((c) => ({
      category: c.category,
      baseAnnualExpense: Number(c.baseAnnualExpense),
      inflationRate: Number(c.inflationRate) / 100,
    }));

    this.forecastingService.simulateScenario({
      scenarioName: raw.scenarioName!,
      initialAnnualIncome: raw.initialAnnualIncome!,
      incomeGrowthRate: (raw.incomeGrowthRate ?? 0) / 100,
      projectionYears: raw.projectionYears ?? 5,
      annualEmiObligation: raw.annualEmiObligation ?? undefined,
      categoryInflations,
    }).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        this.simulationResult.set(result);
        if (result.hasDeficitCrossover) {
          this.notificationService.showWarning('Deficit Alert', `Cashflow turns negative in Year ${result.deficitCrossoverYear}.`);
        } else {
          this.notificationService.showSuccess('Simulation Complete', 'No deficit crossover detected.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Simulation Failed', 'Could not run simulation. Check your inputs.');
      },
    });
  }

  private buildCategory(category: string, baseAnnualExpense: number, inflationRate: number) {
    return this.fb.group({
      category: [category, Validators.required],
      baseAnnualExpense: [baseAnnualExpense, [Validators.required, Validators.min(0)]],
      inflationRate: [inflationRate, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }
}
