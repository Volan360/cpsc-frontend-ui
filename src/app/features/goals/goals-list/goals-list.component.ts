import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { GoalService } from '@core/services/goal.service';
import { InstitutionService } from '@core/services/institution.service';
import { GoalResponse } from '@core/models/goal.models';
import { InstitutionResponse } from '@core/models/institution.models';
import { CreateGoalDialogComponent } from './create-goal-dialog/create-goal-dialog.component';
import { ConfirmDialogComponent } from '@core/components/confirm-dialog/confirm-dialog.component';
import { CompleteGoalDialogComponent } from '../complete-goal-dialog/complete-goal-dialog.component';
import { NotificationService } from '@core/services/notification.service';
import { formatDate, formatCurrency } from '@core/utils/date.utils';
import { forkJoin } from 'rxjs';
import { encodeUuidForUrl } from '@core/utils/url.utils';

@Component({
  selector: 'app-goals-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTabsModule
  ],
  templateUrl: './goals-list.component.html',
  styleUrls: ['./goals-list.component.scss']
})
export class GoalsListComponent implements OnInit {
  goals: GoalResponse[] = [];
  activeGoals: GoalResponse[] = [];
  completedGoals: GoalResponse[] = [];
  paginatedGoals: GoalResponse[] = [];
  institutions: InstitutionResponse[] = [];
  displayedColumns: string[] = ['name', 'targetAmount', 'currentAmount', 'status', 'actions', 'chevron'];
  completedDisplayedColumns: string[] = ['name', 'targetAmount', 'completedAt', 'actions', 'chevron'];
  loading = true;
  nextToken?: string;
  private longPressTimer: any;
  private isLongPress = false;

  // Tab and pagination settings
  selectedTabIndex = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private goalService: GoalService,
    private institutionService: InstitutionService,
    private router: Router,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      goals: this.goalService.getGoals(50),
      institutions: this.institutionService.getInstitutions(100)
    }).subscribe({
      next: ({ goals, institutions }) => {
        this.goals = goals.goals;
        // Separate active and completed goals
        this.activeGoals = this.goals.filter(g => g.isActive !== false);
        this.completedGoals = this.goals.filter(g => g.isActive === false);
        this.institutions = institutions.institutions;
        this.nextToken = goals.nextToken;
        this.loading = false;
        
        // Update paginated view for current tab
        this.updatePageData();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.error('Failed to load goals');
        this.loading = false;
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.pageIndex = 0; // Reset to first page when switching tabs
    this.updatePageData();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageData();
  }

  getCurrentGoals(): GoalResponse[] {
    return this.selectedTabIndex === 0 ? this.activeGoals : this.completedGoals;
  }

  getTotalCount(): number {
    return this.getCurrentGoals().length;
  }

  private updatePageData(): void {
    const currentGoals = this.getCurrentGoals();
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedGoals = currentGoals.slice(startIndex, endIndex);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateGoalDialogComponent, {
      width: '500px',
      data: { institutions: this.institutions }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  editGoal(goal: GoalResponse, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(CreateGoalDialogComponent, {
      width: '500px',
      data: { goal, institutions: this.institutions }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  deleteGoal(goal: GoalResponse, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Goal',
        message: `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.goalService.deleteGoal(goal.goalId).subscribe({
          next: () => {
            this.notificationService.success('Goal deleted successfully');
            this.loadData();
          },
          error: (error) => {
            console.error('Error deleting goal:', error);
            this.notificationService.error('Failed to delete goal');
          }
        });
      }
    });
  }

  canCompleteGoal(goal: GoalResponse): boolean {
    return this.goalService.canCompleteGoal(goal, this.institutions);
  }

  completeGoal(goal: GoalResponse, event: Event): void {
    event.stopPropagation();
    
    if (!goal.targetAmount) return;

    // Calculate transaction preview
    const transactionPreview = this.goalService.calculateTransactionPreview(goal, this.institutions);

    const dialogRef = this.dialog.open(CompleteGoalDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        goal: goal,
        institutions: this.institutions,
        transactions: transactionPreview,
        totalAmount: goal.targetAmount
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.goalService.completeGoalWithWithdrawal(goal, this.institutions).subscribe({
          next: (completedGoal) => {
            this.notificationService.success('Goal completed successfully');
            this.loadData();
          },
          error: (error) => {
            console.error('Error completing goal:', error);
            const errorMessage = error?.error?.message || 'Failed to complete goal';
            this.notificationService.error(errorMessage);
          }
        });
      }
    });
  }

  viewGoal(goal: GoalResponse): void {
    this.router.navigate(['/goals', encodeUuidForUrl(goal.goalId)]);
  }

  /**
   * Calculate the total amount saved for a goal by summing institution balances
   */
  calculateCurrentAmount(goal: GoalResponse): number {
    return this.goalService.calculateCurrentAmount(goal, this.institutions);
  }

  /**
   * Get completion status for a goal
   */
  getGoalStatus(goal: GoalResponse): string {
    if (goal.isCompleted) {
      return 'completed';
    }
    
    if (!goal.targetAmount) {
      return 'active';
    }

    const currentAmount = this.calculateCurrentAmount(goal);
    const progress = (currentAmount / goal.targetAmount) * 100;

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
   * Get status label
   */
  getStatusLabel(goal: GoalResponse): string {
    const status = this.getGoalStatus(goal);
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

  onMobileTouchStart(goal: GoalResponse, event: TouchEvent): void {
    this.isLongPress = false;
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      this.editGoal(goal, event);
    }, 500);
  }

  onMobileTouchEnd(): void {
    clearTimeout(this.longPressTimer);
  }

  onMobileTouchMove(): void {
    clearTimeout(this.longPressTimer);
  }

  onMobileClick(goal: GoalResponse, event: Event): void {
    if (!this.isLongPress) {
      this.viewGoal(goal);
    }
    this.isLongPress = false;
  }
}
