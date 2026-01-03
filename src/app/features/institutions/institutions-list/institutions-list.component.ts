import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InstitutionService } from '@core/services/institution.service';
import { InstitutionResponse } from '@core/models/institution.models';
import { CreateInstitutionDialogComponent } from './create-institution-dialog/create-institution-dialog.component';
import { NotificationService } from '@core/services/notification.service';
import { formatDate, formatCurrency } from '@core/utils/date.utils';

@Component({
  selector: 'app-institutions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './institutions-list.component.html',
  styleUrls: ['./institutions-list.component.scss']
})
export class InstitutionsListComponent implements OnInit {
  institutions: InstitutionResponse[] = [];
  displayedColumns: string[] = ['institutionName', 'currentBalance', 'createdAt', 'actions'];
  loading = true;
  nextToken?: string;

  constructor(
    private institutionService: InstitutionService,
    private router: Router,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInstitutions();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadInstitutions(): void {
    this.loading = true;
    this.institutionService.getInstitutions(50).subscribe({
      next: (response) => {
        this.institutions = response.institutions;
        this.nextToken = response.nextToken;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading institutions:', error);
        this.notificationService.error('Failed to load institutions');
        this.loading = false;
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateInstitutionDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInstitutions();
      }
    });
  }

  editInstitution(institution: InstitutionResponse, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(CreateInstitutionDialogComponent, {
      width: '400px',
      data: { institution }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInstitutions();
      }
    });
  }

  viewInstitution(institution: InstitutionResponse): void {
    this.router.navigate(['/institutions', institution.institutionId]);
  }

  deleteInstitution(institution: InstitutionResponse, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete ${institution.institutionName}?`)) {
      this.institutionService.deleteInstitution(institution.institutionId).subscribe({
        next: () => {
          this.notificationService.success('Institution deleted successfully');
          this.loadInstitutions();
        },
        error: (error) => {
          console.error('Error deleting institution:', error);
          this.notificationService.error('Failed to delete institution');
        }
      });
    }
  }

  formatDate = formatDate;
  formatCurrency = formatCurrency;
}
