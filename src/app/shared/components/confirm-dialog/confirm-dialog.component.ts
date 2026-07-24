import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Enterprise reusable confirmation modal dialog using Angular Material MatDialog.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="dialog-content">
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
      <button mat-flat-button color="warn" (click)="onConfirm()">{{ data.confirmText || 'Confirm' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      font-size: 0.95rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 1rem;
    }
  `]
})
export class ConfirmDialogComponent {
  public readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  public readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  public onConfirm(): void {
    this.dialogRef.close(true);
  }

  public onCancel(): void {
    this.dialogRef.close(false);
  }
}
