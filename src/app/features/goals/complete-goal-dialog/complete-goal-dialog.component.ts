import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { GoalResponse } from '@core/models/goal.models';
import { InstitutionResponse } from '@core/models/institution.models';
import { formatCurrency } from '@core/utils/date.utils';

export interface TransactionPreview {
  institutionName: string;
  withdrawalAmount: number;
  percentage: number;
  currentBalance: number;
  remainingBalance: number;
}

export interface CompleteGoalDialogData {
  goal: GoalResponse;
  institutions: InstitutionResponse[];
  transactions: TransactionPreview[];
  totalAmount: number;
}

@Component({
  selector: 'app-complete-goal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule
  ],
  templateUrl: './complete-goal-dialog.component.html',
  styleUrls: ['./complete-goal-dialog.component.scss']
})
export class CompleteGoalDialogComponent {
  formatCurrency = formatCurrency;

  constructor(
    public dialogRef: MatDialogRef<CompleteGoalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompleteGoalDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
