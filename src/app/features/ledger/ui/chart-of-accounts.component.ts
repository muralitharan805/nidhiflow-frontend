import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AccountEntity, AccountType, AccountCategoryMeta } from '../models/ledger.model';

/** Account type display fallback metadata if DB data is pending. */
const DEFAULT_ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: string; description: string; colorClass: string }> = {
  ASSET: {
    label: 'Assets',
    icon: '🏦',
    description: 'What you own — Cash, Bank balances, Mutual Funds & Investments',
    colorClass: 'type-asset',
  },
  LIABILITY: {
    label: 'Liabilities',
    icon: '💳',
    description: 'What you owe — Home Loans, Credit Card balances & Debts',
    colorClass: 'type-liability',
  },
  EQUITY: {
    label: 'Equity',
    icon: '⚖️',
    description: 'Your Net Worth & Capital — Initial savings & Net Worth reserves',
    colorClass: 'type-equity',
  },
  INCOME: {
    label: 'Income',
    icon: '💰',
    description: 'Money coming in — Monthly salary, Freelance earnings & Dividends',
    colorClass: 'type-income',
  },
  EXPENSE: {
    label: 'Expenses',
    icon: '📤',
    description: 'Money going out — House rent, Groceries, Fuel & Utility bills',
    colorClass: 'type-expense',
  },
};

/**
 * Presentational component rendering Chart of Accounts grouped by category with expandable trees & balances.
 */
@Component({
  selector: 'app-chart-of-accounts',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="coa-container">
      @for (group of accountsByType(); track group.type) {
        @let metaInfo = getMeta(group.type);
        @let isCollapsed = collapsedSet().has(group.type);
        @let categoryTotal = getCategoryTotal(group.accounts);

        <div class="type-section">
          <div
            class="type-header"
            [class]="'type-header ' + metaInfo.colorClass"
            (click)="toggleCollapse(group.type)"
            role="button"
            tabindex="0"
            (keydown.enter)="toggleCollapse(group.type)"
          >
            <div class="header-main">
              <div class="header-title-row">
                <span class="expand-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
                <span class="type-title">{{ metaInfo.icon }} {{ metaInfo.label }}</span>
              </div>
              <span class="type-subtext">{{ metaInfo.description }}</span>
            </div>
            
            <div class="header-meta">
              <span class="category-total">{{ categoryTotal | currency:'INR':'symbol':'1.0-0' }}</span>
              <span class="account-count">{{ group.accounts.length }} heads</span>
            </div>
          </div>

          @if (!isCollapsed) {
            @if (group.accounts.length > 0) {
              <ul class="account-list" role="list">
                @for (account of group.accounts; track account.id) {
                  <li class="account-item" role="listitem">
                    <span class="account-code">{{ account.code }}</span>
                    <div class="account-info">
                      <span class="account-name">{{ account.name }}</span>
                      @if (account.description) {
                        <span class="account-desc">{{ account.description }}</span>
                      }
                    </div>
                    <span class="account-balance" [class.has-balance]="(account.balance || 0) > 0">
                      {{ (account.balance || 0) | currency:'INR':'symbol':'1.0-0' }}
                    </span>
                  </li>
                }
              </ul>
            } @else {
              <p class="empty-type">No accounts created in this category yet.</p>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .coa-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .type-section {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .type-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      user-select: none;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.08);
      }
    }

    .header-main {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .expand-icon {
      font-size: 0.7rem;
      opacity: 0.8;
    }

    .type-title {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .type-subtext {
      font-size: 0.75rem;
      font-weight: 400;
      opacity: 0.85;
    }

    .type-asset    { background: rgba(46,  125,  50,  0.12); color: #2e7d32; }
    .type-liability { background: rgba(186, 26,  26, 0.12); color: #ba1a1a; }
    .type-equity   { background: rgba(30,  60, 114, 0.12); color: #1e3c72; }
    .type-income   { background: rgba(1,  136, 209, 0.12); color: #0188d1; }
    .type-expense  { background: rgba(237, 108, 2, 0.12);  color: #ed6c02; }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .category-total {
      font-size: 0.9rem;
      font-weight: 700;
    }

    .account-count {
      background: rgba(0,0,0,0.12);
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.725rem;
      font-weight: 600;
    }

    .account-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .account-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.6rem 1rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.875rem;

      &:hover {
        background-color: var(--mat-sys-surface-container-low);
      }
    }

    .account-code {
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--mat-sys-outline);
      min-width: 52px;
    }

    .account-info {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex: 1;
    }

    .account-name {
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .account-desc {
      font-size: 0.725rem;
      color: var(--mat-sys-outline);
    }

    .account-balance {
      font-weight: 700;
      font-size: 0.85rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);

      &.has-balance {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
    }

    .empty-type {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      color: var(--mat-sys-outline);
      margin: 0;
      font-style: italic;
    }

    @media (max-width: 599.98px) {
      .type-header {
        padding: 0.65rem 0.75rem;
      }
      .type-subtext {
        display: none;
      }
      .header-meta {
        gap: 0.4rem;
        flex-shrink: 0;
      }
      .category-total {
        font-size: 0.825rem;
      }
      .account-count {
        font-size: 0.675rem;
        padding: 0.15rem 0.45rem;
      }
      .account-item {
        padding: 0.55rem 0.65rem;
        gap: 0.4rem;
      }
      .account-code {
        min-width: 34px;
        font-size: 0.675rem;
        flex-shrink: 0;
      }
      .account-name {
        font-size: 0.8rem;
        line-height: 1.25;
      }
      .account-desc {
        font-size: 0.65rem;
      }
      .account-balance {
        font-size: 0.75rem;
        padding: 0.15rem 0.35rem;
        margin-left: auto;
        white-space: nowrap;
        flex-shrink: 0;
      }
    }
  `]
})
export class ChartOfAccountsComponent {
  readonly accountsByType = input.required<{ type: AccountType; accounts: AccountEntity[] }[]>();
  readonly categoryMeta = input<AccountCategoryMeta[]>([]);

  /** Signal holding collapsed account category types. */
  protected readonly collapsedSet = signal<Set<AccountType>>(new Set());

  protected toggleCollapse(type: AccountType): void {
    this.collapsedSet.update((set) => {
      const next = new Set(set);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  protected getCategoryTotal(accounts: AccountEntity[]): number {
    return accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  }

  protected getMeta(type: AccountType): { label: string; icon: string; description: string; colorClass: string } {
    const list = this.categoryMeta();
    const found = list ? list.find((m) => m.type === type) : null;
    if (found) {
      return {
        label: found.label,
        icon: found.icon,
        description: found.description,
        colorClass: found.colorClass || `type-${type.toLowerCase()}`,
      };
    }
    return DEFAULT_ACCOUNT_TYPE_META[type];
  }
}
