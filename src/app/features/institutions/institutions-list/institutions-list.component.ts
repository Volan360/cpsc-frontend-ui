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
import { MatExpansionModule } from '@angular/material/expansion';
import { InstitutionService } from '@core/services/institution.service';
import { InstitutionResponse } from '@core/models/institution.models';
import { CreateInstitutionDialogComponent } from './create-institution-dialog/create-institution-dialog.component';
import { NotificationService } from '@core/services/notification.service';
import { formatDate, formatCurrency } from '@core/utils/date.utils';
import { encodeUuidForUrl } from '@core/utils/url.utils';

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
    MatTooltipModule,
    MatExpansionModule
  ],
  templateUrl: './institutions-list.component.html',
  styleUrls: ['./institutions-list.component.scss']
})
export class InstitutionsListComponent implements OnInit {
  institutions: InstitutionResponse[] = [];
  displayedColumns: string[] = ['institutionName', 'currentBalance', 'createdAt', 'actions', 'chevron'];
  loading = true;
  nextToken?: string;
  private longPressTimer: any;
  private isLongPress = false;

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
    this.router.navigate(['/institutions', encodeUuidForUrl(institution.institutionId)]);
  }

  formatDate = formatDate;
  formatCurrency = formatCurrency;

  onMobileTouchStart(institution: InstitutionResponse, event: TouchEvent): void {
    this.isLongPress = false;
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      this.editInstitution(institution, event);
    }, 500); // 500ms for long press
  }

  onMobileTouchEnd(): void {
    clearTimeout(this.longPressTimer);
  }

  onMobileTouchMove(): void {
    clearTimeout(this.longPressTimer);
  }

  onMobileClick(institution: InstitutionResponse, event: Event): void {
    // Only navigate if it wasn't a long press
    if (!this.isLongPress) {
      this.viewInstitution(institution);
    }
    this.isLongPress = false;
  }
}
