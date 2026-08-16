import {
  Component, ChangeDetectionStrategy, inject, input, output, computed, signal
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountEntity } from '../../ledger/models/ledger.model';

@Component({
  selector: 'app-quick-expense-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule, MatButtonModule, MatIconModule],
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
          <input
            type="text"
            matInput
            placeholder="Type category name..."
            [value]="displayAccountName(form.value.expenseAccountId, expenseSearchText())"
            (input)="onExpenseInput($any($event.target).value)"
            (focus)="expenseSearchText.set('')"
            [matAutocomplete]="expAuto"
          />
          <mat-autocomplete
            #expAuto="matAutocomplete"
            (optionSelected)="onExpenseSelect($event.option.value)"
          >
            @for (acc of filteredExpenseAccounts(); track acc.id) {
              <mat-option [value]="acc.id">{{ acc.name }}</mat-option>
            }
            @if (filteredExpenseAccounts().length === 0) {
              <mat-option disabled>No matching categories found</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Paid From</mat-label>
          <input
            type="text"
            matInput
            placeholder="Type account name..."
            [value]="displayAccountName(form.value.assetAccountId, paymentSearchText())"
            (input)="onPaymentInput($any($event.target).value)"
            (focus)="paymentSearchText.set('')"
            [matAutocomplete]="payAuto"
          />
          <mat-autocomplete
            #payAuto="matAutocomplete"
            (optionSelected)="onPaymentSelect($event.option.value)"
          >
            @for (acc of filteredPaymentAccounts(); track acc.id) {
              <mat-option [value]="acc.id">{{ acc.name }}</mat-option>
            }
            @if (filteredPaymentAccounts().length === 0) {
              <mat-option disabled>No matching accounts found</mat-option>
            }
          </mat-autocomplete>
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

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0.75rem;
      }
      .flex-1, .flex-2, mat-form-field {
        width: 100% !important;
        min-width: 100% !important;
      }
      button[mat-flat-button] {
        width: 100% !important;
        min-height: 48px;
      }
    }

    .select-search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      position: sticky;
      top: 0;
      background: var(--mat-sys-surface-container-high, #1e1e2d);
      z-index: 10;
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.12));

      .search-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .search-input {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: var(--mat-sys-on-surface);
        font-size: 0.85rem;
        padding: 0.25rem 0;

        &::placeholder {
          color: var(--mat-sys-outline);
        }
      }
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

  protected readonly expenseSearchText = signal<string>('');
  protected readonly paymentSearchText = signal<string>('');

  protected readonly filteredExpenseAccounts = computed(() => {
    const query = this.expenseSearchText().toLowerCase().trim();
    const list = this.expenseAccounts();
    if (!query) return list;
    return list.filter((a) => a.name.toLowerCase().includes(query) || a.code.toLowerCase().includes(query));
  });

  protected readonly filteredPaymentAccounts = computed(() => {
    const query = this.paymentSearchText().toLowerCase().trim();
    const list = this.paymentAccounts();
    if (!query) return list;
    return list.filter((a) => a.name.toLowerCase().includes(query) || a.code.toLowerCase().includes(query));
  });

  protected onExpenseInput(val: string): void {
    this.expenseSearchText.set(val);
    const matched = this.expenseAccounts().find(
      (a) => a.name.toLowerCase() === val.toLowerCase() || a.id === val
    );
    this.form.patchValue({ expenseAccountId: matched ? matched.id : '' });
  }

  protected onExpenseSelect(accId: string): void {
    this.form.patchValue({ expenseAccountId: accId });
    this.expenseSearchText.set('');
  }

  protected onPaymentInput(val: string): void {
    this.paymentSearchText.set(val);
    const matched = this.paymentAccounts().find(
      (a) => a.name.toLowerCase() === val.toLowerCase() || a.id === val
    );
    this.form.patchValue({ assetAccountId: matched ? matched.id : '' });
  }

  protected onPaymentSelect(accId: string): void {
    this.form.patchValue({ assetAccountId: accId });
    this.paymentSearchText.set('');
  }

  protected displayAccountName(accId: string | null | undefined, query: string): string {
    if (query) return query;
    if (!accId) return '';
    const acc = this.accounts().find((a) => a.id === accId);
    return acc ? acc.name : '';
  }

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
