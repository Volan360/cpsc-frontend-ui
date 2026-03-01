import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AnalyticsRequest,
  AnalyticsResponse,
  HealthScoreResponse,
} from '@core/models/analytics.models';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/analytics/generate
   * Computes analytics for the requested type and optional date range.
   */
  generate(request: AnalyticsRequest): Observable<AnalyticsResponse> {
    return this.http.post<AnalyticsResponse>(`${this.apiUrl}/generate`, request);
  }

  /**
   * GET /api/analytics/health-score
   * Returns the composite financial health score (0-100) with component breakdown.
   */
  getHealthScore(startDate?: string, endDate?: string): Observable<HealthScoreResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<HealthScoreResponse>(`${this.apiUrl}/health-score`, { params });
  }
}
