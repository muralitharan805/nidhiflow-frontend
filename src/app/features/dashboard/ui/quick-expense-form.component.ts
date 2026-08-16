import {
  Component, ChangeDetectionStrategy, inject, input, output, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AccountEntity } from '../../ledger/models/ledger.model';

@Component({
  selector: 'app-quick-expense-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="expense-form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Amount (₹)</mat-label>
          <input matInput type="number" formControlName="amount" placeholder="0.00" min="1" step="0.01" />
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="flex-2">
          <mat-label>What did you spend on?</mat-label>
          <input matInput type="text" formControlName="description" placeholder="e.g. Lunch at restaurant" />
        </mat-form-field>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Expense Category</mat-label>
          <mat-select formControlName="expenseAccountId">
            @for (acc of expenseAccounts(); track acc.id) {
              <mat-option [value]="acc.id">{{ acc.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Paid From</mat-label>
          <mat-select formControlName="assetAccountId">
            @for (acc of paymentAccounts(); track acc.id) {
              <mat-option [value]="acc.id">{{ acc.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
        Record Expense
      </button>
    </form>
  `,
  styles: [`
    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      padding: 1.25rem;
      border-radius: 12px;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .flex-1 {
      flex: 1;
      min-width: 150px;
    }
    
    .flex-2 {
      flex: 2;
      min-width: 200px;
    }
  `]
})
export class QuickExpenseFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly accounts = input.required<AccountEntity[]>();
  readonly expenseSubmitted = output<{ amount: number; description: string; expenseAccountId: string; assetAccountId: string }>();

  protected readonly expenseAccounts = computed(() => 
    this.accounts().filter(a => a.type === 'EXPENSE')
  );
  
  protected readonly paymentAccounts = computed(() => {
    const isLiquid = (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes('bank') || lower.includes('savings') || lower.includes('cash') || 
             lower.includes('wallet') || lower.includes('upi') || lower.includes('credit card') || lower.includes('salary');
    };

    // Filter Assets & Credit Cards, excluding long-term locked investments (EPF/PPF/NPS/Stocks)
    const validPaymentSources = this.accounts().filter((a) => {
      if (a.type === 'ASSET') {
        const lower = a.name.toLowerCase();
        const isLockedInvestment = lower.includes('provident') || lower.includes('nps') || lower.includes('stocks') || lower.includes('bonds');
        return !isLockedInvestment;
      }
      return a.type === 'LIABILITY' && a.name.toLowerCase().includes('credit card');
    });

    return validPaymentSources.sort((a, b) => {
      const aScore = isLiquid(a.name) ? 0 : 1;
      const bScore = isLiquid(b.name) ? 0 : 1;
      return aScore - bScore;
    });
  });

  protected readonly form = this.fb.group({
    amount: ['', [Validators.required, Validators.min(0.01)]],
    description: ['', Validators.required],
    expenseAccountId: ['', Validators.required],
    assetAccountId: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    this.expenseSubmitted.emit({
      amount: Number(val.amount),
      description: val.description!,
      expenseAccountId: val.expenseAccountId!,
      assetAccountId: val.assetAccountId!,
    });
    
    this.form.reset({ amount: '', description: '', expenseAccountId: '', assetAccountId: '' });
  }
}
