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
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { getDefaultDate, getMaxDate } from '@core/utils/date.utils';
import { TransactionService } from '@core/services/transaction.service';
import { InstitutionService } from '@core/services/institution.service';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export type FilterType = 'before' | 'after' | 'between' | 'on';
export type TagFilterMode = 'all' | 'any';

export interface TransactionFilter {
  filterType: FilterType;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  noTags?: boolean;
  tagFilterMode?: TagFilterMode;
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
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './filter-transactions-dialog.component.html',
  styleUrls: ['./filter-transactions-dialog.component.scss']
})
export class FilterTransactionsDialogComponent implements OnInit {
  filterForm: FormGroup;
  maxDate = getMaxDate(); // Prevent future dates
  allTags: string[] = [];
  selectedTags: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FilterTransactionsDialogComponent>,
    private transactionService: TransactionService,
    private institutionService: InstitutionService,
    @Inject(MAT_DIALOG_DATA) public data: { institutionId: string; existingFilter?: TransactionFilter }
  ) {
    // Use existing filter values if available, otherwise use defaults
    const existingFilter = this.data.existingFilter;
    
    this.filterForm = this.fb.group({
      filterType: [existingFilter?.filterType || 'between', Validators.required],
      startDate: [existingFilter?.startDate || getDefaultDate()],
      endDate: [existingFilter?.endDate || getDefaultDate()],
      noTags: [existingFilter?.noTags || false],
      tagFilterMode: [existingFilter?.tagFilterMode || 'any']
    });

    // Prepopulate selected tags if they exist
    if (existingFilter?.tags) {
      this.selectedTags = [...existingFilter.tags];
    }
  }

  ngOnInit(): void {
    // Update validators when filter type changes
    this.filterForm.get('filterType')?.valueChanges.subscribe(filterType => {
      this.updateValidators(filterType);
    });

    // Initialize validators
    this.updateValidators('between');

    // Load all tags from transactions
    this.loadAvailableTags();
  }

  private loadAvailableTags(): void {
    this.transactionService.getInstitutionTransactions(this.data.institutionId).subscribe({
      next: (transactions) => {
        const tagSet = new Set<string>();
        transactions.forEach(transaction => {
          if (transaction.tags && transaction.tags.length > 0) {
            transaction.tags.forEach(tag => tagSet.add(tag));
          }
        });
        this.allTags = Array.from(tagSet).sort();
      },
      error: (error) => {
        console.error('Error loading tags:', error);
      }
    });
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
        endDate: this.filterForm.value.endDate,
        tags: this.selectedTags.length > 0 ? this.selectedTags : undefined,
        noTags: this.filterForm.value.noTags,
        tagFilterMode: this.filterForm.value.tagFilterMode
      };
      this.dialogRef.close(result);
    }
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
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
