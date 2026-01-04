import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionResponse
} from '@core/models/transaction.models';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a new transaction for a specific institution
   */
  createTransaction(
    institutionId: string,
    request: CreateTransactionRequest
  ): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      `${this.apiUrl}/institutions/${institutionId}/transactions`,
      request
    );
  }

  /**
   * Get all transactions for a specific institution
   */
  getInstitutionTransactions(institutionId: string): Observable<TransactionResponse[]> {
    return this.http.get<TransactionResponse[]>(
      `${this.apiUrl}/institutions/${institutionId}/transactions`
    );
  }

  /**
   * Delete a specific transaction
   */
  deleteTransaction(institutionId: string, transactionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/institutions/${institutionId}/transactions/${transactionId}`
    );
  }

  /**
   * Update an existing transaction
   */
  updateTransaction(
    institutionId: string,
    transactionId: string,
    request: UpdateTransactionRequest
  ): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(
      `${this.apiUrl}/institutions/${institutionId}/transactions/${transactionId}`,
      request
    );
  }
}
