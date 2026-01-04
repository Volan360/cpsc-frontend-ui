export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  tags?: string[];
  description?: string;
  transactionDate?: number;  // Optional UNIX timestamp
}

export interface UpdateTransactionRequest {
  type?: TransactionType;
  amount?: number;
  tags?: string[];
  description?: string;
  transactionDate?: number;  // Optional UNIX timestamp
}

export interface TransactionResponse {
  transactionId: string;
  institutionId: string;
  type: TransactionType;
  amount: number;
  tags?: string[];
  description?: string;
  transactionDate: number;
  createdAt: number;
}
