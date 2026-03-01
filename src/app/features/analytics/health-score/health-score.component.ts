import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AnalyticsService } from '@core/services/analytics.service';
import { HealthScoreResponse, HealthScoreComponent as HSComponent } from '@core/models/analytics.models';

@Component({
  selector: 'app-health-score',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './health-score.component.html',
  styleUrl: './health-score.component.scss',
})
export class HealthScoreComponent implements OnChanges {
  @Input() startDate = '';
  @Input() endDate = '';

  data: HealthScoreResponse | null = null;
  loading = false;
  error = '';

  readonly componentLabels: Record<string, string> = {
    savings_rate: 'Savings Rate',
    goal_progress: 'Goal Progress',
    spending_diversity: 'Spending Diversity',
    account_utilization: 'Account Utilization',
    transaction_regularity: 'Transaction Regularity',
  };

  readonly componentIcons: Record<string, string> = {
    savings_rate: 'savings',
    goal_progress: 'flag',
    spending_diversity: 'pie_chart',
    account_utilization: 'account_balance',
    transaction_regularity: 'event_repeat',
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['startDate'] || changes['endDate']) && this.startDate && this.endDate) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.analyticsService.getHealthScore(this.startDate, this.endDate).subscribe({
      next: resp => {
        this.data = resp;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error || 'Failed to load health score.';
        this.loading = false;
      },
    });
  }

  /** Returns the list of component keys in display order */
  get componentKeys(): string[] {
    return Object.keys(this.componentLabels);
  }

  getComponent(key: string): HSComponent | undefined {
    return this.data?.components?.[key];
  }

  /** CSS conic-gradient stop angle for the gauge ring */
  gaugeAngle(score: number): string {
    const clamped = Math.max(0, Math.min(100, score));
    return `${clamped * 3.6}deg`;
  }

  /** Color class based on score value */
  scoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /** Rating chip color */
  ratingColor(rating: string): string {
    const r = (rating || '').toLowerCase();
    if (r === 'excellent') return 'accent';
    if (r === 'good') return 'primary';
    return 'warn';
  }
}
