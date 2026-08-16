import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { AmortizationService } from '../../../core/services/amortization.service';
import { LedgerStoreService } from '../../ledger/data-access/ledger-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoanAmortizationDetails } from '../models/amortization.model';

/**
 * Amortization container page with loan creation form and EMI payoff countdown display.
 */
@Component({
  selector: 'app-amortization-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amortization-page">
      <header class="page-header">
        <h2 class="page-title">EMI Loan Amortization</h2>
        <p class="page-subtitle">
          Monthly EMI = P × r(1+r)ⁿ / ((1+r)ⁿ − 1) — Track loan payoff and interest savings
        </p>
      </header>

      <div class="amortization-grid">
        <!-- Create Loan Form -->
        <section class="panel">
          <h3 class="panel-title">🏠 Register New Loan</h3>

          @if (liabilityAccounts().length === 0) {
            <div class="empty-account-warning">
              <div class="warning-header">
                <span class="warning-icon">⚠️</span>
                <strong>No Loan / Liability Account Found</strong>
              </div>
              <p class="warning-text">
                To register an EMI schedule, you need a <strong>Liability Account Head</strong> (e.g. Home Loan, Car Loan, Personal Loan) in your Chart of Accounts.
              </p>

              @if (!showQuickAddForm()) {
                <button mat-flat-button color="primary" type="button" (click)="showQuickAddForm.set(true)">
                  + Quick Add Loan Account Head
                </button>
              } @else {
                <div class="quick-add-box">
                  <h4 class="quick-add-title">Create Loan Account Head</h4>
                  <div class="quick-add-inputs">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Account Name</mat-label>
                      <input matInput [(ngModel)]="quickAccountName" placeholder="e.g. SBI Home Loan" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Account Code</mat-label>
                      <input matInput [(ngModel)]="quickAccountCode" placeholder="2010" />
                    </mat-form-field>
                  </div>
                  <div class="quick-add-actions">
                    <button mat-flat-button color="primary" type="button" [disabled]="!quickAccountName()" (click)="onQuickCreateLiabilityAccount()">
                      Save & Select Account
                    </button>
                    <button mat-button type="button" (click)="showQuickAddForm.set(false)">Cancel</button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <form class="loan-form" [formGroup]="loanForm" (ngSubmit)="onCreateLoan()">
              
              <mat-form-field appearance="outline">
                <mat-label>Liability Account</mat-label>
                <mat-select formControlName="accountId">
                  @for (acc of liabilityAccounts(); track acc.id) {
                    <mat-option [value]="acc.id">{{ acc.code }} — {{ acc.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Principal Amount (₹)</mat-label>
                <input matInput type="number" formControlName="principalAmount" placeholder="2500000" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Annual Interest Rate (%)</mat-label>
                <input matInput type="number" formControlName="annualInterestRate" placeholder="8.5" step="0.1" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tenure (Months)</mat-label>
                <input matInput type="number" formControlName="tenureMonths" placeholder="240" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Loan Start Date</mat-label>
                <input matInput type="date" formControlName="startDate" />
              </mat-form-field>

              <!-- Live EMI Preview -->
              @if (previewEmi() > 0) {
                <div class="emi-preview">
                  <span>Monthly EMI Preview:</span>
                  <strong>{{ previewEmi() | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
              }

              <button mat-flat-button color="primary" type="submit" [disabled]="loanForm.invalid || isLoading()">
                {{ isLoading() ? 'Calculating...' : 'Generate Amortization Schedule' }}
              </button>
            </form>
          }
        </section>

        <!-- EMI Countdown Card -->
        <section class="panel">
          <h3 class="panel-title">📅 Payoff Countdown</h3>

          @if (activeLoan()) {
            <div class="countdown-card">
              <div class="countdown-metric">
                <span class="cm-label">Monthly EMI</span>
                <span class="cm-value emi-value">{{ activeLoan()!.monthlyEmi | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>

              <div class="countdown-row">
                <div class="countdown-metric">
                  <span class="cm-label">Principal</span>
                  <span class="cm-value">{{ activeLoan()!.principalAmount | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="countdown-metric">
                  <span class="cm-label">Rate</span>
                  <span class="cm-value">{{ activeLoan()!.annualInterestRate }}%</span>
                </div>
                <div class="countdown-metric">
                  <span class="cm-label">Tenure</span>
                  <span class="cm-value">{{ activeLoan()!.tenureMonths }} mo</span>
                </div>
              </div>

              <div class="payoff-section">
                <div class="payoff-dates">
                  <div>
                    <span class="pd-label">Start Date</span>
                    <span class="pd-value">{{ activeLoan()!.startDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="pd-arrow">→</div>
                  <div>
                    <span class="pd-label">Debt-Free Date 🎯</span>
                    <span class="pd-value pd-payoff">{{ activeLoan()!.payoffDate | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Repayment Progress</span>
                  <span>{{ completedMonths() }} / {{ activeLoan()!.tenureMonths }} months</span>
                </div>
                <div class="progress-track" role="progressbar" [attr.aria-valuenow]="completionPercent()" aria-valuemin="0" aria-valuemax="100">
                  <div class="progress-fill" [style.width.%]="completionPercent()"></div>
                </div>
                <span class="progress-pct">{{ completionPercent() | number:'1.1-1' }}% complete</span>
              </div>

              <div class="interest-info">
                <span>Total Interest Payable:</span>
                <strong class="interest-value">{{ activeLoan()!.totalInterestPayable | currency:'INR':'symbol':'1.0-0' }}</strong>
              </div>
            </div>

              <!-- Prepayment Simulator Section -->
              <div class="prepayment-card mt-4">
                <h4 class="sim-title">⚡ Prepayment Savings Simulator</h4>
                <div class="sim-inputs">
                  <mat-form-field appearance="outline">
                    <mat-label>Extra Lump-Sum Prepayment (₹)</mat-label>
                    <input matInput type="number" [(ngModel)]="prepaymentAmount" placeholder="100000" />
                  </mat-form-field>
                </div>

                @if (prepaymentAmount() > 0) {
                  <div class="sim-results">
                    <div class="sim-metric text-success">
                      <span>Total Interest Saved:</span>
                      <strong>{{ estimatedInterestSaved() | currency:'INR':'symbol':'1.0-0' }}</strong>
                    </div>
                    <div class="sim-metric text-primary">
                      <span>Tenure Reduced By:</span>
                      <strong>{{ estimatedMonthsSaved() }} Months!</strong>
                    </div>
                  </div>
                }
              </div>

              <!-- Schedule Table (first 12 months) -->
              <div class="schedule-preview">
                <div class="flex-between mb-2">
                  <h4 class="schedule-title">Amortization Schedule (First 12 Months)</h4>
                  <button mat-stroked-button color="primary" (click)="onPostEmi()">
                    ⚡ Post Current Month EMI Entry
                  </button>
                </div>
                <div class="table-scroll mat-elevation-z1">
                  <table mat-table [dataSource]="activeLoan()!.schedule.slice(0, 12)" aria-label="EMI amortization schedule">
                    
                    <!-- Month Column -->
                    <ng-container matColumnDef="month">
                      <th mat-header-cell *matHeaderCellDef> Month </th>
                      <td mat-cell *matCellDef="let row"> {{ row.month }} </td>
                    </ng-container>

                    <!-- EMI Column -->
                    <ng-container matColumnDef="emi">
                      <th mat-header-cell *matHeaderCellDef class="text-right"> EMI </th>
                      <td mat-cell *matCellDef="let row" class="text-right"> {{ row.emi | currency:'INR':'symbol':'1.0-0' }} </td>
                    </ng-container>

                    <!-- Principal Column -->
                    <ng-container matColumnDef="principal">
                      <th mat-header-cell *matHeaderCellDef class="text-right"> Principal </th>
                      <td mat-cell *matCellDef="let row" class="text-right principal-col"> {{ row.principalComponent | currency:'INR':'symbol':'1.0-0' }} </td>
                    </ng-container>

                    <!-- Interest Column -->
                    <ng-container matColumnDef="interest">
                      <th mat-header-cell *matHeaderCellDef class="text-right"> Interest </th>
                      <td mat-cell *matCellDef="let row" class="text-right interest-col"> {{ row.interestComponent | currency:'INR':'symbol':'1.0-0' }} </td>
                    </ng-container>

                    <!-- Balance Column -->
                    <ng-container matColumnDef="balance">
                      <th mat-header-cell *matHeaderCellDef class="text-right"> Balance </th>
                      <td mat-cell *matCellDef="let row" class="text-right"> {{ row.closingBalance | currency:'INR':'symbol':'1.0-0' }} </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>
              </div>
            } @else {
              <div class="empty-state">
                <p>📋 Create a loan to see the payoff countdown and amortization schedule.</p>
              </div>
            }
          </section>
      </div>
    </div>
  `,
  styles: [`
    .amortization-page { display: flex; flex-direction: column; gap: 1.5rem; }

    .page-header { }
    .page-title { font-size: 1.4rem; font-weight: 700; margin: 0; }
    .page-subtitle { font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); margin: 0.25rem 0 0; }

    .amortization-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 1.25rem;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .panel-title { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; }

    .loan-form { display: flex; flex-direction: column; gap: 0; }

    .empty-account-warning {
      background: var(--mat-sys-surface-container-low);
      border: 1px dashed var(--mat-sys-outline);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .warning-header { display: flex; align-items: center; gap: 0.5rem; color: var(--mat-sys-error); }
    .warning-text { font-size: 0.85rem; margin: 0; color: var(--mat-sys-on-surface-variant); }
    
    .quick-add-box {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-primary);
      border-radius: 8px;
      padding: 0.875rem;
      margin-top: 0.5rem;
    }
    .quick-add-title { font-size: 0.875rem; font-weight: 700; margin: 0 0 0.75rem; }
    .quick-add-inputs { display: flex; flex-direction: column; gap: 0.5rem; }
    .quick-add-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .w-full { width: 100%; }

    .emi-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.875rem;
      background: var(--mat-sys-primary-container);
      border-radius: 8px;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      strong { font-size: 1.1rem; color: var(--mat-sys-primary); }
    }

    .countdown-card { display: flex; flex-direction: column; gap: 1rem; }

    .countdown-metric {
      display: flex;
      flex-direction: column;
    }

    .cm-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--mat-sys-outline); }
    .cm-value { font-size: 1rem; font-weight: 700; }
    .emi-value { font-size: 1.5rem; color: var(--mat-sys-primary); }

    .countdown-row { display: flex; gap: 1.25rem; }

    .payoff-section {
      background: var(--mat-sys-surface-container-low);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .payoff-dates { display: flex; align-items: center; gap: 1rem; }

    .pd-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--mat-sys-outline); display: block; }
    .pd-value { font-size: 0.9rem; font-weight: 600; }
    .pd-payoff { color: var(--mat-sys-success); font-size: 1rem; }
    .pd-arrow { font-size: 1.25rem; color: var(--mat-sys-outline); }

    .progress-section { display: flex; flex-direction: column; gap: 0.35rem; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--mat-sys-on-surface-variant); }

    .progress-track {
      height: 10px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1e3c72, #2a5298);
      border-radius: 5px;
      transition: width 0.4s ease;
    }

    .progress-pct { font-size: 0.75rem; color: var(--mat-sys-outline); }

    .interest-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.875rem;
      background: rgba(186, 26, 26, 0.06);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .interest-value { color: var(--mat-sys-error); }

    .schedule-preview { margin-top: 1rem; }
    .schedule-title { font-size: 0.875rem; font-weight: 600; margin: 0 0 0.5rem; }

    .table-scroll { overflow-x: auto; border-radius: 8px; }

    table {
      width: 100%;
    }

      .text-right { text-align: right; }
      .principal-col { color: var(--mat-sys-success); }
      .interest-col { color: var(--mat-sys-error); }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--mat-sys-outline);
      font-size: 0.9rem;
    }
  `]
})
export class AmortizationPageComponent {
  private readonly amortizationService = inject(AmortizationService);
  private readonly ledgerStore = inject(LedgerStoreService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly activeLoan = signal<LoanAmortizationDetails | null>(null);

  protected readonly displayedColumns: string[] = ['month', 'emi', 'principal', 'interest', 'balance'];

  protected readonly liabilityAccounts = computed(() =>
    this.ledgerStore.accounts().filter((a) => a.type === 'LIABILITY')
  );

  protected readonly completedMonths = computed(() => {
    const loan = this.activeLoan();
    if (!loan) return 0;
    const start = new Date(loan.startDate);
    const now = new Date();
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.min(Math.max(0, diff), loan.tenureMonths);
  });

  protected readonly completionPercent = computed(() => {
    const loan = this.activeLoan();
    if (!loan) return 0;
    return (this.completedMonths() / loan.tenureMonths) * 100;
  });

  protected readonly previewEmi = computed(() => {
    const { principalAmount, annualInterestRate, tenureMonths } = this.loanForm.getRawValue();
    const P = Number(principalAmount);
    const r = Number(annualInterestRate) / 100 / 12;
    const n = Number(tenureMonths);
    if (!P || !r || !n) return 0;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  });

  protected readonly loanForm = this.fb.group({
    accountId: ['', Validators.required],
    principalAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    annualInterestRate: [null as number | null, [Validators.required, Validators.min(0.1), Validators.max(50)]],
    tenureMonths: [null as number | null, [Validators.required, Validators.min(1), Validators.max(360)]],
    startDate: ['', Validators.required],
  });

  protected readonly prepaymentAmount = signal<number>(0);

  protected readonly estimatedInterestSaved = computed(() => {
    const extra = this.prepaymentAmount();
    const loan = this.activeLoan();
    if (!extra || !loan) return 0;
    const r = loan.annualInterestRate / 100 / 12;
    // Estimated interest saved approximation based on compound duration reduction
    return Math.round(extra * r * (loan.tenureMonths / 2));
  });

  protected readonly estimatedMonthsSaved = computed(() => {
    const extra = this.prepaymentAmount();
    const loan = this.activeLoan();
    if (!extra || !loan || loan.monthlyEmi === 0) return 0;
    return Math.min(loan.tenureMonths, Math.round(extra / loan.monthlyEmi));
  });

  protected readonly showQuickAddForm = signal<boolean>(false);
  protected readonly quickAccountName = signal<string>('Home Loan Liability');
  protected readonly quickAccountCode = signal<string>('2010');

  protected onQuickCreateLiabilityAccount(): void {
    const name = this.quickAccountName().trim();
    const code = this.quickAccountCode().trim() || `20${Math.floor(Math.random() * 90 + 10)}`;
    if (!name) return;

    this.ledgerStore.createAccount({
      code,
      name,
      type: 'LIABILITY',
      description: 'EMI Loan Liability Account',
    });

    this.showQuickAddForm.set(false);
  }

  protected onCreateLoan(): void {
    if (this.loanForm.invalid) return;
    this.isLoading.set(true);

    const raw = this.loanForm.getRawValue();
    this.amortizationService.createLoan({
      accountId: raw.accountId!,
      principalAmount: raw.principalAmount!,
      annualInterestRate: raw.annualInterestRate!,
      tenureMonths: raw.tenureMonths!,
      startDate: raw.startDate!,
    }).subscribe({
      next: (loan) => {
        this.isLoading.set(false);
        this.activeLoan.set(loan);
        this.notificationService.showSuccess('Loan Created', `Monthly EMI: ₹${Math.round(loan.monthlyEmi).toLocaleString('en-IN')}`);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Loan Error', 'Could not create loan. Check your inputs and linked account.');
      }
    });
  }

  protected onPostEmi(): void {
    const loan = this.activeLoan();
    if (!loan || loan.schedule.length === 0) return;
    const firstRow = loan.schedule[0];

    // Find accounts for EMI double-entry: Liability Loan Account, Asset Bank Account, Interest Expense Account
    const assetAcc = this.ledgerStore.accounts().find((a) => a.type === 'ASSET');
    const interestExpenseAcc = this.ledgerStore.accounts().find((a) => a.type === 'EXPENSE');

    if (!assetAcc || !interestExpenseAcc) {
      this.notificationService.showError('Posting Failed', 'Need at least 1 ASSET account and 1 EXPENSE account in Chart of Accounts.');
      return;
    }

    this.ledgerStore.postJournalEntry({
      entryNumber: `EMI-${loan.id.slice(0, 6)}-M1`,
      description: `Monthly EMI Payment - Loan #${loan.id.slice(0, 6)}`,
      postings: [
        { accountId: loan.accountId, type: 'DEBIT', amount: firstRow.principalComponent },
        { accountId: interestExpenseAcc.id, type: 'DEBIT', amount: firstRow.interestComponent },
        { accountId: assetAcc.id, type: 'CREDIT', amount: firstRow.emi },
      ],
    });
  }
}
