import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { AnalyticsService } from '@core/services/analytics.service';
import { CategoriesData, TopCategory } from '@core/models/analytics.models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnChanges {
  @Input() startDate = '';
  @Input() endDate = '';

  data: CategoriesData | null = null;
  loading = false;
  error = '';

  // Paginator state
  catsPage = 0;
  catsPageSize = 8;
  readonly catsPageSizes = [5, 8, 15, 25];
  coPage = 0;
  coPageSize = 5;
  readonly coPageSizes = [5, 10];
  detailPage = 0;
  detailPageSize = 10;
  readonly detailPageSizes = [10, 25, 50];

  // Palette for category bars (cycles)
  private readonly palette = [
    '#667eea', '#764ba2', '#4A90E2', '#4ECDC4', '#ff6b6b',
    '#ffd93d', '#6bcb77', '#ff922b', '#a29bfe', '#fd79a8',
  ];

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
        analyticsType: 'categories',
        dateRange: { start: this.startDate, end: this.endDate },
      })
      .subscribe({
        next: resp => {
          this.data = resp.data as CategoriesData;
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.error || 'Failed to load category data.';
          this.loading = false;
        },
      });
  }

  get topCategories(): TopCategory[] {
    return this.data?.top_categories ?? [];
  }

  get pagedCategories(): TopCategory[] {
    const start = this.catsPage * this.catsPageSize;
    return this.topCategories.slice(start, start + this.catsPageSize);
  }

  onCatsPage(e: PageEvent): void {
    this.catsPage = e.pageIndex;
    this.catsPageSize = e.pageSize;
  }

  colorFor(idx: number): string {
    return this.palette[idx % this.palette.length];
  }

  /** Bar width as percentage of the max category */
  barWidth(pct: number): number {
    const max = Math.max(...this.topCategories.map(c => c.percentage), 1);
    return (pct / max) * 100;
  }

  allCoOccurrences(): { a: string; b: string; weight: number }[] {
    const co = this.data?.co_occurrences ?? [];
    return co.map((item: any) => {
      if (Array.isArray(item)) {
        // [a, b, weight] tuple
        return { a: item[0], b: item[1], weight: item[2] };
      }
      // Backend shape: { category_1, category_2, count }
      if ('category_1' in item) {
        return { a: item.category_1, b: item.category_2, weight: item.count };
      }
      // Already normalised { a, b, weight }
      return item;
    });
  }

  get pagedCoOccurrences(): { a: string; b: string; weight: number }[] {
    const start = this.coPage * this.coPageSize;
    return this.allCoOccurrences().slice(start, start + this.coPageSize);
  }

  onCoPage(e: PageEvent): void {
    this.coPage = e.pageIndex;
    this.coPageSize = e.pageSize;
  }

  get detailEntries(): { key: string; value: number }[] {
    const totals = this.data?.categories?.totals ?? {};
    return Object.entries(totals)
      .map(([key, value]) => ({ key, value: value as number }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  get pagedDetailEntries(): { key: string; value: number }[] {
    const start = this.detailPage * this.detailPageSize;
    return this.detailEntries.slice(start, start + this.detailPageSize);
  }

  onDetailPage(e: PageEvent): void {
    this.detailPage = e.pageIndex;
    this.detailPageSize = e.pageSize;
  }
}
