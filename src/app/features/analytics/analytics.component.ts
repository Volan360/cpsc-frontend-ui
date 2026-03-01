import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HealthScoreComponent } from './health-score/health-score.component';
import { CashFlowComponent } from './cash-flow/cash-flow.component';
import { CategoriesComponent } from './categories/categories.component';
import { GoalsAnalyticsComponent } from './goals-analytics/goals-analytics.component';
import { InstitutionsAnalyticsComponent } from './institutions-analytics/institutions-analytics.component';
import { NetworkComponent } from './network/network.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatTooltipModule,
    HealthScoreComponent,
    CashFlowComponent,
    CategoriesComponent,
    GoalsAnalyticsComponent,
    InstitutionsAnalyticsComponent,
    NetworkComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit {
  dateForm!: FormGroup;

  /** ISO date strings passed down to child components */
  startDate = '';
  endDate = '';

  readonly maxDate = new Date();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Default date range: 1 Jan 2023 → 31 Dec 2025 (covers all test data)
    const defaultStart = new Date(2023, 0, 1);
    const defaultEnd = new Date(2025, 11, 31);

    this.dateForm = this.fb.group({
      start: [defaultStart],
      end: [defaultEnd],
    });

    this.applyDates();
  }

  applyDates(): void {
    const { start, end } = this.dateForm.value;
    if (start instanceof Date && end instanceof Date && start <= end) {
      this.startDate = this.toIsoDate(start);
      this.endDate = this.toIsoDate(end);
    }
  }

  resetDates(): void {
    this.dateForm.setValue({
      start: new Date(2023, 0, 1),
      end: new Date(2025, 11, 31),
    });
    this.applyDates();
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
