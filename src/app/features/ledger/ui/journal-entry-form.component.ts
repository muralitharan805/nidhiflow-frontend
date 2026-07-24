import {
  Component, ChangeDetectionStrategy, inject, signal, computed, input, output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountEntity, CreateJournalEntryInput, PostingType } from '../models/ledger.model';

/**
 * Dynamic journal entry form with live balance indicator enforcing Σ Debits = Σ Credits.
 */
@Component({
  selector: 'app-journal-entry-form',
  imports: [ReactiveFormsModule, CurrencyPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="journal-form" [formGroup]="entryForm" (ngSubmit)="onSubmit()">
      
      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Description</mat-label>
          <input matInput type="text" formControlName="description" placeholder="e.g. Monthly grocery purchase" />
        </mat-form-field>
  
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Reference (Optional)</mat-label>
          <input matInput type="text" formControlName="reference" placeholder="e.g. INV-2026-001" />
        </mat-form-field>
      </div>

      <div class="lines-section">
        <div class="lines-header">
          <span class="lines-title">Posting Lines</span>
          <button mat-stroked-button color="primary" type="button" (click)="addLine()">+ Add Line</button>
        </div>

        <div formArrayName="lines" class="lines-list">
          @for (line of linesArray.controls; track $index) {
            <div [formGroupName]="$index" class="posting-line">
              <mat-form-field appearance="outline" class="account-select">
                <mat-label>Account</mat-label>
                <mat-select formControlName="accountId">
                  @for (acc of accounts(); track acc.id) {
                    <mat-option [value]="acc.id">{{ acc.code }} — {{ acc.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="type-select-field">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="DEBIT">DEBIT</mat-option>
                  <mat-option value="CREDIT">CREDIT</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>Amount</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="amount"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </mat-form-field>

              <div class="remove-action">
                @if (linesArray.length > 2) {
                  <button mat-icon-button color="warn" type="button" (click)="removeLine($index)" aria-label="Remove line">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Live Balance Indicator -->
      <div class="balance-indicator" [class.balanced]="isBalanced()" [class.unbalanced]="!isBalanced()">
        <div class="balance-row">
          <span>Σ Debits: <strong>{{ totalDebits() | currency:'INR':'symbol':'1.2-2' }}</strong></span>
          <span>Σ Credits: <strong>{{ totalCredits() | currency:'INR':'symbol':'1.2-2' }}</strong></span>
        </div>
        <span class="balance-status">
          {{ isBalanced() ? '✓ BALANCED — Entry is valid' : '✗ UNBALANCED — Adjust posting lines' }}
        </span>
      </div>

      <button mat-flat-button color="primary" type="submit" [disabled]="!isBalanced() || entryForm.invalid">
        Post Journal Entry
      </button>
    </form>
  `,
  styles: [`
    .journal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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

    .lines-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .lines-title {
      font-weight: 600;
      font-size: 0.875rem;
    }


    .lines-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .posting-line {
      display: grid;
      grid-template-columns: 1fr 150px 150px 48px;
      gap: 1rem;
      align-items: center;
    }

    .remove-action {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 22px; /* align with input field without hint */
    }

    .balance-indicator {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid;

      &.balanced {
        background: rgba(46, 125, 50, 0.08);
        border-color: var(--mat-sys-success);
        color: var(--mat-sys-success);
      }

      &.unbalanced {
        background: rgba(186, 26, 26, 0.08);
        border-color: var(--mat-sys-error);
        color: var(--mat-sys-error);
      }
    }

    .balance-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .balance-status {
      font-size: 0.8rem;
      font-weight: 600;
    }


  `]
})
export class JournalEntryFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly accounts = input.required<AccountEntity[]>();
  readonly entrySubmitted = output<CreateJournalEntryInput>();

  protected readonly entryForm = this.fb.group({
    description: ['', Validators.required],
    reference: [''],
    lines: this.fb.array([
      this.buildLine('DEBIT'),
      this.buildLine('CREDIT'),
    ]),
  });

  get linesArray(): FormArray {
    return this.entryForm.get('lines') as FormArray;
  }

  protected readonly totalDebits = computed(() => this.sumByType('DEBIT'));
  protected readonly totalCredits = computed(() => this.sumByType('CREDIT'));
  protected readonly isBalanced = computed(() => {
    const diff = Math.abs(this.totalDebits() - this.totalCredits());
    return diff < 0.001 && this.totalDebits() > 0;
  });

  protected addLine(): void {
    this.linesArray.push(this.buildLine('DEBIT'));
  }

  protected removeLine(index: number): void {
    if (this.linesArray.length > 2) {
      this.linesArray.removeAt(index);
    }
  }

  protected onSubmit(): void {
    if (!this.isBalanced() || this.entryForm.invalid) return;

    const { description, reference, lines } = this.entryForm.getRawValue();
    const input: CreateJournalEntryInput = {
      description: description!,
      reference: reference || undefined,
      lines: (lines as { accountId: string; type: PostingType; amount: number }[]).map((l) => ({
        accountId: l.accountId,
        type: l.type,
        amount: Number(l.amount),
      })),
    };
    this.entrySubmitted.emit(input);
    this.entryForm.reset({ description: '', reference: '' });
    while (this.linesArray.length > 2) this.linesArray.removeAt(2);
    this.linesArray.at(0).reset({ type: 'DEBIT', amount: 0 });
    this.linesArray.at(1).reset({ type: 'CREDIT', amount: 0 });
  }

  private buildLine(type: PostingType) {
    return this.fb.group({
      accountId: ['', Validators.required],
      type: [type as PostingType, Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  private sumByType(type: PostingType): number {
    const lines = this.linesArray.getRawValue() as { type: PostingType; amount: number }[];
    return lines.filter((l) => l.type === type).reduce((sum, l) => sum + Number(l.amount || 0), 0);
  }
}
