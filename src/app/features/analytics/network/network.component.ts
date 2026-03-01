import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AnalyticsService } from '@core/services/analytics.service';
import { NetworkData, NetworkNode, NetworkEdge } from '@core/models/analytics.models';

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
  label: string;
  nodeType: string;
  balance: number;
  radius: number;
}

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './network.component.html',
  styleUrl: './network.component.scss',
})
export class NetworkComponent implements OnInit {
  data: NetworkData | null = null;
  loading = false;
  error = '';

  // SVG dimensions
  readonly svgW = 600;
  readonly svgH = 500;
  readonly cx = 300;
  readonly cy = 240;
  readonly radius = 190;

  nodeLayouts: NodeLayout[] = [];
  hoveredNode: NodeLayout | null = null;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.analyticsService
      .generate({ analyticsType: 'network' })
      .subscribe({
        next: resp => {
          this.data = resp.data as NetworkData;
          this.computeLayout();
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.error || 'Failed to load network data.';
          this.loading = false;
        },
      });
  }

  private computeLayout(): void {
    const nodes = this.data?.nodes ?? [];
    if (nodes.length === 0) { this.nodeLayouts = []; return; }

    const n = nodes.length;
    this.nodeLayouts = nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = this.cx + this.radius * Math.cos(angle);
      const y = this.cy + this.radius * Math.sin(angle);
      const balance = node.attributes?.balance ?? 0;
      const radius = 14 + Math.min(12, Math.sqrt(Math.abs(balance) / 500));
      return {
        id: node.id,
        x,
        y,
        label: node.attributes?.label ?? node.id,
        nodeType: node.attributes?.node_type ?? 'unknown',
        balance,
        radius,
      };
    });
  }

  nodeColor(nodeType: string): string {
    switch (nodeType) {
      case 'institution': return '#4A90E2';
      case 'goal':        return '#7B68EE';
      case 'category':    return '#4ECDC4';
      default:            return '#aaa';
    }
  }

  getEdgePoints(): { x1: number; y1: number; x2: number; y2: number; weight: number }[] {
    if (!this.data?.edges || this.nodeLayouts.length === 0) return [];
    const layoutMap = new Map(this.nodeLayouts.map(nl => [nl.id, nl]));
    return this.data.edges.map(edge => {
      const src = layoutMap.get(edge.source);
      const tgt = layoutMap.get(edge.target);
      if (!src || !tgt) return null;
      return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y, weight: edge.attributes?.weight ?? 1 };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  }

  edgeOpacity(weight: number): number {
    return Math.min(0.8, 0.15 + weight * 0.1);
  }

  edgeWidth(weight: number): number {
    return Math.min(4, 1 + weight * 0.3);
  }

  trackById(_: number, node: NodeLayout): string {
    return node.id;
  }
}
