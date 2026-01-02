import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InstitutionService } from '@core/services/institution.service';
import { InstitutionResponse } from '@core/models/institution.models';

@Component({
  selector: 'app-create-institution-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './create-institution-dialog.component.html',
  styleUrls: ['./create-institution-dialog.component.scss']
})
export class CreateInstitutionDialogComponent {
  institutionForm: FormGroup;
  submitting = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private institutionService: InstitutionService,
    private dialogRef: MatDialogRef<CreateInstitutionDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data?: { institution: InstitutionResponse }
  ) {
    this.isEditMode = !!data?.institution;
    
    this.institutionForm = this.fb.group({
      institutionName: [data?.institution?.institutionName || '', [Validators.required, Validators.maxLength(100)]],
      startingBalance: [data?.institution?.startingBalance || 0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.institutionForm.valid && !this.submitting) {
      this.submitting = true;
      
      if (this.isEditMode && this.data?.institution) {
        this.institutionService.editInstitution(this.data.institution.institutionId, this.institutionForm.value).subscribe({
          next: (response) => {
            this.snackBar.open('Institution updated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error updating institution:', error);
            this.snackBar.open(error.error?.error || 'Failed to update institution', 'Close', { duration: 3000 });
            this.submitting = false;
          }
        });
      } else {
        this.institutionService.createInstitution(this.institutionForm.value).subscribe({
          next: (response) => {
            this.snackBar.open('Institution created successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error creating institution:', error);
            this.snackBar.open(error.error?.error || 'Failed to create institution', 'Close', { duration: 3000 });
            this.submitting = false;
          }
        });
      }
    }
  }

  onStartingBalanceFocus(): void {
    // Clear the field if it's 0
    if (this.institutionForm.get('startingBalance')?.value === 0) {
      this.institutionForm.patchValue({ startingBalance: null });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
