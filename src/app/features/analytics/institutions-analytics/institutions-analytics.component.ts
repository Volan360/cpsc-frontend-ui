import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { AnalyticsService } from '@core/services/analytics.service';
import { InstitutionsData, InstitutionAnalyticsItem } from '@core/models/analytics.models';

@Component({
  selector: 'app-institutions-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './institutions-analytics.component.html',
  styleUrl: './institutions-analytics.component.scss',
})
export class InstitutionsAnalyticsComponent implements OnChanges {
  @Input() startDate = '';
  @Input() endDate = '';

  data: InstitutionsData | null = null;
  loading = false;
  error = '';

  constructor(private analyticsService: AnalyticsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['startDate'] || changes['endDate']) && this.startDate && this.endDate) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.analyticsService
      .generate({
        analyticsType: 'institutions',
        dateRange: { start: this.startDate, end: this.endDate },
      })
      .subscribe({
        next: resp => {
          this.data = resp.data as InstitutionsData;
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.error || 'Failed to load institution data.';
          this.loading = false;
        },
      });
  }

  growthClass(inst: InstitutionAnalyticsItem): string {
    return inst.balances.change >= 0 ? 'positive' : 'negative';
  }

  growthIcon(inst: InstitutionAnalyticsItem): string {
    return inst.balances.change >= 0 ? 'trending_up' : 'trending_down';
  }

  activityClass(level: string): string {
    const lowered = level?.toLowerCase();
    if (lowered === 'high') return 'activity-high';
    if (lowered === 'low') return 'activity-low';
    return 'activity-medium';
  }

  utilizationWidth(score: number): number {
    return Math.min(100, Math.max(0, score));
  }
}
