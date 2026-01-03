import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TransactionService } from '@core/services/transaction.service';
import { InstitutionService } from '@core/services/institution.service';
import { TransactionType } from '@core/models/transaction.models';
import { NotificationService } from '@core/services/notification.service';
import { getDefaultDate, dateToUnixTimestamp, getMaxDate } from '@core/utils/date.utils';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-create-transaction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './create-transaction-dialog.component.html',
  styleUrls: ['./create-transaction-dialog.component.scss']
})
export class CreateTransactionDialogComponent implements OnInit {
  transactionForm: FormGroup;
  submitting = false;
  transactionTypes = [TransactionType.DEPOSIT, TransactionType.WITHDRAWAL];
  tags: string[] = [];
  tagControl = new FormControl('');
  allTags: string[] = [];
  filteredTags$: Observable<string[]>;
  maxDate = getMaxDate(); // Prevent future dates

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private institutionService: InstitutionService,
    private dialogRef: MatDialogRef<CreateTransactionDialogComponent>,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { institutionId: string }
  ) {
    this.transactionForm = this.fb.group({
      type: [TransactionType.DEPOSIT, Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.maxLength(500)],
      transactionDate: [getDefaultDate()]  // Default to today's date
    });

    // Set up autocomplete filtering
    this.filteredTags$ = this.tagControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

  ngOnInit(): void {
    // Load all previously used tags from all institutions
    this.institutionService.getInstitutions().subscribe({
      next: (response) => {
        const tagSet = new Set<string>();
        
        // Fetch transactions for each institution and collect unique tags
        response.institutions.forEach(institution => {
          this.transactionService.getInstitutionTransactions(institution.institutionId.toString()).subscribe({
            next: (transactions) => {
              transactions.forEach(transaction => {
                if (transaction.tags && transaction.tags.length > 0) {
                  transaction.tags.forEach(tag => tagSet.add(tag));
                }
              });
              this.allTags = Array.from(tagSet).sort();
            },
            error: (error) => {
              console.error(`Error fetching transactions for institution ${institution.institutionId}:`, error);
            }
          });
        });
      },
      error: (error) => {
        console.error('Error fetching institutions:', error);
      }
    });
  }

  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => 
      tag.toLowerCase().includes(filterValue) && !this.tags.includes(tag)
    );
  }

  addTag(tag?: string): void {
    const value = tag || this.tagControl.value?.trim();
    
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.tagControl.setValue('');
      
      // Add to allTags if it's a new tag
      if (!this.allTags.includes(value)) {
        this.allTags.push(value);
        this.allTags.sort();
      }
    }
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  onTagInputFocus(): void {
    // Trigger value change to update filtered tags, then open the panel
    this.tagControl.updateValueAndValidity();
    
    // Use setTimeout to ensure the value change propagates before opening
    setTimeout(() => {
      if (this.autocompleteTrigger) {
        this.autocompleteTrigger.openPanel();
      }
    }, 0);
  }

  onAmountFocus(): void {
    // Clear the field if it's 0
    if (this.transactionForm.get('amount')?.value === 0) {
      this.transactionForm.patchValue({ amount: null });
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.transactionForm.valid && !this.submitting) {
      this.submitting = true;
      
      const formValue = this.transactionForm.value;
      const requestData: any = {
        type: formValue.type,
        amount: formValue.amount,
        description: formValue.description || undefined,
        tags: this.tags.length > 0 ? this.tags : undefined
      };

      // Convert date to UNIX timestamp if provided
      if (formValue.transactionDate) {
        requestData.transactionDate = dateToUnixTimestamp(formValue.transactionDate);
      }

      this.transactionService.createTransaction(this.data.institutionId, requestData).subscribe({
        next: (response) => {
          this.notificationService.success('Transaction created successfully');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          this.notificationService.error(error.error?.error || 'Failed to create transaction');
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
