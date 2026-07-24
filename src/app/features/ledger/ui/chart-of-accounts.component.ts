import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AccountEntity, AccountType } from '../models/ledger.model';

/** Account type display metadata. */
const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: string; colorClass: string }> = {
  ASSET: { label: 'Assets', icon: '🏦', colorClass: 'type-asset' },
  LIABILITY: { label: 'Liabilities', icon: '💳', colorClass: 'type-liability' },
  EQUITY: { label: 'Equity', icon: '⚖️', colorClass: 'type-equity' },
  INCOME: { label: 'Income', icon: '💰', colorClass: 'type-income' },
  EXPENSE: { label: 'Expenses', icon: '📤', colorClass: 'type-expense' },
};

/**
 * Presentational component rendering Chart of Accounts grouped by type.
 */
@Component({
  selector: 'app-chart-of-accounts',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="coa-container">
      @for (group of accountsByType(); track group.type) {
        <div class="type-section">
          <div class="type-header" [class]="'type-header ' + meta[group.type].colorClass">
            <span>{{ meta[group.type].icon }} {{ meta[group.type].label }}</span>
            <span class="account-count">{{ group.accounts.length }}</span>
          </div>
          @if (group.accounts.length > 0) {
            <ul class="account-list" role="list">
              @for (account of group.accounts; track account.id) {
                <li class="account-item" role="listitem">
                  <span class="account-code">{{ account.code }}</span>
                  <span class="account-name">{{ account.name }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="empty-type">No accounts in this category yet.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .coa-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .type-section {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      overflow: hidden;
    }

    .type-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 1rem;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .type-asset    { background: rgba(46,  125,  50,  0.1); color: #2e7d32; }
    .type-liability { background: rgba(186, 26,  26, 0.1); color: #ba1a1a; }
    .type-equity   { background: rgba(30,  60, 114, 0.1); color: #1e3c72; }
    .type-income   { background: rgba(1,  136, 209, 0.1); color: #0188d1; }
    .type-expense  { background: rgba(237, 108, 2, 0.1);  color: #ed6c02; }

    .account-count {
      background: rgba(0,0,0,0.1);
      padding: 0.1rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
    }

    .account-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .account-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.875rem;

      &:hover {
        background-color: var(--mat-sys-surface-container-low);
      }
    }

    .account-code {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
      min-width: 64px;
    }

    .account-name {
      flex: 1;
      font-weight: 500;
    }

    .empty-type {
      padding: 0.75rem 1rem;
      font-size: 0.825rem;
      color: var(--mat-sys-outline);
      margin: 0;
    }
  `]
})
export class ChartOfAccountsComponent {
  readonly accountsByType = input.required<{ type: AccountType; accounts: AccountEntity[] }[]>();
  protected readonly meta = ACCOUNT_TYPE_META;
}
