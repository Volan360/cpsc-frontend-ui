import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';

import { AnalyticsService } from '@core/services/analytics.service';
import { NetworkData } from '@core/models/analytics.models';

export interface InstFlow {
  id: string;
  label: string;
  goals: { id: string; label: string; weight: number }[];
  topTags: { name: string; weight: number }[];
  totalTagFlow: number;
}

export interface CommunityInfo {
  id: number;
  size: number;
  institutions: string[];
  goals: string[];
  tags: string[];
}

export interface CentralityRow {
  label: string;
  nodeType: string;
  degree: number;
  betweenness: number;
  pagerank: number;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  nodeType: string;
  radius: number;
  totalFlow: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  weight: number;
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
export class NetworkComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('graphSvg', { static: false }) graphSvgRef!: ElementRef<SVGElement>;
  @ViewChild('graphTooltip', { static: false }) tooltipRef!: ElementRef<HTMLDivElement>;

  data: NetworkData | null = null;
  loading = false;
  error = '';

  instFlows: InstFlow[] = [];
  communities: CommunityInfo[] = [];
  centralityRows: CentralityRow[] = [];

  // ─── Centrality table pagination ─────────────────────────────────────────
  centralityPage = 0;
  readonly centralityPageSize = 10;

  get centralityPagedRows(): CentralityRow[] {
    const start = this.centralityPage * this.centralityPageSize;
    return this.centralityRows.slice(start, start + this.centralityPageSize);
  }
  get centralityTotalPages(): number {
    return Math.ceil(this.centralityRows.length / this.centralityPageSize);
  }
  get centralityStartIndex(): number {
    return this.centralityRows.length === 0 ? 0 : this.centralityPage * this.centralityPageSize + 1;
  }
  get centralityEndIndex(): number {
    return Math.min((this.centralityPage + 1) * this.centralityPageSize, this.centralityRows.length);
  }
  centralityPrev(): void { if (this.centralityPage > 0) this.centralityPage--; }
  centralityNext(): void { if (this.centralityPage < this.centralityTotalPages - 1) this.centralityPage++; }

  private simulation: d3.Simulation<D3Node, D3Link> | null = null;
  private _dataReady = false;
  private _viewReady = false;

  constructor(
    private analyticsService: AnalyticsService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this._viewReady = true;
    if (this._dataReady) this.buildGraph();
  }

  ngOnDestroy(): void { this.simulation?.stop(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.analyticsService
      .generate({ analyticsType: 'network' })
      .subscribe({
        next: resp => {
          this.data = resp.data as NetworkData;
          this.computeFlows();
          this.computeCommunities();
          this.computeCentrality();
          this.loading = false;
          this._dataReady = true;
          setTimeout(() => { if (this._viewReady) this.buildGraph(); }, 80);
        },
        error: err => {
          this.error = err?.error?.error || 'Failed to load network data.';
          this.loading = false;
        },
      });
  }

  // ─── D3 Graph ──────────────────────────────────────────────────────────────

  private d3NodeColor(type: string): string {
    switch (type) {
      case 'institution': return '#4A90E2';
      case 'goal':        return '#7B68EE';
      default:            return '#4ECDC4';
    }
  }

  private d3NodeRadius(type: string): number {
    switch (type) {
      case 'institution': return 22;
      case 'goal':        return 14;
      default:            return 8;
    }
  }

  buildGraph(): void {
    if (!this.data || !this.graphSvgRef) return;
    this.simulation?.stop();

    const svgEl = this.graphSvgRef.nativeElement;
    const tooltip = this.tooltipRef?.nativeElement;
    const W = svgEl.clientWidth || 800;
    const H = W < 500 ? 360 : W < 700 ? 440 : 520;

    const nodes: D3Node[] = this.data.nodes.map(n => {
      const attrs = n.attributes as Record<string, unknown> | undefined;
      const type = String(attrs?.['type'] ?? attrs?.['node_type'] ?? 'tag');
      const label = String(attrs?.['name'] ?? attrs?.['label'] ?? n.id)
        .replace(/^(inst_|goal_|tag_)/, '');
      return { id: n.id, label, nodeType: type, radius: this.d3NodeRadius(type), totalFlow: 0 };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links: D3Link[] = this.data.edges
      .filter(e => nodeMap.has(e.source as string) && nodeMap.has(e.target as string))
      .map(e => ({
        source: e.source as string,
        target: e.target as string,
        weight: Number((e.attributes as Record<string, unknown>)?.['weight'] ?? 1),
      }));

    // Aggregate total flow into each node (sum of incoming edge weights)
    for (const link of links) {
      const tgt = nodeMap.get(link.target as string);
      if (tgt) tgt.totalFlow += link.weight;
    }

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', H);

    const g = svg.append('g');

    svg.call(
      d3.zoom<SVGElement, unknown>()
        .scaleExtent([0.15, 5])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Prevent browser from intercepting touch events (scroll/native zoom)
    // so D3 drag and pinch-zoom work correctly on mobile
    svg.style('touch-action', 'none');

    const maxW = d3.max(links, l => l.weight) ?? 1;
    const strokeScale = d3.scaleLog().domain([1, Math.max(maxW, 2)]).range([0.6, 5]).clamp(true);

    const link = g.append('g').attr('class', 'links')
      .selectAll('line').data(links).join('line')
        .attr('stroke', 'rgba(0,0,0,0.12)')
        .attr('stroke-width', d => strokeScale(Math.max(d.weight, 1)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dragBehavior: any = d3.drag<SVGGElement, D3Node>()
      .on('start', (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) => {
        if (!event.active) this.simulation!.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) => {
        d.fx = event.x; d.fy = event.y;
      })
      .on('end', (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) => {
        if (!event.active) this.simulation!.alphaTarget(0);
        d.fx = null; d.fy = null;
      });

    const node = g.append('g').attr('class', 'nodes')
      .selectAll('g').data(nodes).join('g')
        .attr('class', 'node-g')
        .style('cursor', 'grab')
        .call(dragBehavior);

    // Shadow halo
    node.append('circle')
      .attr('r', d => d.radius + 4)
      .attr('fill', d => this.d3NodeColor(d.nodeType))
      .attr('opacity', 0.12);

    // Main circle
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => this.d3NodeColor(d.nodeType))
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.nodeType === 'institution' ? 3 : 1.5);

    // Always-visible labels for institutions & goals
    node.filter(d => d.nodeType !== 'tag')
      .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', d => d.radius + 13)
        .attr('font-size', d => d.nodeType === 'institution' ? 11 : 9)
        .attr('font-weight', d => d.nodeType === 'institution' ? '700' : '500')
        .attr('fill', '#444')
        .attr('pointer-events', 'none')
        .text(d => d.label.length > 18 ? d.label.slice(0, 16) + '…' : d.label);

    // Tooltip helpers
    let touchDismissTimer: ReturnType<typeof setTimeout> | null = null;

    const buildTooltipHTML = (d: D3Node) => {
      const flowLine = d.totalFlow > 0
        ? `<div class="tt-flow">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.totalFlow)}</div>`
        : '';
      return `<div class="tt-type">${d.nodeType}</div><div class="tt-label">${d.label}</div>${flowLine}`;
    };

    if (tooltip) {
      // ── Mouse events ──────────────────────────────────────────────────────
      node
        .on('mouseenter', (event: MouseEvent, d: D3Node) => {
          tooltip.style.display = 'block';
          tooltip.innerHTML = buildTooltipHTML(d);
          this.positionTooltip(event.clientX, event.clientY, tooltip);
        })
        .on('mousemove', (event: MouseEvent) => this.positionTooltip(event.clientX, event.clientY, tooltip))
        .on('mouseleave', () => { tooltip.style.display = 'none'; });

      // ── Touch events (tap to show, auto-dismiss after 3 s) ────────────────
      node.on('touchstart.tooltip', (event: TouchEvent, d: D3Node) => {
        const touch = event.touches[0];
        tooltip.style.display = 'block';
        tooltip.innerHTML = buildTooltipHTML(d);
        this.positionTooltip(touch.clientX, touch.clientY, tooltip);
        if (touchDismissTimer) clearTimeout(touchDismissTimer);
        touchDismissTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 3000);
      }, { passive: true });

      // Tap on the SVG background dismisses the tooltip immediately
      svg.on('touchstart.dismissTooltip', () => {
        tooltip.style.display = 'none';
        if (touchDismissTimer) { clearTimeout(touchDismissTimer); touchDismissTimer = null; }
      }, { passive: true });
    }

    // Force simulation
    this.ngZone.runOutsideAngular(() => {
      this.simulation = d3.forceSimulation<D3Node>(nodes)
        .force('link', d3.forceLink<D3Node, D3Link>(links)
          .id(d => d.id)
          .distance(d => {
            const src = d.source as D3Node;
            const tgt = d.target as D3Node;
            if (src.nodeType === 'institution' || tgt.nodeType === 'institution') return 130;
            if (src.nodeType === 'goal'        || tgt.nodeType === 'goal')        return 90;
            return 55;
          })
          .strength(0.35)
        )
        .force('charge', d3.forceManyBody<D3Node>()
          .strength(d => d.nodeType === 'institution' ? -700 : d.nodeType === 'goal' ? -220 : -60)
        )
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collide', d3.forceCollide<D3Node>(d => d.radius + 12))
        .on('tick', () => {
          link
            .attr('x1', d => (d.source as D3Node).x!)
            .attr('y1', d => (d.source as D3Node).y!)
            .attr('x2', d => (d.target as D3Node).x!)
            .attr('y2', d => (d.target as D3Node).y!);
          node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });
    });
  }

  private positionTooltip(clientX: number, clientY: number, tooltip: HTMLDivElement): void {
    const parent = tooltip.offsetParent as HTMLElement ?? tooltip.parentElement!;
    const rect = parent.getBoundingClientRect();
    const ttW = tooltip.offsetWidth || 140;
    const ttH = tooltip.offsetHeight || 60;
    // Flip horizontally if too close to right edge
    const left = clientX - rect.left + 14;
    const right = rect.width - (clientX - rect.left) + 14;
    const top = clientY - rect.top - ttH - 12;
    if (left + ttW > rect.width - 8) {
      tooltip.style.right = `${right}px`;
      tooltip.style.left  = 'auto';
    } else {
      tooltip.style.left  = `${left}px`;
      tooltip.style.right = 'auto';
    }
    tooltip.style.top = `${Math.max(4, top)}px`;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private nodeLabelById(id: string): string {
    const node = this.data?.nodes.find(n => n.id === id);
    const attrs = node?.attributes as Record<string, unknown> | undefined;
    const name = attrs?.['name'] ?? attrs?.['label'] ?? id;
    return String(name).replace(/^(inst_|goal_|tag_)/, '');
  }

  private nodeTypeById(id: string): string {
    const node = this.data?.nodes.find(n => n.id === id);
    const attrs = node?.attributes as Record<string, unknown> | undefined;
    return String(attrs?.['type'] ?? attrs?.['node_type'] ?? 'unknown');
  }

  private computeFlows(): void {
    if (!this.data) return;
    const instNodes = this.data.nodes.filter(n => {
      const attrs = n.attributes as Record<string, unknown> | undefined;
      const t = String(attrs?.['type'] ?? attrs?.['node_type'] ?? '');
      return t === 'institution';
    });

    this.instFlows = instNodes.map(inst => {
      const outEdges = this.data!.edges.filter(e => e.source === inst.id);
      const goalEdges = outEdges.filter(e => (e.target as string).startsWith('goal_'));
      const tagEdges  = outEdges.filter(e => (e.target as string).startsWith('tag_'));

      const goals = goalEdges.map(e => ({
        id: e.target as string,
        label: this.nodeLabelById(e.target as string),
        weight: Number((e.attributes as Record<string, unknown>)?.['weight'] ?? 0),
      })).sort((a, b) => b.weight - a.weight);

      const tagsSorted = tagEdges.map(e => ({
        name: this.nodeLabelById(e.target as string),
        weight: Number((e.attributes as Record<string, unknown>)?.['weight'] ?? 0),
      })).sort((a, b) => b.weight - a.weight);

      const topTags = tagsSorted.slice(0, 8);
      const totalTagFlow = tagsSorted.reduce((s, t) => s + t.weight, 0);

      const attrs = inst.attributes as Record<string, unknown> | undefined;
      const label = String(attrs?.['name'] ?? attrs?.['label'] ?? inst.id);

      return { id: inst.id, label, goals, topTags, totalTagFlow };
    }).sort((a, b) => b.totalTagFlow - a.totalTagFlow);
  }

  private computeCommunities(): void {
    if (!this.data) return;
    const raw = (this.data as unknown as Record<string, unknown>)['communities'] as
      { communities?: { id: number; nodes: string[]; size: number }[]; num_communities?: number } | undefined;
    if (!raw?.communities) { this.communities = []; return; }

    this.communities = raw.communities.map(c => {
      const institutions: string[] = [];
      const goals: string[] = [];
      const tags: string[] = [];
      for (const nodeId of c.nodes) {
        const t = this.nodeTypeById(nodeId);
        const lbl = this.nodeLabelById(nodeId);
        if (t === 'institution') institutions.push(lbl);
        else if (t === 'goal')   goals.push(lbl);
        else                     tags.push(lbl);
      }
      return { id: c.id, size: c.size, institutions, goals, tags };
    });
  }

  private computeCentrality(): void {
    if (!this.data) return;
    const cent = (this.data as unknown as Record<string, unknown>)['centrality'] as
      Record<string, Record<string, number>> | undefined;
    if (!cent) { this.centralityRows = []; return; }

    const degree     = cent['degree_centrality']      ?? {};
    const between    = cent['betweenness_centrality'] ?? {};
    const pagerank   = cent['pagerank']               ?? {};

    // Union of all node IDs that appear in centrality data
    const ids = new Set([...Object.keys(degree), ...Object.keys(between), ...Object.keys(pagerank)]);

    this.centralityRows = Array.from(ids).map(id => ({
      label:      this.nodeLabelById(id),
      nodeType:   this.nodeTypeById(id),
      degree:     degree[id]   ?? 0,
      betweenness: between[id] ?? 0,
      pagerank:   pagerank[id] ?? 0,
    })).sort((a, b) => b.degree - a.degree).slice(0, 12);
  }

  communityColor(idx: number): string {
    const colors = ['#4A90E2', '#7B68EE', '#4ECDC4', '#F7A072', '#56C596'];
    return colors[idx % colors.length];
  }

  tagColor(weight: number, totalFlow: number): string {
    const pct = totalFlow > 0 ? weight / totalFlow : 0;
    if (pct > 0.3) return '#4A90E2';
    if (pct > 0.1) return '#7B68EE';
    if (pct > 0.05) return '#4ECDC4';
    return '#aaa';
  }
}
