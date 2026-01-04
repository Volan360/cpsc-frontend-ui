import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
    MatTooltipModule,
    MatExpansionModule,
    MatPaginatorModule
  ],
  templateUrl: './institution-detail.component.html',
  styleUrls: ['./institution-detail.component.scss']
})
export class InstitutionDetailComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  institution?: InstitutionResponse;
  transactions: TransactionResponse[] = [];
  filteredTransactions: TransactionResponse[] = [];
  paginatedTransactions: TransactionResponse[] = [];
  activeFilter?: TransactionFilter;
  displayedColumns: string[] = ['type', 'amount', 'description', 'tags', 'createdAt', 'actions'];
  loading = true;
  institutionId!: string;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortDirection: 'newest' | 'oldest' = 'newest';

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

  editTransaction(transaction: TransactionResponse, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(CreateTransactionDialogComponent, {
      width: DIALOG_WIDTHS.MEDIUM,
      data: { institutionId: this.institutionId, transaction }
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

  deleteInstitution(): void {
    if (!this.institution) return;
    
    if (confirm(`Are you sure you want to delete ${this.institution.institutionName}? This will also delete all associated transactions.`)) {
      this.institutionService.deleteInstitution(this.institution.institutionId).subscribe({
        next: () => {
          this.notificationService.success('Institution deleted successfully');
          this.router.navigate(['/institutions']);
        },
        error: (error) => {
          console.error('Error deleting institution:', error);
          this.notificationService.error('Failed to delete institution');
        }
      });
    }
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

  updatePagination(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.onPageChange();
  }

  onPageChange(): void {
    const startIndex = this.paginator ? this.paginator.pageIndex * this.paginator.pageSize : 0;
    const endIndex = startIndex + (this.paginator ? this.paginator.pageSize : this.pageSize);
    this.paginatedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'newest' ? 'oldest' : 'newest';
    this.applyFilter();
  }

  private sortTransactions(transactions: TransactionResponse[]): TransactionResponse[] {
    return [...transactions].sort((a, b) => {
      const dateA = a.transactionDate || a.createdAt;
      const dateB = b.transactionDate || b.createdAt;
      return this.sortDirection === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }

  private applyFilter(): void {
    if (!this.activeFilter) {
      this.filteredTransactions = this.sortTransactions(this.transactions);
      this.updatePagination();
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

      if (!passesTagFilter) {
        return false;
      }

      // Type filtering
      let passesTypeFilter = true;

      if (this.activeFilter!.types && this.activeFilter!.types.length > 0) {
        passesTypeFilter = this.activeFilter!.types.includes(transaction.type as any);
      }

      if (!passesTypeFilter) {
        return false;
      }

      // Amount filtering
      let passesAmountFilter = true;

      if (this.activeFilter!.amountFilterType === 'less' && this.activeFilter!.maxAmount !== null && this.activeFilter!.maxAmount !== undefined) {
        passesAmountFilter = transaction.amount < this.activeFilter!.maxAmount;
      } else if (this.activeFilter!.amountFilterType === 'greater' && this.activeFilter!.minAmount !== null && this.activeFilter!.minAmount !== undefined) {
        passesAmountFilter = transaction.amount > this.activeFilter!.minAmount;
      } else if (this.activeFilter!.amountFilterType === 'between' && 
                 this.activeFilter!.minAmount !== null && this.activeFilter!.minAmount !== undefined &&
                 this.activeFilter!.maxAmount !== null && this.activeFilter!.maxAmount !== undefined) {
        passesAmountFilter = transaction.amount >= this.activeFilter!.minAmount && 
                             transaction.amount <= this.activeFilter!.maxAmount;
      }

      return passesAmountFilter;
    });

    this.filteredTransactions = this.sortTransactions(this.filteredTransactions);
    this.updatePagination();
  }
}
