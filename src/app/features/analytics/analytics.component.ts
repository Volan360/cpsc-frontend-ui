import { Component, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
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
export class AnalyticsComponent implements OnInit, AfterViewInit {
  dateForm!: FormGroup;

  /** ISO date strings passed down to child components */
  startDate = '';
  endDate = '';

  readonly maxDate = new Date();

  canScrollLeft = false;
  canScrollRight = false;
  activeTab = 0;

  get dateRangeDisabled(): boolean {
    // Goals (3) and Network (5) don't use the date range
    return this.activeTab === 3 || this.activeTab === 5;
  }

  constructor(private fb: FormBuilder, private el: ElementRef) {}

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

  ngAfterViewInit(): void {
    setTimeout(() => {
      const container = this.el.nativeElement
        .querySelector('.mat-mdc-tab-label-container') as HTMLElement | null;
      if (!container) return;

      container.addEventListener('scroll', () => {
        if (this._scrollLocked) {
          container.scrollLeft = this._savedTabScroll;
          return;
        }
        this.updateScrollIndicators(container);
      }, { passive: true });

      this.updateScrollIndicators(container);

      // Track pointer to distinguish a tap (no move) from a drag (move > threshold)
      const header = this.el.nativeElement
        .querySelector('.mat-mdc-tab-header') as HTMLElement | null;
      if (header) {
        let startX = 0;
        let isDrag = false;

        header.addEventListener('pointerdown', (e: PointerEvent) => {
          startX = e.clientX;
          isDrag = false;
          this._savedTabScroll = container.scrollLeft;
        }, { passive: true });

        header.addEventListener('pointermove', (e: PointerEvent) => {
          if (Math.abs(e.clientX - startX) > 6) {
            isDrag = true;
            this._scrollLocked = false; // release lock so drag scrolls freely
          }
        }, { passive: true });

        header.addEventListener('pointerup', () => {
          if (!isDrag) {
            // It was a tap — lock to preserve scroll position on tab change
            this._scrollLocked = true;
          }
        }, { passive: true });
      }
    }, 100);
  }

  private _savedTabScroll = 0;
  private _scrollLocked = false;

  private updateScrollIndicators(container: HTMLElement): void {
    const threshold = 4; // px tolerance for floating-point imprecision
    this.canScrollLeft = container.scrollLeft > threshold;
    this.canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth - threshold;
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTab = event.index;
    this.restoreTabScroll();
  }

  restoreTabScroll(): void {
    const container = this.el.nativeElement
      .querySelector('.mat-mdc-tab-label-container') as HTMLElement | null;
    if (!container) return;
    // Unlock after Material finishes all its internal scroll manipulation
    setTimeout(() => {
      this._scrollLocked = false;
      container.scrollLeft = this._savedTabScroll;
      this.updateScrollIndicators(container);
    }, 50);
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
