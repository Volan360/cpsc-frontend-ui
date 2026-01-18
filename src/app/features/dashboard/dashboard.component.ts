import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { InstitutionService } from '@core/services/institution.service';
import { GoalService } from '@core/services/goal.service';
import { TransactionService } from '@core/services/transaction.service';
import { InstitutionResponse } from '@core/models/institution.models';
import { GoalResponse } from '@core/models/goal.models';
import { TransactionResponse, TransactionType } from '@core/models/transaction.models';
import { encodeUuidForUrl } from '@core/utils/url.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser = this.authService.currentUser;
  
  // Dashboard data
  totalBalance: number = 0;
  activeGoalsCount: number = 0;
  recentTransactions: TransactionResponse[] = [];
  institutions: InstitutionResponse[] = [];
  loading: boolean = true;

  constructor(
    public authService: AuthService,
    private router: Router,
    private institutionService: InstitutionService,
    private goalService: GoalService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    // Fetch user profile if not already loaded
    if (!this.currentUser()) {
      this.authService.getUserProfile().subscribe();
    }
    
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    forkJoin({
      institutions: this.institutionService.getInstitutions(),
      goals: this.goalService.getGoals()
    }).subscribe({
      next: (data) => {
        this.institutions = data.institutions.institutions || [];
        
        // Calculate total balance from all institutions
        this.totalBalance = this.institutions.reduce((sum, inst) => sum + (inst.currentBalance || 0), 0);
        
        // Count active goals (not completed)
        const allGoals = data.goals.goals || [];
        this.activeGoalsCount = allGoals.filter(goal => !goal.isCompleted).length;
        
        // Get recent transactions from all institutions
        this.loadRecentTransactions();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  loadRecentTransactions(): void {
    if (this.institutions.length === 0) {
      this.loading = false;
      return;
    }

    // Fetch transactions from all institutions
    const transactionRequests = this.institutions.map(inst => 
      this.transactionService.getInstitutionTransactions(inst.institutionId)
    );

    forkJoin(transactionRequests).subscribe({
      next: (allTransactions) => {
        // Flatten and sort by date
        const flatTransactions = allTransactions.flat();
        this.recentTransactions = flatTransactions
          .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
          .slice(0, 5); // Get 5 most recent
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loading = false;
      }
    });
  }

  getInstitutionName(institutionId: string): string {
    const institution = this.institutions.find(i => i.institutionId === institutionId);
    return institution?.institutionName || 'Unknown';
  }

  navigateToInstitutions(): void {
    this.router.navigate(['/institutions']);
  }

  navigateToGoals(): void {
    this.router.navigate(['/goals']);
  }

  navigateToProfileSettings(): void {
    this.router.navigate(['/profile-settings']);
  }

  navigateToHelp(): void {
    this.router.navigate(['/help']);
  }

  navigateToInstitutionDetail(institutionId: string): void {
    this.router.navigate(['/institutions', encodeUuidForUrl(institutionId)]);
  }
}
