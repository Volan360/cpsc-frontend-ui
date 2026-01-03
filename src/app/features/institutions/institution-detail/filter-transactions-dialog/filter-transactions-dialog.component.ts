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
import { MatExpansionModule } from '@angular/material/expansion';
import { getDefaultDate, getMaxDate } from '@core/utils/date.utils';
import { TransactionService } from '@core/services/transaction.service';
import { InstitutionService } from '@core/services/institution.service';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export type FilterType = 'before' | 'after' | 'between' | 'on';
export type TagFilterMode = 'all' | 'any';
export type AmountFilterType = 'less' | 'greater' | 'between';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface TransactionFilter {
  filterType: FilterType;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  noTags?: boolean;
  tagFilterMode?: TagFilterMode;
  types?: TransactionType[];
  amountFilterType?: AmountFilterType;
  minAmount?: number;
  maxAmount?: number;
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
    MatCheckboxModule,
    MatExpansionModule
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
      dateFilterEnabled: [existingFilter?.startDate !== undefined || existingFilter?.endDate !== undefined],
      filterType: [existingFilter?.filterType || 'on', Validators.required],
      startDate: [existingFilter?.startDate || getDefaultDate()],
      endDate: [existingFilter?.endDate || getDefaultDate()],
      typeFilterEnabled: [existingFilter?.types !== undefined && existingFilter.types.length > 0],
      depositSelected: [existingFilter?.types?.includes('DEPOSIT') || false],
      withdrawalSelected: [existingFilter?.types?.includes('WITHDRAWAL') || false],
      amountFilterEnabled: [existingFilter?.minAmount !== undefined || existingFilter?.maxAmount !== undefined],
      amountFilterType: [existingFilter?.amountFilterType || 'between'],
      minAmount: [existingFilter?.minAmount || null],
      maxAmount: [existingFilter?.maxAmount || null],
      tagFilterEnabled: [existingFilter?.tags !== undefined || existingFilter?.noTags === true],
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
    this.updateValidators('on');

    // Update amount validators when amount filter type changes
    this.filterForm.get('amountFilterType')?.valueChanges.subscribe(amountFilterType => {
      this.updateAmountValidators(amountFilterType);
    });

    // Initialize amount validators
    this.updateAmountValidators(this.filterForm.get('amountFilterType')?.value);

    // Load all tags from transactions
    this.loadAvailableTags();

    // Auto-enable filters when user makes selections
    this.filterForm.get('depositSelected')?.valueChanges.subscribe(() => {
      if (this.filterForm.get('depositSelected')?.value || this.filterForm.get('withdrawalSelected')?.value) {
        this.filterForm.get('typeFilterEnabled')?.setValue(true, { emitEvent: false });
      }
    });

    this.filterForm.get('withdrawalSelected')?.valueChanges.subscribe(() => {
      if (this.filterForm.get('depositSelected')?.value || this.filterForm.get('withdrawalSelected')?.value) {
        this.filterForm.get('typeFilterEnabled')?.setValue(true, { emitEvent: false });
      }
    });

    this.filterForm.get('filterType')?.valueChanges.subscribe(() => {
      this.filterForm.get('dateFilterEnabled')?.setValue(true, { emitEvent: false });
    });

    this.filterForm.get('startDate')?.valueChanges.subscribe(() => {
      this.filterForm.get('dateFilterEnabled')?.setValue(true, { emitEvent: false });
    });

    this.filterForm.get('endDate')?.valueChanges.subscribe(() => {
      this.filterForm.get('dateFilterEnabled')?.setValue(true, { emitEvent: false });
    });

    this.filterForm.get('amountFilterType')?.valueChanges.subscribe(() => {
      this.filterForm.get('amountFilterEnabled')?.setValue(true, { emitEvent: false });
    });

    this.filterForm.get('minAmount')?.valueChanges.subscribe(() => {
      if (this.filterForm.get('minAmount')?.value !== null) {
        this.filterForm.get('amountFilterEnabled')?.setValue(true, { emitEvent: false });
      }
    });

    this.filterForm.get('maxAmount')?.valueChanges.subscribe(() => {
      if (this.filterForm.get('maxAmount')?.value !== null) {
        this.filterForm.get('amountFilterEnabled')?.setValue(true, { emitEvent: false });
      }
    });

    this.filterForm.get('noTags')?.valueChanges.subscribe(() => {
      this.filterForm.get('tagFilterEnabled')?.setValue(true, { emitEvent: false });
    });
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

  private updateAmountValidators(amountFilterType: AmountFilterType): void {
    const minAmountControl = this.filterForm.get('minAmount');
    const maxAmountControl = this.filterForm.get('maxAmount');

    // Clear validators
    minAmountControl?.clearValidators();
    maxAmountControl?.clearValidators();

    // Set validators based on amount filter type (only min value, not required)
    if (amountFilterType === 'less') {
      maxAmountControl?.setValidators([Validators.min(0.01)]);
      minAmountControl?.setValue(null);
    } else if (amountFilterType === 'greater') {
      minAmountControl?.setValidators([Validators.min(0.01)]);
      maxAmountControl?.setValue(null);
    } else if (amountFilterType === 'between') {
      minAmountControl?.setValidators([Validators.min(0.01)]);
      maxAmountControl?.setValidators([Validators.min(0.01)]);
    }

    minAmountControl?.updateValueAndValidity();
    maxAmountControl?.updateValueAndValidity();
  }

  onApply(): void {
    if (this.filterForm.valid) {
      const types: TransactionType[] = [];
      if (this.filterForm.value.depositSelected) types.push('DEPOSIT');
      if (this.filterForm.value.withdrawalSelected) types.push('WITHDRAWAL');

      const result: TransactionFilter = {
        filterType: this.filterForm.value.filterType,
        startDate: this.filterForm.value.dateFilterEnabled ? this.filterForm.value.startDate : undefined,
        endDate: this.filterForm.value.dateFilterEnabled ? this.filterForm.value.endDate : undefined,
        tags: this.filterForm.value.tagFilterEnabled && this.selectedTags.length > 0 ? this.selectedTags : undefined,
        noTags: this.filterForm.value.tagFilterEnabled ? this.filterForm.value.noTags : undefined,
        tagFilterMode: this.filterForm.value.tagFilterEnabled ? this.filterForm.value.tagFilterMode : undefined,
        types: this.filterForm.value.typeFilterEnabled && types.length > 0 ? types : undefined,
        amountFilterType: this.filterForm.value.amountFilterEnabled ? this.filterForm.value.amountFilterType : undefined,
        minAmount: this.filterForm.value.amountFilterEnabled ? this.filterForm.value.minAmount : undefined,
        maxAmount: this.filterForm.value.amountFilterEnabled ? this.filterForm.value.maxAmount : undefined
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
    
    // Auto-enable tag filter when tags are selected
    if (this.selectedTags.length > 0) {
      this.filterForm.get('tagFilterEnabled')?.setValue(true, { emitEvent: false });
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  get showMinAmount(): boolean {
    return this.filterForm.get('amountFilterType')?.value === 'greater' || 
           this.filterForm.get('amountFilterType')?.value === 'between';
  }

  get showMaxAmount(): boolean {
    return this.filterForm.get('amountFilterType')?.value === 'less' || 
           this.filterForm.get('amountFilterType')?.value === 'between';
  }

  get minAmountLabel(): string {
    return this.filterForm.get('amountFilterType')?.value === 'between' ? 'Minimum Amount' : 'Amount';
  }

  get maxAmountLabel(): string {
    return this.filterForm.get('amountFilterType')?.value === 'between' ? 'Maximum Amount' : 'Amount';
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

  get isAnyFilterEnabled(): boolean {
    return this.filterForm.get('dateFilterEnabled')?.value ||
           this.filterForm.get('typeFilterEnabled')?.value ||
           this.filterForm.get('amountFilterEnabled')?.value ||
           this.filterForm.get('tagFilterEnabled')?.value;
  }
}
