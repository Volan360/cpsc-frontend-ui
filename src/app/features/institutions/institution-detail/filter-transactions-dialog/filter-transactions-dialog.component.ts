import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { getDefaultDate, getMaxDate } from '@core/utils/date.utils';

export type FilterType = 'before' | 'after' | 'between' | 'on';

export interface TransactionFilter {
  filterType: FilterType;
  startDate?: Date;
  endDate?: Date;
}

@Component({
  selector: 'app-filter-transactions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatRadioModule
  ],
  templateUrl: './filter-transactions-dialog.component.html',
  styleUrls: ['./filter-transactions-dialog.component.scss']
})
export class FilterTransactionsDialogComponent implements OnInit {
  filterForm: FormGroup;
  maxDate = getMaxDate(); // Prevent future dates

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FilterTransactionsDialogComponent>
  ) {
    this.filterForm = this.fb.group({
      filterType: ['between', Validators.required],
      startDate: [getDefaultDate()],
      endDate: [getDefaultDate()]
    });
  }

  ngOnInit(): void {
    // Update validators when filter type changes
    this.filterForm.get('filterType')?.valueChanges.subscribe(filterType => {
      this.updateValidators(filterType);
    });

    // Initialize validators
    this.updateValidators('between');
  }

  private updateValidators(filterType: FilterType): void {
    const startDateControl = this.filterForm.get('startDate');
    const endDateControl = this.filterForm.get('endDate');

    // Clear validators
    startDateControl?.clearValidators();
    endDateControl?.clearValidators();

    // Set validators based on filter type
    if (filterType === 'before') {
      endDateControl?.setValidators([Validators.required]);
      startDateControl?.setValue(null);
    } else if (filterType === 'after') {
      startDateControl?.setValidators([Validators.required]);
      endDateControl?.setValue(null);
    } else if (filterType === 'between') {
      startDateControl?.setValidators([Validators.required]);
      endDateControl?.setValidators([Validators.required]);
    } else if (filterType === 'on') {
      startDateControl?.setValidators([Validators.required]);
      endDateControl?.setValue(null);
    }

    startDateControl?.updateValueAndValidity();
    endDateControl?.updateValueAndValidity();
  }

  onApply(): void {
    if (this.filterForm.valid) {
      const result: TransactionFilter = {
        filterType: this.filterForm.value.filterType,
        startDate: this.filterForm.value.startDate,
        endDate: this.filterForm.value.endDate
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get showStartDate(): boolean {
    const filterType = this.filterForm.get('filterType')?.value;
    return filterType === 'after' || filterType === 'between' || filterType === 'on';
  }

  get showEndDate(): boolean {
    const filterType = this.filterForm.get('filterType')?.value;
    return filterType === 'before' || filterType === 'between';
  }

  get startDateLabel(): string {
    const filterType = this.filterForm.get('filterType')?.value;
    if (filterType === 'on') return 'On Date';
    return filterType === 'between' ? 'Start Date' : 'After Date';
  }

  get endDateLabel(): string {
    const filterType = this.filterForm.get('filterType')?.value;
    return filterType === 'between' ? 'End Date' : 'Before Date';
  }
}
