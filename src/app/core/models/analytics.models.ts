// ─── Request types ────────────────────────────────────────────────────────────

export type AnalyticsType =
  | 'cash_flow'
  | 'categories'
  | 'goals'
  | 'institutions'
  | 'network'
  | 'health';

export interface AnalyticsDateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface AnalyticsOptions {
  groupBy?: 'day' | 'week' | 'month';
  transactionType?: string;
  graphType?: string;
  includeRecommendations?: boolean;
  userName?: string;
}

export interface AnalyticsRequest {
  analyticsType: AnalyticsType;
  dateRange?: AnalyticsDateRange;
  options?: AnalyticsOptions;
}

// ─── Generic response ──────────────────────────────────────────────────────────

export interface AnalyticsResponse {
  analyticsType: string;
  userId: string;
  generatedAt: string;
  dateRange?: AnalyticsDateRange;
  // data structure varies by analyticsType — typed below
  data: Record<string, any>;
}

// ─── Health Score ─────────────────────────────────────────────────────────────

export interface HealthScoreComponent {
  score: number;
  weight: number;
  contribution: number;
}

export interface HealthScoreResponse {
  overallScore: number;
  rating: string;
  components: {
    savings_rate?: HealthScoreComponent;
    goal_progress?: HealthScoreComponent;
    spending_diversity?: HealthScoreComponent;
    account_utilization?: HealthScoreComponent;
    transaction_regularity?: HealthScoreComponent;
    [key: string]: HealthScoreComponent | undefined;
  };
  recommendations: string[];
  periodDays: number;
  computedAt: string;
  userId: string;
}

// ─── Cash Flow data ───────────────────────────────────────────────────────────

export interface CashFlowSummary {
  total_deposits: number;
  total_withdrawals: number;
  net_cash_flow: number;
  transaction_count: number;
  deposit_count: number;
  withdrawal_count: number;
}

export interface CashFlowMetrics {
  savings_rate: number;
  daily_burn_rate: number;
  average_deposit: number;
  average_withdrawal: number;
  median_deposit: number;
  median_withdrawal: number;
  deposit_volatility: number;
  withdrawal_volatility: number;
}

export interface CashFlowTrends {
  periods: string[];
  net_flows: number[];
  deposits: number[];
  withdrawals: number[];
  moving_average: number[];
  trend_direction: 'improving' | 'declining' | 'stable';
  best_period: string;
  worst_period: string;
}

export interface CashFlowAnomaly {
  transaction_id: string;
  amount: number;
  type: string;
  description: string;
  z_score: number;
  transaction_date: string;
}

export interface CashFlowData {
  date_range: { start: string; end: string; days: number };
  summary: CashFlowSummary;
  metrics: CashFlowMetrics;
  balance: { current_total: number; runway_days: number | null };
  trends: CashFlowTrends;
  anomalies: CashFlowAnomaly[];
}

// ─── Categories data ──────────────────────────────────────────────────────────

export interface TopCategory {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CategoriesData {
  date_range: { start: string; end: string };
  summary: {
    total_amount: number;
    transaction_count: number;
    unique_categories: number;
    transaction_type: string;
  };
  categories: {
    totals: Record<string, number>;
    counts: Record<string, number>;
    averages: Record<string, number>;
    percentages: Record<string, number>;
  };
  top_categories: TopCategory[];
  trends: Record<string, any>;
  diversity: Record<string, any>;
  co_occurrences: any[];
}

// ─── Goals Analytics data ─────────────────────────────────────────────────────

export interface GoalAnalyticsItem {
  goal_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  remaining_amount: number;
  is_completed: boolean;
  is_active: boolean;
  recommendation?: string;
  monthly_contribution?: number;
  months_to_completion?: number;
  linked_institutions_count?: number;
}

export interface GoalsData {
  summary: {
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    total_target_amount: number;
    total_current_amount: number;
    overall_progress: number;
  };
  goals: GoalAnalyticsItem[];
  insights: {
    at_risk: GoalAnalyticsItem[];
    near_completion: GoalAnalyticsItem[];
    priorities: any[];
  };
}

// ─── Institutions Analytics data ──────────────────────────────────────────────

export interface InstitutionAnalyticsItem {
  institution_id: string;
  institution_name: string;
  balances: {
    starting: number;
    current: number;
    change: number;
    growth_rate: number;
  };
  transactions: {
    total_count: number;
    deposit_count: number;
    withdrawal_count: number;
    total_deposits: number;
    total_withdrawals: number;
    net_flow: number;
    avg_per_month: number;
  };
  goals: {
    linked_count: number;
    total_allocated_percent: number;
    linked_goal_names: string[];
  };
  metrics: {
    utilization_score: number;
    activity_level: string;
  };
}

export interface InstitutionsData {
  summary: {
    total_institutions: number;
    total_balance: number;
    total_starting_balance: number;
    total_growth: number;
    average_balance: number;
  };
  institutions: InstitutionAnalyticsItem[];
  rankings: Record<string, any>;
  underutilized: InstitutionAnalyticsItem[];
  portfolio: Record<string, any>;
}

// ─── Network Analytics data ───────────────────────────────────────────────────

export interface NetworkNode {
  id: string;
  attributes: {
    node_type: string;  // 'institution' | 'category' | 'goal'
    label: string;
    balance?: number;
    total_flow?: number;
    color?: string;
  };
}

export interface NetworkEdge {
  source: string;
  target: string;
  attributes: {
    weight: number;
    label?: string;
    flow_direction?: string;
  };
}

export interface NetworkData {
  graph_type: string;
  graph_stats: {
    nodes: number;
    edges: number;
    density: number;
    is_connected: boolean;
  };
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centrality: Record<string, Record<string, number>>;
  communities: Record<string, any>;
}
