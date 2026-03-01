import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

import { AnalyticsService } from '@core/services/analytics.service';
import { GoalsData, GoalAnalyticsItem } from '@core/models/analytics.models';

@Component({
  selector: 'app-goals-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
  ],
  templateUrl: './goals-analytics.component.html',
  styleUrl: './goals-analytics.component.scss',
})
export class GoalsAnalyticsComponent implements OnInit {
  data: GoalsData | null = null;
  loading = false;
  error = '';

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.analyticsService
      .generate({ analyticsType: 'goals' })
      .subscribe({
        next: resp => {
          this.data = resp.data as GoalsData;
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.error || 'Failed to load goals data.';
          this.loading = false;
        },
      });
  }

  goalProgressClass(goal: GoalAnalyticsItem): string {
    if (goal.is_completed) return 'completed';
    const atRisk = this.data?.insights.at_risk?.some(
      (g: any) => (g.goal_id ?? g) === goal.goal_id
    );
    if (atRisk) return 'at-risk';
    if (goal.progress_percent >= 75) return 'near';
    return 'active';
  }

  goalIcon(goal: GoalAnalyticsItem): string {
    if (goal.is_completed) return 'check_circle';
    const atRisk = this.data?.insights.at_risk?.some(
      (g: any) => (g.goal_id ?? g) === goal.goal_id
    );
    if (atRisk) return 'warning';
    if (goal.progress_percent >= 75) return 'bolt';
    return 'flag';
  }
}
