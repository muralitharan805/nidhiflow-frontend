import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

/**
 * Enterprise reusable pagination wrapper using MatPaginator.
 */
@Component({
  selector: 'app-pagination',
  imports: [MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-paginator
      [length]="totalCount()"
      [pageSize]="pageSize()"
      [pageIndex]="pageIndex()"
      [pageSizeOptions]="pageSizeOptions()"
      showFirstLastButtons
      (page)="pageChanged.emit($event)"
      aria-label="Select page"
    ></mat-paginator>
  `,
  styles: [`
    mat-paginator {
      background-color: transparent;
    }
  `]
})
export class PaginationComponent {
  public readonly totalCount = input.required<number>();
  public readonly pageSize = input<number>(10);
  public readonly pageIndex = input<number>(0);
  public readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);

  public readonly pageChanged = output<PageEvent>();
}
