import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';

import { AnalyticsService } from '@core/services/analytics.service';
import { AnalyticsResponse, CashFlowData, CashFlowTrends } from '@core/models/analytics.models';

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    FormsModule,
  ],
  templateUrl: './cash-flow.component.html',
  styleUrl: './cash-flow.component.scss',
})
export class CashFlowComponent implements OnChanges {
  @Input() startDate = '';
  @Input() endDate = '';

  response: AnalyticsResponse | null = null;
  loading = false;
  error = '';

  groupBy: 'day' | 'week' | 'month' = 'month';

  anomaliesColumns = ['description', 'amount', 'type', 'date'];

  // Anomalies paginator state
  anomaliesPage = 0;
  anomaliesPageSize = 5;
  readonly anomaliesPageSizes = [5, 10, 25];

  // SVG chart config
  readonly chartW = 600;
  readonly chartH = 180;
  readonly chartPad = 40;

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
        analyticsType: 'cash_flow',
        dateRange: { start: this.startDate, end: this.endDate },
        options: { groupBy: this.groupBy },
      })
      .subscribe({
        next: resp => {
          this.response = resp;
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.error || 'Failed to load cash flow data.';
          this.loading = false;
        },
      });
  }

  get d(): CashFlowData | null {
    return this.response?.data as CashFlowData ?? null;
  }

  get trends(): CashFlowTrends | null {
    return this.d?.trends ?? null;
  }

  get netFlowPositive(): boolean {
    return (this.d?.summary?.net_cash_flow ?? 0) > 0;
  }

  // ─── SVG chart helpers ──────────────────────────────────────────────────────

  private buildPoints(values: number[], allValues: number[]): string {
    const n = values.length;
    if (n === 0) return '';
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 1);
    const range = max - min || 1;
    const drawW = this.chartW - 2 * this.chartPad;
    const drawH = this.chartH - 2 * this.chartPad;
    const xStep = n > 1 ? drawW / (n - 1) : 0;
    return values
      .map((v, i) => {
        const x = this.chartPad + i * xStep;
        const y = this.chartPad + drawH - ((v - min) / range) * drawH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  allValues(): number[] {
    if (!this.trends) return [0, 1];
    return [
      ...(this.trends.deposits ?? []),
      ...(this.trends.withdrawals ?? []),
      ...(this.trends.net_flows ?? []),
    ];
  }

  depositsPoints(): string {
    if (!this.trends?.deposits) return '';
    return this.buildPoints(this.trends.deposits, this.allValues());
  }

  withdrawalsPoints(): string {
    if (!this.trends?.withdrawals) return '';
    return this.buildPoints(this.trends.withdrawals, this.allValues());
  }

  netFlowPoints(): string {
    if (!this.trends?.net_flows) return '';
    return this.buildPoints(this.trends.net_flows, this.allValues());
  }

  xAxisLabels(): { x: number; label: string }[] {
    const periods = this.trends?.periods ?? [];
    if (periods.length === 0) return [];
    const drawW = this.chartW - 2 * this.chartPad;
    const step = periods.length > 1 ? drawW / (periods.length - 1) : 0;
    // Show max 8 labels to prevent crowding
    const skip = Math.max(1, Math.ceil(periods.length / 8));
    return periods
      .filter((_, i) => i % skip === 0 || i === periods.length - 1)
      .map((p, idx) => ({
        x: this.chartPad + idx * skip * step,
        label: p,
      }));
  }

  yAxisLabels(): { y: number; label: string }[] {
    const all = this.allValues();
    const min = Math.min(...all, 0);
    const max = Math.max(...all, 1);
    const drawH = this.chartH - 2 * this.chartPad;
    const ticks = 4;
    return Array.from({ length: ticks + 1 }, (_, i) => {
      const val = min + (max - min) * (i / ticks);
      const y = this.chartPad + drawH - (i / ticks) * drawH;
      return { y, label: this.shortCurrency(val) };
    });
  }

  zeroY(): number {
    const all = this.allValues();
    const min = Math.min(...all, 0);
    const max = Math.max(...all, 1);
    const range = max - min || 1;
    const drawH = this.chartH - 2 * this.chartPad;
    return this.chartPad + drawH - ((0 - min) / range) * drawH;
  }

  private shortCurrency(v: number): string {
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v.toFixed(0)}`;
  }

  get pagedAnomalies(): any[] {
    const all = this.d?.anomalies ?? [];
    const start = this.anomaliesPage * this.anomaliesPageSize;
    return all.slice(start, start + this.anomaliesPageSize);
  }

  onAnomaliesPage(e: PageEvent): void {
    this.anomaliesPage = e.pageIndex;
    this.anomaliesPageSize = e.pageSize;
  }
}
