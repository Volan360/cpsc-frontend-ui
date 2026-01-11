import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  CreateGoalRequest,
  EditGoalRequest,
  GoalResponse,
  GetGoalsResponse
} from '@core/models/goal.models';
import { InstitutionResponse } from '@core/models/institution.models';
import { TransactionService } from './transaction.service';
import { TransactionType } from '@core/models/transaction.models';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private apiUrl = `${environment.apiUrl}/goals`;

  constructor(
    private http: HttpClient,
    private transactionService: TransactionService
  ) {}

  /**
   * Create a new goal
   */
  createGoal(request: CreateGoalRequest): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(this.apiUrl, request);
  }

  /**
   * Get all goals for the authenticated user
   */
  getGoals(limit?: number, lastEvaluatedKey?: string): Observable<GetGoalsResponse> {
    let params = new HttpParams();
    
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    
    if (lastEvaluatedKey) {
      params = params.set('lastEvaluatedKey', lastEvaluatedKey);
    }

    return this.http.get<GetGoalsResponse>(this.apiUrl, { params });
  }

  /**
   * Edit an existing goal
   */
  editGoal(goalId: string, request: EditGoalRequest): Observable<GoalResponse> {
    return this.http.patch<GoalResponse>(`${this.apiUrl}/${goalId}`, request);
  }

  /**
   * Delete a specific goal
   */
  deleteGoal(goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${goalId}`);
  }

  /**
   * Complete a goal by withdrawing the target amount from linked institutions and deleting the goal
   */
  completeGoalWithWithdrawal(
    goal: GoalResponse,
    institutions: InstitutionResponse[]
  ): Observable<void> {
    if (!goal.linkedInstitutions || !goal.targetAmount) {
      throw new Error('Goal must have linked institutions and target amount');
    }

    const transactionDetails = this.calculateWithdrawalTransactions(goal, institutions);
    const transactionObservables: Observable<any>[] = [];

    // Only create transactions for institutions with non-zero withdrawals
    for (const transaction of transactionDetails) {
      if (transaction.withdrawalAmount > 0) {
        const transactionRequest = {
          type: TransactionType.WITHDRAWAL,
          amount: transaction.withdrawalAmount,
          description: `Goal completion: ${goal.name}`,
          tags: ['goal-completion']
        };

        transactionObservables.push(
          this.transactionService.createTransaction(transaction.institutionId, transactionRequest)
        );
      }
    }

    // Execute all transactions, then delete the goal
    return forkJoin(transactionObservables.length > 0 ? transactionObservables : [from(Promise.resolve())]).pipe(
      switchMap(() => this.deleteGoal(goal.goalId)),
      map(() => void 0)
    );
  }

  /**
   * Check if a goal can be completed (has target amount and current amount meets target)
   */
  canCompleteGoal(goal: GoalResponse, institutions: InstitutionResponse[]): boolean {
    if (!goal.targetAmount || !goal.linkedInstitutions) return false;
    
    const currentAmount = this.calculateCurrentAmount(goal, institutions);
    return currentAmount >= goal.targetAmount;
  }

  /**
   * Calculate the current amount saved for a goal
   */
  calculateCurrentAmount(goal: GoalResponse, institutions: InstitutionResponse[]): number {
    if (!goal.linkedInstitutions) return 0;

    let total = 0;
    for (const [institutionId, percentage] of Object.entries(goal.linkedInstitutions)) {
      const institution = institutions.find(i => i.institutionId === institutionId);
      if (institution) {
        total += (institution.currentBalance * percentage) / 100;
      }
    }
    return total;
  }

  /**
   * Calculate transaction preview for goal completion
   */
  calculateTransactionPreview(
    goal: GoalResponse,
    institutions: InstitutionResponse[]
  ): Array<{ institutionId: string; institutionName: string; withdrawalAmount: number; percentage: number; currentBalance: number; remainingBalance: number }> {
    const transactions = this.calculateWithdrawalTransactions(goal, institutions);
    
    return transactions.map(t => ({
      institutionId: t.institutionId,
      institutionName: t.institutionName,
      withdrawalAmount: t.withdrawalAmount,
      percentage: t.percentage,
      currentBalance: t.currentBalance,
      remainingBalance: t.remainingBalance
    }));
  }

  /**
   * Private method to calculate withdrawal transactions for goal completion
   * This is the single source of truth for withdrawal calculation logic
   */
  private calculateWithdrawalTransactions(
    goal: GoalResponse,
    institutions: InstitutionResponse[]
  ): Array<{ institutionId: string; institutionName: string; withdrawalAmount: number; percentage: number; currentBalance: number; remainingBalance: number }> {
    if (!goal.linkedInstitutions || !goal.targetAmount) {
      return [];
    }

    let totalWithdrawalAmount = 0;
    const targetAmount = goal.targetAmount;
    const transactions: Array<{ institutionId: string; institutionName: string; withdrawalAmount: number; percentage: number; currentBalance: number; remainingBalance: number }> = [];

    const institutionEntries = Object.entries(goal.linkedInstitutions);

    for (const [institutionId, percentage] of institutionEntries) {
      const institution = institutions.find(i => i.institutionId === institutionId);
      if (!institution) continue;

      let withdrawalAmount = 0;
      
      // Only calculate withdrawal if target hasn't been met yet
      if (totalWithdrawalAmount < targetAmount) {
        const allocatedAmount = (institution.currentBalance * percentage) / 100;
        const remainingNeeded = targetAmount - totalWithdrawalAmount;
        withdrawalAmount = Math.min(allocatedAmount, remainingNeeded);
        totalWithdrawalAmount += withdrawalAmount;
      }

      // Include all linked institutions, even with zero withdrawal
      transactions.push({
        institutionId,
        institutionName: institution.institutionName,
        withdrawalAmount,
        percentage,
        currentBalance: institution.currentBalance,
        remainingBalance: institution.currentBalance - withdrawalAmount
      });
    }

    return transactions;
  }
}
