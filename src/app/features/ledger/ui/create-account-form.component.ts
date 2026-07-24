import {
  Component, ChangeDetectionStrategy, inject, output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AccountType } from '../models/ledger.model';

@Component({
  selector: 'app-create-account-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="create-account-form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Account Code</mat-label>
          <input matInput type="text" formControlName="code" placeholder="e.g. 5001" />
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Account Name</mat-label>
          <input matInput type="text" formControlName="name" placeholder="e.g. Food & Dining" />
        </mat-form-field>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Account Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="ASSET">ASSET (Bank, Cash, Investments)</mat-option>
            <mat-option value="LIABILITY">LIABILITY (Loans, Credit Cards)</mat-option>
            <mat-option value="EQUITY">EQUITY (Capital, Retained Earnings)</mat-option>
            <mat-option value="INCOME">INCOME (Salary, Dividends)</mat-option>
            <mat-option value="EXPENSE">EXPENSE (Food, Rent, Utilities)</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (Optional)</mat-label>
        <input matInput type="text" formControlName="description" placeholder="Brief details about this account" />
      </mat-form-field>

      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
        Create Account Head
      </button>
    </form>
  `,
  styles: [`
    .create-account-form {
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
      min-width: 200px;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class CreateAccountFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly accountSubmitted = output<{ code: string; name: string; type: AccountType; description?: string }>();

  protected readonly form = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    type: ['EXPENSE' as AccountType, Validators.required],
    description: [''],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    this.accountSubmitted.emit({
      code: val.code!,
      name: val.name!,
      type: val.type as AccountType,
      description: val.description || undefined,
    });
    
    this.form.reset({ type: 'EXPENSE' });
  }
}
