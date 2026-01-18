import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoalService } from '@core/services/goal.service';
import { InstitutionService } from '@core/services/institution.service';
import { GoalResponse } from '@core/models/goal.models';
import { InstitutionResponse } from '@core/models/institution.models';
import { NotificationService } from '@core/services/notification.service';
import { formatDate, formatCurrency } from '@core/utils/date.utils';
import { forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from '@core/components/confirm-dialog/confirm-dialog.component';
import { CompleteGoalDialogComponent } from '../complete-goal-dialog/complete-goal-dialog.component';
import { CreateGoalDialogComponent } from '../goals-list/create-goal-dialog/create-goal-dialog.component';
import { decodeUuidFromUrl, encodeUuidForUrl } from '@core/utils/url.utils';

@Component({
  selector: 'app-goal-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './goal-detail.component.html',
  styleUrls: ['./goal-detail.component.scss']
})
export class GoalDetailComponent implements OnInit {
  goal?: GoalResponse;
  institutions: InstitutionResponse[] = [];
  loading = true;
  goalId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private goalService: GoalService,
    private institutionService: InstitutionService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const encodedId = this.route.snapshot.paramMap.get('id')!;
    this.goalId = decodeUuidFromUrl(encodedId);
    this.loadGoalData();
  }

  loadGoalData(): void {
    this.loading = true;
    
    forkJoin({
      goals: this.goalService.getGoals(),
      institutions: this.institutionService.getInstitutions(100)
    }).subscribe({
      next: ({ goals, institutions }) => {
        this.goal = goals.goals.find(g => g.goalId === this.goalId);
        this.institutions = institutions.institutions;
        
        if (!this.goal) {
          this.notificationService.error('Goal not found');
          this.router.navigate(['/goals']);
          return;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading goal:', error);
        this.notificationService.error('Failed to load goal');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/goals']);
  }

  editGoal(): void {
    if (!this.goal) return;

    const dialogRef = this.dialog.open(CreateGoalDialogComponent, {
      width: '500px',
      data: { goal: this.goal, institutions: this.institutions }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGoalData();
      }
    });
  }

  navigateToInstitution(institutionId: string): void {
    this.router.navigate(['/institutions', encodeUuidForUrl(institutionId)]);
  }

  completeGoal(): void {
    if (!this.goal || !this.goal.targetAmount) {
      this.notificationService.error('Goal must have a target amount to complete');
      return;
    }

    // Calculate transaction preview
    const transactionPreview = this.goalService.calculateTransactionPreview(this.goal, this.institutions);

    const dialogRef = this.dialog.open(CompleteGoalDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        goal: this.goal,
        institutions: this.institutions,
        transactions: transactionPreview,
        totalAmount: this.goal.targetAmount
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.goal) {
        this.goalService.completeGoalWithWithdrawal(this.goal, this.institutions).subscribe({
          next: () => {
            this.notificationService.success('Goal completed successfully');
            this.router.navigate(['/goals']);
          },
          error: (error) => {
            console.error('Error completing goal:', error);
            this.notificationService.error('Failed to complete goal');
          }
        });
      }
    });
  }

  deleteGoal(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Goal',
        message: `Are you sure you want to delete "${this.goal?.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.goal) {
        this.goalService.deleteGoal(this.goal.goalId).subscribe({
          next: () => {
            this.notificationService.success('Goal deleted successfully');
            this.router.navigate(['/goals']);
          },
          error: (error) => {
            console.error('Error deleting goal:', error);
            this.notificationService.error(error.error?.error || 'Failed to delete goal');
          }
        });
      }
    });
  }

  /**
   * Calculate the total amount saved for this goal
   */
  calculateCurrentAmount(): number {
    if (!this.goal) return 0;
    return this.goalService.calculateCurrentAmount(this.goal, this.institutions);
  }

  /**
   * Calculate progress percentage towards target
   */
  getProgressPercentage(): number {
    if (!this.goal?.targetAmount) {
      return 0;
    }
    const current = this.calculateCurrentAmount();
    const percentage = (current / this.goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * Get institution details for a linked institution
   */
  getInstitution(institutionId: string): InstitutionResponse | undefined {
    return this.institutions.find(i => i.institutionId === institutionId);
  }

  /**
   * Calculate the allocated amount from an institution
   */
  calculateAllocatedAmount(institutionId: string, percentage: number): number {
    const institution = this.getInstitution(institutionId);
    if (!institution) {
      return 0;
    }
    return (institution.currentBalance * percentage) / 100;
  }

  /**
   * Get completion status for display
   */
  getGoalStatus(): string {
    if (this.goal?.isCompleted) {
      return 'completed';
    }
    
    if (!this.goal?.targetAmount) {
      return 'active';
    }

    const progress = this.getProgressPercentage();
    if (progress >= 100) {
      return 'completed';
    } else if (progress >= 75) {
      return 'near-complete';
    } else if (progress >= 25) {
      return 'in-progress';
    } else {
      return 'just-started';
    }
  }

  /**
   * Get status label for display
   */
  getStatusLabel(): string {
    const status = this.getGoalStatus();
    const map: { [key: string]: string } = {
      'completed': 'Completed',
      'near-complete': 'Almost There',
      'in-progress': 'In Progress',
      'just-started': 'Getting Started',
      'active': 'Active'
    };
    return map[status] || 'Active';
  }

  formatDate = formatDate;
  formatCurrency = formatCurrency;
  Object = Object;

  getLinkedInstitutionsKeys(): string[] {
    return this.goal?.linkedInstitutions ? Object.keys(this.goal.linkedInstitutions) : [];
  }
}
