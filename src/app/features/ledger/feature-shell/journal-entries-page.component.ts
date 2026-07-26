import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { LedgerStoreService } from '../data-access/ledger-store.service';
import { JournalEntriesListComponent, DisplayJournalEntry } from '../ui/journal-entries-list.component';
import { JournalEntryFormComponent } from '../ui/journal-entry-form.component';
import { CreateJournalEntryInput } from '../models/ledger.model';

export type JournalStatusFilter = 'ALL' | 'ACTIVE' | 'REVERSED';

/**
 * Feature shell container page presenting full journal entries history, audit trail, search, filtering, and Quick Entry creation.
 */
@Component({
  selector: 'app-journal-entries-page',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    JournalEntriesListComponent,
    JournalEntryFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="entries-page">
      <!-- Header Banner -->
      <header class="page-header">
        <div>
          <h2 class="page-title">📜 Journal Entries & Audit Trail</h2>
          <p class="page-subtitle">Complete audit log of postings with instant search, filters, and quick transaction entry</p>
        </div>

        <!-- Action / Toggle New Entry -->
        <div class="header-actions">
          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="togglePostForm()"
          >
            <mat-icon>{{ isPostingOpen() ? 'close' : 'add' }}</mat-icon>
            {{ isPostingOpen() ? 'Cancel Entry' : '+ New Entry' }}
          </button>
          
          <button mat-stroked-button color="primary" type="button" (click)="refreshEntries()">
            <mat-icon>refresh</mat-icon> Reload
          </button>
        </div>
      </header>

      <!-- Expandable Post Entry Form Section -->
      @if (isPostingOpen()) {
        <section class="post-form-section mat-elevation-z2">
          <h3 class="section-title">✏️ Post New Journal Transaction</h3>
          <app-journal-entry-form
            [accounts]="store.accounts()"
            (entrySubmitted)="onEntrySubmit($event)"
          />
        </section>
      }

      <!-- Metric Summary Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="card-label">Total Entries</span>
          <span class="card-value">{{ store.recentEntries().length }}</span>
        </div>

        <div class="metric-card card-success">
          <span class="card-label">Active Postings</span>
          <span class="card-value">{{ activeCount() }}</span>
        </div>

        <div class="metric-card card-warn">
          <span class="card-label">Reversals</span>
          <span class="card-value">{{ reversedCount() }}</span>
        </div>

        <div class="metric-card card-primary">
          <span class="card-label">Total Volume</span>
          <span class="card-value">{{ totalVolume() | currency:'INR':'symbol':'1.0-0' }}</span>
        </div>
      </div>

      <!-- Search & Filter Controls -->
      <div class="toolbar-panel">
        <div class="search-field">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Search Entries</mat-label>
            <input
              matInput
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by entry # (JE-...) or description..."
            />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <div class="status-filter">
          <mat-button-toggle-group
            [value]="statusFilter()"
            (change)="statusFilter.set($event.value)"
            aria-label="Filter Entry Status"
          >
            <mat-button-toggle value="ALL">All Entries ({{ store.recentEntries().length }})</mat-button-toggle>
            <mat-button-toggle value="ACTIVE">Active ({{ activeCount() }})</mat-button-toggle>
            <mat-button-toggle value="REVERSED">Reversals ({{ reversedCount() }})</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <!-- Journal Entries List Component -->
      @if (store.isLoading()) {
        <div class="loading-state" role="status" aria-label="Loading journal entries">
          <div class="loading-spinner"></div>
          <span>Loading journal entries history...</span>
        </div>
      } @else {
        <app-journal-entries-list
          [entries]="filteredEntries()"
          [accounts]="store.accounts()"
          (reverseRequested)="onReverseRequested($event)"
        />
      }
    </div>
  `,
  styles: [`
    .entries-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-title {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0.25rem 0 0;
    }

    .post-form-section {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;

      .section-title {
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0 0 1rem;
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      padding: 0.85rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .card-label {
      font-size: 0.725rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--mat-sys-outline);
      letter-spacing: 0.5px;
    }

    .card-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .card-success .card-value { color: var(--mat-sys-success); }
    .card-warn .card-value { color: var(--mat-sys-error); }
    .card-primary .card-value { color: var(--mat-sys-primary); }

    .toolbar-panel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      padding: 0.85rem 1rem;
    }

    .search-field {
      flex: 1;
      min-width: 260px;
    }

    .w-full {
      width: 100%;
    }

    .status-filter {
      display: flex;
      align-items: center;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      padding: 2rem;
      justify-content: center;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--mat-sys-outline-variant);
      border-top-color: var(--mat-sys-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class JournalEntriesPageComponent implements OnInit {
  protected readonly store = inject(LedgerStoreService);

  /** Search query signal for live description/number filtering. */
  protected readonly searchQuery = signal<string>('');

  /** Active status filter selection. */
  protected readonly statusFilter = signal<JournalStatusFilter>('ALL');

  /** UI signal for toggling post entry form visibility. */
  protected readonly isPostingOpen = signal<boolean>(false);

  /** Computed count of active non-reversal entries. */
  protected readonly activeCount = computed(() => {
    return this.store.recentEntries().filter((e) => !e.description.startsWith('[REVERSAL]')).length;
  });

  /** Computed count of reversal entries. */
  protected readonly reversedCount = computed(() => {
    return this.store.recentEntries().filter((e) => e.description.startsWith('[REVERSAL]')).length;
  });

  /** Computed sum of total transaction volume in base currency. */
  protected readonly totalVolume = computed(() => {
    return this.store.recentEntries().reduce((sum, entry) => {
      const debitSum = entry.postings
        .filter((p) => p.type === 'DEBIT')
        .reduce((s, p) => s + p.amount, 0);
      return sum + debitSum;
    }, 0);
  });

  /** Filtered journal entries based on search term and selected status filter. */
  protected readonly filteredEntries = computed<DisplayJournalEntry[]>(() => {
    const raw = this.store.recentEntries();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return raw.filter((entry) => {
      // 1. Status Filter
      const isRev = entry.description.startsWith('[REVERSAL]');
      if (status === 'ACTIVE' && isRev) return false;
      if (status === 'REVERSED' && !isRev) return false;

      // 2. Search Query Filter
      if (!query) return true;

      const numMatch = entry.entryNumber.toLowerCase().includes(query);
      const descMatch = entry.description.toLowerCase().includes(query);
      return numMatch || descMatch;
    });
  });

  public ngOnInit(): void {
    this.store.loadAll(true);
  }

  protected togglePostForm(): void {
    this.isPostingOpen.update(v => !v);
  }

  protected onEntrySubmit(input: CreateJournalEntryInput): void {
    this.store.postJournalEntry(input);
    this.isPostingOpen.set(false);
  }

  /**
   * Refreshes journal entries dataset from backend API.
   */
  protected refreshEntries(): void {
    this.store.loadAll(false);
  }

  /**
   * Submits entry reversal request to store.
   *
   * @param event Target entry reversal payload
   */
  protected onReverseRequested(event: { entry: DisplayJournalEntry; reason: string }): void {
    this.store.reverseJournalEntry(event.entry, event.reason);
  }
}
