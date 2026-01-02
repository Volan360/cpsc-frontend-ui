export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  tags?: string[];
  description?: string;
}

export interface TransactionResponse {
  transactionId: string;
  institutionId: string;
  type: TransactionType;
  amount: number;
  tags?: string[];
  description?: string;
  createdAt: number;
}
