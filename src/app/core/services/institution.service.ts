import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CreateInstitutionRequest,
  EditInstitutionRequest,
  InstitutionResponse,
  GetInstitutionsResponse
} from '@core/models/institution.models';

@Injectable({
  providedIn: 'root'
})
export class InstitutionService {
  private apiUrl = `${environment.apiUrl}/institutions`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new financial institution
   */
  createInstitution(request: CreateInstitutionRequest): Observable<InstitutionResponse> {
    return this.http.post<InstitutionResponse>(this.apiUrl, request);
  }

  /**
   * Get all institutions for the authenticated user
   */
  getInstitutions(limit?: number, lastEvaluatedKey?: string): Observable<GetInstitutionsResponse> {
    let params = new HttpParams();
    
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    
    if (lastEvaluatedKey) {
      params = params.set('lastEvaluatedKey', lastEvaluatedKey);
    }

    return this.http.get<GetInstitutionsResponse>(this.apiUrl, { params });
  }

  /**
   * Edit an existing institution
   */
  editInstitution(institutionId: string, request: EditInstitutionRequest): Observable<InstitutionResponse> {
    return this.http.patch<InstitutionResponse>(`${this.apiUrl}/${institutionId}`, request);
  }

  /**
   * Delete a specific institution
   */
  deleteInstitution(institutionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${institutionId}`);
  }
}
