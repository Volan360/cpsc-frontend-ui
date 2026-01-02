import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InstitutionService } from '@core/services/institution.service';
import { TransactionService } from '@core/services/transaction.service';
import { InstitutionResponse } from '@core/models/institution.models';
import { TransactionResponse } from '@core/models/transaction.models';
import { CreateTransactionDialogComponent } from './create-transaction-dialog/create-transaction-dialog.component';

@Component({
  selector: 'app-institution-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './institution-detail.component.html',
  styleUrls: ['./institution-detail.component.scss']
})
export class InstitutionDetailComponent implements OnInit {
  institution?: InstitutionResponse;
  transactions: TransactionResponse[] = [];
  displayedColumns: string[] = ['type', 'amount', 'description', 'tags', 'createdAt', 'actions'];
  loading = true;
  institutionId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private institutionService: InstitutionService,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.institutionId = this.route.snapshot.paramMap.get('id')!;
    this.loadInstitutionData();
  }

  loadInstitutionData(): void {
    this.loading = true;
    
    // Load institution details and transactions
    this.institutionService.getInstitutions().subscribe({
      next: (response) => {
        this.institution = response.institutions.find(i => i.institutionId === this.institutionId);
        
        if (!this.institution) {
          this.snackBar.open('Institution not found', 'Close', { duration: 3000 });
          this.router.navigate(['/institutions']);
          return;
        }

        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error loading institution:', error);
        this.snackBar.open('Failed to load institution', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadTransactions(): void {
    this.transactionService.getInstitutionTransactions(this.institutionId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.snackBar.open('Failed to load transactions', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  openCreateTransactionDialog(): void {
    const dialogRef = this.dialog.open(CreateTransactionDialogComponent, {
      width: '500px',
      data: { institutionId: this.institutionId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransactions();
      }
    });
  }

  deleteTransaction(transaction: TransactionResponse, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(this.institutionId, transaction.transactionId).subscribe({
        next: () => {
          this.snackBar.open('Transaction deleted successfully', 'Close', { duration: 3000 });
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.snackBar.open('Failed to delete transaction', 'Close', { duration: 3000 });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/institutions']);
  }

  getCurrentBalance(): number {
    if (!this.institution) return 0;
    
    let balance = this.institution.startingBalance;
    
    this.transactions.forEach(t => {
      if (t.type === 'DEPOSIT') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });
    
    return balance;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getTransactionClass(type: string): string {
    return type === 'DEPOSIT' ? 'deposit' : 'withdrawal';
  }
}
