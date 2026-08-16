import {
  Component, ChangeDetectionStrategy, inject, signal, computed, input, output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AccountEntity, CreateJournalEntryInput, PostingType } from '../models/ledger.model';

export type SimpleTransactionType = 'OPENING_BALANCE' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

/**
 * Intuitive transaction form supporting both Guided Simple Mode and Advanced Multi-line Double-Entry Mode.
 */
@Component({
  selector: 'app-journal-entry-form',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-container">
      <!-- Mode Toggle Switch -->
      <div class="mode-toggle-row">
        <mat-button-toggle-group
          [value]="activeMode()"
          (change)="activeMode.set($event.value)"
          aria-label="Transaction Entry Mode"
        >
          <mat-button-toggle value="SIMPLE">✨ Easy Guided Mode</mat-button-toggle>
          <mat-button-toggle value="ADVANCED">⚡ Advanced Double-Entry</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- MODE 1: SIMPLE GUIDED TRANSACTION FORM -->
      @if (activeMode() === 'SIMPLE') {
        <form class="journal-form" [formGroup]="simpleForm" (ngSubmit)="onSimpleSubmit()">
          
          <!-- Transaction Type Pills -->
          <div class="tx-type-selector">
            <span class="selector-label">Transaction Purpose:</span>
            <div class="pill-group">
              <button
                type="button"
                class="type-pill"
                [class.active]="simpleTxType() === 'OPENING_BALANCE'"
                (click)="setSimpleTxType('OPENING_BALANCE')"
              >
                🏛️ Initial Bank Balance
              </button>

              <button
                type="button"
                class="type-pill"
                [class.active]="simpleTxType() === 'EXPENSE'"
                (click)="setSimpleTxType('EXPENSE')"
              >
                💸 Expense / Spend
              </button>

              <button
                type="button"
                class="type-pill"
                [class.active]="simpleTxType() === 'INCOME'"
                (click)="setSimpleTxType('INCOME')"
              >
                💰 Income / Credit
              </button>

              <button
                type="button"
                class="type-pill"
                [class.active]="simpleTxType() === 'TRANSFER'"
                (click)="setSimpleTxType('TRANSFER')"
              >
                🔄 Account Transfer
              </button>
            </div>
          </div>

          <!-- Input Fields -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Description / Note</mat-label>
              <input
                matInput
                type="text"
                formControlName="description"
                [placeholder]="getDescriptionPlaceholder()"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="amount-field">
              <mat-label>Amount (₹)</mat-label>
              <input
                matInput
                type="number"
                formControlName="amount"
                placeholder="1000"
                min="0.01"
                step="0.01"
              />
            </mat-form-field>
          </div>

          <div class="form-row">
            <!-- Primary Account Selection (Bank/Cash) -->
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>{{ getPrimaryAccountLabel() }}</mat-label>
              <input
                type="text"
                matInput
                placeholder="Type code or account name to search..."
                [value]="displayPrimaryAccount(simpleForm.value.primaryAccountId, primarySearchText())"
                (input)="onPrimaryInput($any($event.target).value)"
                (focus)="primarySearchText.set('')"
                [matAutocomplete]="primaryAuto"
              />
              <mat-autocomplete
                #primaryAuto="matAutocomplete"
                (optionSelected)="onPrimarySelect($event.option.value)"
              >
                @for (acc of filteredPrimaryAccounts(); track acc.id) {
                  <mat-option [value]="acc.id">{{ acc.code }} — {{ acc.name }}</mat-option>
                }
                @if (filteredPrimaryAccounts().length === 0) {
                  <mat-option disabled>No matching accounts found</mat-option>
                }
              </mat-autocomplete>
              <mat-hint class="hint-text">💡 {{ getPrimaryAccountHint() }}</mat-hint>
            </mat-form-field>

            <!-- Secondary Account Selection (Equity/Expense/Income/Target Bank) -->
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>{{ getSecondaryAccountLabel() }}</mat-label>
              <input
                type="text"
                matInput
                placeholder="Type code or category name to search..."
                [value]="displaySecondaryAccount(simpleForm.value.secondaryAccountId, secondarySearchText())"
                (input)="onSecondaryInput($any($event.target).value)"
                (focus)="secondarySearchText.set('')"
                [matAutocomplete]="secondaryAuto"
              />
              <mat-autocomplete
                #secondaryAuto="matAutocomplete"
                (optionSelected)="onSecondarySelect($event.option.value)"
              >
                @for (acc of filteredSecondaryAccounts(); track acc.id) {
                  <mat-option [value]="acc.id">{{ acc.code }} — {{ acc.name }}</mat-option>
                }
                @if (filteredSecondaryAccounts().length === 0) {
                  <mat-option disabled>No matching categories found</mat-option>
                }
              </mat-autocomplete>
              <mat-hint class="hint-text">💡 {{ getSecondaryAccountHint() }}</mat-hint>
            </mat-form-field>
          </div>

          <!-- Dynamic Double-Entry Engine Live Preview Card -->
          @if (simpleForm.valid) {
            <div class="auto-posting-card">
              <div class="preview-title">
                <mat-icon class="icon-sm">auto_fix_high</mat-icon>
                <span>Automated Double-Entry Ledger Preview:</span>
              </div>
              <div class="posting-badges">
                <div class="badge debit-badge">
                  📥 DEBIT: <strong>{{ getAccountName(simpleForm.value.primaryAccountId, simpleForm.value.secondaryAccountId, 'DEBIT') }}</strong> ({{ simpleForm.value.amount | currency:'INR':'symbol':'1.0-0' }})
                </div>
                <div class="badge credit-badge">
                  📤 CREDIT: <strong>{{ getAccountName(simpleForm.value.primaryAccountId, simpleForm.value.secondaryAccountId, 'CREDIT') }}</strong> ({{ simpleForm.value.amount | currency:'INR':'symbol':'1.0-0' }})
                </div>
              </div>
            </div>
          }

          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="simpleForm.invalid"
            class="submit-btn"
          >
            ✓ Post Transaction
          </button>
        </form>
      }

      <!-- MODE 2: ADVANCED MULTI-LINE DOUBLE ENTRY FORM -->
      @if (activeMode() === 'ADVANCED') {
        <form class="journal-form" [formGroup]="advancedForm" (ngSubmit)="onAdvancedSubmit()">
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Description</mat-label>
              <input matInput type="text" formControlName="description" placeholder="e.g. Manual Adjustment Entry" />
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
                    <input
                      type="text"
                      matInput
                      placeholder="Type code or account name..."
                      [value]="displayAdvancedAccount(line.value.accountId, advancedSearchText())"
                      (input)="onAdvancedInput($any($event.target).value, $index)"
                      (focus)="advancedSearchText.set('')"
                      [matAutocomplete]="advAuto"
                    />
                    <mat-autocomplete
                      #advAuto="matAutocomplete"
                      (optionSelected)="onAdvancedSelect($event.option.value, $index)"
                    >
                      @for (acc of filteredAdvancedAccounts(); track acc.id) {
                        <mat-option [value]="acc.id">{{ acc.code }} — {{ acc.name }}</mat-option>
                      }
                      @if (filteredAdvancedAccounts().length === 0) {
                        <mat-option disabled>No matching accounts found</mat-option>
                      }
                    </mat-autocomplete>
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

          <button mat-flat-button color="primary" type="submit" [disabled]="!isBalanced() || advancedForm.invalid" class="submit-btn">
            Post Journal Entry
          </button>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .mode-toggle-row {
      display: flex;
      justify-content: flex-end;
    }

    .journal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tx-type-selector {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .selector-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--mat-sys-outline);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .pill-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .type-pill {
      padding: 0.5rem 0.85rem;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--mat-sys-surface-container-high);
      }

      &.active {
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        border-color: var(--mat-sys-primary);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
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

    .amount-field {
      width: 160px;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0.75rem;
      }
      .flex-1, .amount-field, mat-form-field {
        width: 100% !important;
        min-width: 100% !important;
      }
      .pill-group {
        width: 100%;
        .type-pill {
          flex: 1;
          text-align: center;
          padding: 0.6rem 0.5rem;
        }
      }
    }

    .auto-posting-card {
      background: rgba(var(--mat-sys-primary-rgb, 25, 118, 210), 0.06);
      border: 1px solid var(--mat-sys-primary);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .preview-title {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--mat-sys-primary);
      }
    }

    .icon-sm {
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
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

    .posting-badges {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;

      .badge {
        font-size: 0.8rem;
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-weight: 500;
      }

      .debit-badge {
        background: var(--mat-sys-success-container);
        color: var(--mat-sys-on-success-container);
      }

      .credit-badge {
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }
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
      grid-template-columns: 1fr 140px 140px 48px;
      gap: 1rem;
      align-items: center;
    }

    .remove-action {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 22px;
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

    .submit-btn {
      align-self: flex-end;
      padding: 0.5rem 1.5rem;
    }
  `],
})
export class JournalEntryFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly accounts = input.required<AccountEntity[]>();
  readonly entrySubmitted = output<CreateJournalEntryInput>();

  // Mode & Simple Tx Type state
  protected readonly activeMode = signal<'SIMPLE' | 'ADVANCED'>('SIMPLE');
  protected readonly simpleTxType = signal<SimpleTransactionType>('OPENING_BALANCE');

  // Account Categories Computed
  protected readonly assetAccounts = computed(() => this.accounts().filter((a) => a.type === 'ASSET'));
  protected readonly liabilityAccounts = computed(() => this.accounts().filter((a) => a.type === 'LIABILITY'));
  protected readonly equityAccounts = computed(() => this.accounts().filter((a) => a.type === 'EQUITY'));
  protected readonly expenseAccounts = computed(() => this.accounts().filter((a) => a.type === 'EXPENSE'));
  protected readonly incomeAccounts = computed(() => this.accounts().filter((a) => a.type === 'INCOME'));

  // Live Search Filters for Dropdowns
  protected readonly primarySearchText = signal<string>('');
  protected readonly secondarySearchText = signal<string>('');
  protected readonly advancedSearchText = signal<string>('');

  protected readonly filteredPrimaryAccounts = computed(() => {
    const query = this.primarySearchText().toLowerCase().trim();
    const options = this.getPrimaryAccountOptions();
    if (!query) return options;
    return options.filter((a) => a.code.toLowerCase().includes(query) || a.name.toLowerCase().includes(query));
  });

  protected readonly filteredSecondaryAccounts = computed(() => {
    const query = this.secondarySearchText().toLowerCase().trim();
    const options = this.getSecondaryAccountOptions();
    if (!query) return options;
    return options.filter((a) => a.code.toLowerCase().includes(query) || a.name.toLowerCase().includes(query));
  });

  protected readonly filteredAdvancedAccounts = computed(() => {
    const query = this.advancedSearchText().toLowerCase().trim();
    const options = this.accounts();
    if (!query) return options;
    return options.filter((a) => a.code.toLowerCase().includes(query) || a.name.toLowerCase().includes(query));
  });

  protected onPrimaryInput(val: string): void {
    this.primarySearchText.set(val);
    const matched = this.getPrimaryAccountOptions().find(
      (a) => `${a.code} — ${a.name}`.toLowerCase() === val.toLowerCase() || a.id === val
    );
    this.simpleForm.patchValue({ primaryAccountId: matched ? matched.id : '' });
  }

  protected onPrimarySelect(accId: string): void {
    this.simpleForm.patchValue({ primaryAccountId: accId });
    this.primarySearchText.set('');
  }

  protected displayPrimaryAccount(accId: string | null | undefined, query: string): string {
    if (query) return query;
    if (!accId) return '';
    const acc = this.accounts().find((a) => a.id === accId);
    return acc ? `${acc.code} — ${acc.name}` : '';
  }

  protected onSecondaryInput(val: string): void {
    this.secondarySearchText.set(val);
    const matched = this.getSecondaryAccountOptions().find(
      (a) => `${a.code} — ${a.name}`.toLowerCase() === val.toLowerCase() || a.id === val
    );
    this.simpleForm.patchValue({ secondaryAccountId: matched ? matched.id : '' });
  }

  protected onSecondarySelect(accId: string): void {
    this.simpleForm.patchValue({ secondaryAccountId: accId });
    this.secondarySearchText.set('');
  }

  protected displaySecondaryAccount(accId: string | null | undefined, query: string): string {
    if (query) return query;
    if (!accId) return '';
    const acc = this.accounts().find((a) => a.id === accId);
    return acc ? `${acc.code} — ${acc.name}` : '';
  }

  protected onAdvancedInput(val: string, index: number): void {
    this.advancedSearchText.set(val);
    const matched = this.accounts().find(
      (a) => `${a.code} — ${a.name}`.toLowerCase() === val.toLowerCase() || a.id === val
    );
    this.linesArray.at(index).patchValue({ accountId: matched ? matched.id : '' });
  }

  protected onAdvancedSelect(accId: string, index: number): void {
    this.linesArray.at(index).patchValue({ accountId: accId });
    this.advancedSearchText.set('');
  }

  protected displayAdvancedAccount(accId: string | null | undefined, query: string): string {
    if (query) return query;
    if (!accId) return '';
    const acc = this.accounts().find((a) => a.id === accId);
    return acc ? `${acc.code} — ${acc.name}` : '';
  }

  // Form 1: Simple Mode Form
  protected readonly simpleForm = this.fb.group({
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    primaryAccountId: ['', Validators.required],
    secondaryAccountId: ['', Validators.required],
  });

  // Form 2: Advanced Double Entry Form
  protected readonly advancedForm = this.fb.group({
    description: ['', Validators.required],
    reference: [''],
    lines: this.fb.array([
      this.buildLine('DEBIT'),
      this.buildLine('CREDIT'),
    ]),
  });

  /**
   * Helper getter exposing posting lines form array.
   */
  get linesArray(): FormArray {
    return this.advancedForm.get('lines') as FormArray;
  }

  protected readonly totalDebits = computed(() => this.sumByType('DEBIT'));
  protected readonly totalCredits = computed(() => this.sumByType('CREDIT'));
  
  /**
   * Computed boolean checking double-entry equilibrium (|Debits - Credits| < 0.001).
   */
  protected readonly isBalanced = computed(() => {
    const diff = Math.abs(this.totalDebits() - this.totalCredits());
    return diff < 0.001 && this.totalDebits() > 0;
  });

  /**
   * Updates guided simple mode transaction purpose and resets form fields.
   *
   * @param type Target transaction type pill selection
   */
  protected setSimpleTxType(type: SimpleTransactionType): void {
    this.simpleTxType.set(type);
    this.simpleForm.patchValue({
      description: '',
      primaryAccountId: '',
      secondaryAccountId: '',
    });
  }

  /**
   * Returns contextual placeholder text based on selected transaction mode.
   *
   * @returns Formatted description placeholder string
   */
  protected getDescriptionPlaceholder(): string {
    switch (this.simpleTxType()) {
      case 'OPENING_BALANCE': return 'e.g. Initial Bank Deposit';
      case 'EXPENSE': return 'e.g. House Rent or Groceries';
      case 'INCOME': return 'e.g. Monthly Salary Credit';
      case 'TRANSFER': return 'e.g. Bank to Cash Wallet Transfer';
    }
  }

  /**
   * Returns contextual primary account field label.
   *
   * @returns Field label string
   */
  protected getPrimaryAccountLabel(): string {
    switch (this.simpleTxType()) {
      case 'OPENING_BALANCE': return 'Deposit To (Bank / Cash Wallet)';
      case 'EXPENSE': return 'Paid From (Bank / Cash Wallet)';
      case 'INCOME': return 'Deposit To (Bank / Cash Wallet)';
      case 'TRANSFER': return 'From Account (Source)';
    }
  }

  /**
   * Returns contextual secondary account field label.
   *
   * @returns Field label string
   */
  protected getSecondaryAccountLabel(): string {
    switch (this.simpleTxType()) {
      case 'OPENING_BALANCE': return 'Starting Capital / Personal Savings Head';
      case 'EXPENSE': return 'Expense Category';
      case 'INCOME': return 'Income Source Category';
      case 'TRANSFER': return 'To Account (Destination)';
    }
  }

  /**
   * Returns helpful primary account selector hint text.
   *
   * @returns Hint message string
   */
  protected getPrimaryAccountHint(): string {
    switch (this.simpleTxType()) {
      case 'OPENING_BALANCE': return 'Select the bank account or cash wallet receiving your starting money.';
      case 'EXPENSE': return 'Select the bank account, credit card, or cash wallet used to pay.';
      case 'INCOME': return 'Select the bank account or cash wallet receiving your income.';
      case 'TRANSFER': return 'Select the source account where money is taken out from.';
    }
  }

  /**
   * Returns helpful secondary account selector hint text.
   *
   * @returns Hint message string
   */
  protected getSecondaryAccountHint(): string {
    switch (this.simpleTxType()) {
      case 'OPENING_BALANCE': return "Select 'Opening Balance Equity' (represents your initial personal savings deposit).";
      case 'EXPENSE': return 'Select the spend category (e.g. Groceries, House Rent, Utilities).';
      case 'INCOME': return 'Select the income category (e.g. Monthly Salary, Freelance, Dividend).';
      case 'TRANSFER': return 'Select the destination account receiving the money.';
    }
  }

  /**
   * Returns filtered primary account selection options (source or deposit target).
   *
   * @returns Array of valid AccountEntity options
   */
  protected getPrimaryAccountOptions(): AccountEntity[] {
    switch (this.simpleTxType()) {
      case 'EXPENSE':
        return this.accounts().filter((a) => a.type === 'ASSET' || a.type === 'LIABILITY');
      default:
        return this.assetAccounts();
    }
  }

  /**
   * Returns filtered account selection options matching selected simple transaction category.
   *
   * @returns Array of valid AccountEntity options
   */
  protected getSecondaryAccountOptions(): AccountEntity[] {
    switch (this.simpleTxType()) {
      case 'OPENING_BALANCE': {
        const equity = this.equityAccounts();
        return equity.length ? equity : this.accounts().filter(a => a.type === 'EQUITY' || a.type === 'ASSET');
      }
      case 'EXPENSE': {
        const expenses = this.expenseAccounts();
        const equity = this.equityAccounts();
        return [...expenses, ...equity];
      }
      case 'INCOME': return this.incomeAccounts().length ? this.incomeAccounts() : this.accounts();
      case 'TRANSFER': return this.assetAccounts();
    }
  }

  /**
   * Resolves account display title for debit/credit preview card.
   *
   * @param primaryId Primary source account ID
   * @param secondaryId Secondary target account ID
   * @param type Posting line direction ('DEBIT' | 'CREDIT')
   * @returns Display string with account code and name
   */
  protected getAccountName(primaryId?: string | null, secondaryId?: string | null, type?: 'DEBIT' | 'CREDIT'): string {
    const all = this.accounts();
    const mode = this.simpleTxType();

    let targetId: string | null | undefined = null;
    if (mode === 'OPENING_BALANCE' || mode === 'INCOME') {
      targetId = type === 'DEBIT' ? primaryId : secondaryId;
    } else if (mode === 'EXPENSE' || mode === 'TRANSFER') {
      targetId = type === 'DEBIT' ? secondaryId : primaryId;
    }

    const found = all.find((a) => a.id === targetId);
    return found ? `${found.code} ${found.name}` : '(Select Account)';
  }

  /**
   * Submits simple mode form converting simple inputs into balanced double-entry postings.
   */
  protected onSimpleSubmit(): void {
    if (this.simpleForm.invalid) return;

    const { description, amount, primaryAccountId, secondaryAccountId } = this.simpleForm.getRawValue();
    const numAmount = Number(amount);
    const mode = this.simpleTxType();

    let debitAccountId = '';
    let creditAccountId = '';

    if (mode === 'OPENING_BALANCE' || mode === 'INCOME') {
      debitAccountId = primaryAccountId!;
      creditAccountId = secondaryAccountId!;
    } else if (mode === 'EXPENSE' || mode === 'TRANSFER') {
      debitAccountId = secondaryAccountId!;
      creditAccountId = primaryAccountId!;
    }

    const input: CreateJournalEntryInput = {
      description: description!,
      lines: [
        { accountId: debitAccountId, type: 'DEBIT', amount: numAmount },
        { accountId: creditAccountId, type: 'CREDIT', amount: numAmount },
      ],
    };

    this.entrySubmitted.emit(input);
    this.simpleForm.reset({ description: '', amount: 0, primaryAccountId: '', secondaryAccountId: '' });
  }

  /**
   * Adds an additional posting line to advanced double-entry form.
   */
  protected addLine(): void {
    this.linesArray.push(this.buildLine('DEBIT'));
  }

  /**
   * Removes a posting line by index ensuring minimum 2 lines remain.
   *
   * @param index Target array line index to remove
   */
  protected removeLine(index: number): void {
    if (this.linesArray.length > 2) {
      this.linesArray.removeAt(index);
    }
  }

  /**
   * Submits advanced multi-line double entry form after validating balance equilibrium.
   */
  protected onAdvancedSubmit(): void {
    if (!this.isBalanced() || this.advancedForm.invalid) return;

    const { description, reference, lines } = this.advancedForm.getRawValue();
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
    this.advancedForm.reset({ description: '', reference: '' });
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
