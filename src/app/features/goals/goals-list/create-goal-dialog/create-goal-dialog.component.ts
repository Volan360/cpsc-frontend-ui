import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { GoalService } from '@core/services/goal.service';
import { GoalResponse } from '@core/models/goal.models';
import { InstitutionResponse } from '@core/models/institution.models';
import { NotificationService } from '@core/services/notification.service';

interface InstitutionAllocation {
  institutionId: string;
  institutionName: string;
  percentage: number;
  currentBalance: number;
  allocatedAmount: number;
  maxAvailable: number;
}

@Component({
  selector: 'app-create-goal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatSliderModule
  ],
  templateUrl: './create-goal-dialog.component.html',
  styleUrls: ['./create-goal-dialog.component.scss']
})
export class CreateGoalDialogComponent implements OnInit {
  goalForm: FormGroup;
  submitting = false;
  isEditMode = false;
  institutions: InstitutionResponse[] = [];
  allocations: InstitutionAllocation[] = [];
  selectedInstitutionId: string = '';
  allocationPercentage: number = 0;
  isDesktop = true;

  constructor(
    private fb: FormBuilder,
    private goalService: GoalService,
    private dialogRef: MatDialogRef<CreateGoalDialogComponent>,
    private notificationService: NotificationService,
    private breakpointObserver: BreakpointObserver,
    @Inject(MAT_DIALOG_DATA) public data?: { goal?: GoalResponse; institutions: InstitutionResponse[] }
  ) {
    this.isEditMode = !!data?.goal;
    this.institutions = data?.institutions || [];
    
    // Target amount is required for creating, optional for editing
    const targetAmountValidators = this.isEditMode 
      ? [Validators.min(0)] 
      : [Validators.required, Validators.min(0.01)];
    
    this.goalForm = this.fb.group({
      name: [data?.goal?.name || '', [Validators.required, Validators.maxLength(100)]],
      description: [data?.goal?.description || '', [Validators.maxLength(500)]],
      targetAmount: [data?.goal?.targetAmount || null, targetAmountValidators]
    });
  }

  ngOnInit(): void {
    // Detect if desktop or mobile
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isDesktop = !result.matches;
    });

    // Load existing allocations if editing
    if (this.isEditMode && this.data?.goal?.linkedInstitutions) {
      for (const [institutionId, percentage] of Object.entries(this.data.goal.linkedInstitutions)) {
        const institution = this.institutions.find(i => i.institutionId === institutionId);
        if (institution) {
          const allocatedAmount = (institution.currentBalance * percentage) / 100;
          const currentAllocated = institution.allocatedPercent || 0;
          const maxAvailable = 100 - currentAllocated + percentage;
          this.allocations.push({
            institutionId,
            institutionName: institution.institutionName,
            percentage,
            currentBalance: institution.currentBalance,
            allocatedAmount,
            maxAvailable
          });
        }
      }
    }
  }

  get availableInstitutions(): InstitutionResponse[] {
    const allocatedIds = this.allocations.map(a => a.institutionId);
    return this.institutions.filter(i => !allocatedIds.includes(i.institutionId));
  }

  get totalAllocation(): number {
    return this.allocations.reduce((sum, a) => sum + a.percentage, 0);
  }

  get totalAllocatedMoney(): number {
    return this.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPercent(value: number): string {
    return `${value}%`;
  }

  getMaxPercentage(institutionId: string): number {
    const institution = this.institutions.find(i => i.institutionId === institutionId);
    if (!institution) return 100;

    const currentAllocated = institution.allocatedPercent || 0;
    const currentGoalAllocation = this.isEditMode && this.data?.goal?.linkedInstitutions?.[institutionId] || 0;
    return 100 - currentAllocated + currentGoalAllocation;
  }

  onInstitutionSelected(institutionId: string): void {
    if (!institutionId) return;

    const institution = this.institutions.find(i => i.institutionId === institutionId);
    if (!institution) return;

    // Auto-add with 0% allocation
    const maxAvailable = this.getMaxPercentage(institutionId);
    this.allocations.push({
      institutionId,
      institutionName: institution.institutionName,
      percentage: 0,
      currentBalance: institution.currentBalance,
      allocatedAmount: 0,
      maxAvailable
    });

    this.selectedInstitutionId = '';
  }

  onSliderInput(event: any, allocation: InstitutionAllocation): void {
    const newValue = Number(event.target.value);
    // Immediately clamp to maxAvailable
    allocation.percentage = Math.min(newValue, allocation.maxAvailable);
    // Update allocated amount
    allocation.allocatedAmount = (allocation.currentBalance * allocation.percentage) / 100;
  }

  onPercentageChange(allocation: InstitutionAllocation): void {
    // For mobile number input - clamp percentage to maxAvailable
    if (allocation.percentage > allocation.maxAvailable) {
      allocation.percentage = allocation.maxAvailable;
    }
    // Update allocated amount when percentage changes
    allocation.allocatedAmount = (allocation.currentBalance * allocation.percentage) / 100;
  }

  removeAllocation(index: number): void {
    this.allocations.splice(index, 1);
  }

  onSubmit(): void {
    if (this.goalForm.valid && !this.submitting) {
      this.submitting = true;

      // Convert allocations to linkedInstitutions map
      const linkedInstitutions: { [key: string]: number } = {};
      this.allocations.forEach(a => {
        linkedInstitutions[a.institutionId] = a.percentage;
      });

      const request = {
        ...this.goalForm.value,
        linkedInstitutions
      };
      
      if (this.isEditMode && this.data?.goal) {
        this.goalService.editGoal(this.data.goal.goalId, request).subscribe({
          next: (response) => {
            this.notificationService.success('Goal updated successfully');
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error updating goal:', error);
            this.notificationService.error(error.error?.error || 'Failed to update goal');
            this.submitting = false;
          }
        });
      } else {
        this.goalService.createGoal(request).subscribe({
          next: (response) => {
            this.notificationService.success('Goal created successfully');
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error creating goal:', error);
            this.notificationService.error(error.error?.error || 'Failed to create goal');
            this.submitting = false;
          }
        });
      }
    }
  }

  onTargetAmountFocus(): void {
    if (this.goalForm.get('targetAmount')?.value === 0) {
      this.goalForm.patchValue({ targetAmount: null });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
