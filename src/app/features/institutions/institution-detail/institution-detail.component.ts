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
import { FilterTransactionsDialogComponent, TransactionFilter } from './filter-transactions-dialog/filter-transactions-dialog.component';
import { NotificationService } from '@core/services/notification.service';
import { formatDate, formatCurrency } from '@core/utils/date.utils';
import { DIALOG_WIDTHS } from '@core/constants/app.constants';

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
  filteredTransactions: TransactionResponse[] = [];
  activeFilter?: TransactionFilter;
  displayedColumns: string[] = ['type', 'amount', 'description', 'tags', 'createdAt', 'actions'];
  loading = true;
  institutionId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private institutionService: InstitutionService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
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
          this.notificationService.error('Institution not found');
          this.router.navigate(['/institutions']);
          return;
        }

        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error loading institution:', error);
        this.notificationService.error('Failed to load institution');
        this.loading = false;
      }
    });
  }

  loadTransactions(): void {
    this.transactionService.getInstitutionTransactions(this.institutionId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.notificationService.error('Failed to load transactions');
        this.loading = false;
      }
    });
  }

  openCreateTransactionDialog(): void {
    const dialogRef = this.dialog.open(CreateTransactionDialogComponent, {
      width: DIALOG_WIDTHS.MEDIUM,
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
          this.notificationService.success('Transaction deleted successfully');
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.notificationService.error('Failed to delete transaction');
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

  getTransactionClass(type: string): string {
    return type === 'DEPOSIT' ? 'deposit' : 'withdrawal';
  }

  formatDate = formatDate;
  formatCurrency = formatCurrency;

  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterTransactionsDialogComponent, {
      width: DIALOG_WIDTHS.MEDIUM,
      data: { 
        institutionId: this.institutionId,
        existingFilter: this.activeFilter
      }
    });

    dialogRef.afterClosed().subscribe((filter: TransactionFilter | undefined) => {
      if (filter) {
        this.activeFilter = filter;
        this.applyFilter();
      }
    });
  }

  clearFilter(): void {
    this.activeFilter = undefined;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (!this.activeFilter) {
      this.filteredTransactions = [...this.transactions];
      return;
    }

    this.filteredTransactions = this.transactions.filter(transaction => {
      // Date filtering
      const transactionDate = new Date(transaction.transactionDate * 1000);
      // Set to start of day for comparison
      transactionDate.setHours(0, 0, 0, 0);

      let passesDateFilter = true;

      if (this.activeFilter!.filterType === 'before' && this.activeFilter!.endDate) {
        const endDate = new Date(this.activeFilter!.endDate);
        endDate.setHours(0, 0, 0, 0);
        passesDateFilter = transactionDate < endDate;
      } else if (this.activeFilter!.filterType === 'after' && this.activeFilter!.startDate) {
        const startDate = new Date(this.activeFilter!.startDate);
        startDate.setHours(23, 59, 59, 999);
        passesDateFilter = transactionDate > startDate;
      } else if (this.activeFilter!.filterType === 'between' && this.activeFilter!.startDate && this.activeFilter!.endDate) {
        const startDate = new Date(this.activeFilter!.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.activeFilter!.endDate);
        endDate.setHours(23, 59, 59, 999);
        passesDateFilter = transactionDate >= startDate && transactionDate <= endDate;
      } else if (this.activeFilter!.filterType === 'on' && this.activeFilter!.startDate) {
        const filterDate = new Date(this.activeFilter!.startDate);
        filterDate.setHours(0, 0, 0, 0);
        passesDateFilter = transactionDate.getTime() === filterDate.getTime();
      }

      if (!passesDateFilter) {
        return false;
      }

      // Tag filtering
      let passesTagFilter = true;

      if (this.activeFilter!.noTags) {
        // Show only transactions with no tags
        passesTagFilter = !transaction.tags || transaction.tags.length === 0;
      } else if (this.activeFilter!.tags && this.activeFilter!.tags.length > 0) {
        // Filter by selected tags
        const transactionTags = transaction.tags || [];
        
        if (this.activeFilter!.tagFilterMode === 'all') {
          // Transaction must have ALL selected tags
          passesTagFilter = this.activeFilter!.tags.every(tag => transactionTags.includes(tag));
        } else {
          // Transaction must have ANY of the selected tags (default)
          passesTagFilter = this.activeFilter!.tags.some(tag => transactionTags.includes(tag));
        }
      }

      return passesTagFilter;
    });
  }
}
