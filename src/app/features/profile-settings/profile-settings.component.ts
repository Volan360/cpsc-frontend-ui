import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '@core/services/auth.service';
import { ConfirmDialogComponent } from '@core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss'
})
export class ProfileSettingsComponent implements OnInit {
  screenNameForm: FormGroup;
  currentUser = this.authService.currentUser;
  isUpdatingScreenName = false;
  isDeletingAccount = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.screenNameForm = this.fb.group({
      screenName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    // Load current user profile
    const user = this.currentUser();
    if (!user) {
      this.authService.getUserProfile().subscribe({
        next: (profile) => {
          this.screenNameForm.patchValue({
            screenName: profile.screenName || ''
          });
        },
        error: () => {
          this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.screenNameForm.patchValue({
        screenName: user.screenName || ''
      });
    }
  }

  updateScreenName(): void {
    if (this.screenNameForm.valid && !this.isUpdatingScreenName) {
      this.isUpdatingScreenName = true;
      const { screenName } = this.screenNameForm.value;

      this.authService.updateScreenName({ screenName }).subscribe({
        next: (response) => {
          this.isUpdatingScreenName = false;
          this.snackBar.open(
            response.message || 'Screen name updated successfully!',
            'Close',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.isUpdatingScreenName = false;
          const errorMessage = error.error?.error || 'Failed to update screen name';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    }
  }

  confirmDeleteAccount(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Account',
        message: 'Are you sure you want to permanently delete your account? This will delete all your data including institutions, transactions, and goals. This action cannot be undone.',
        confirmText: 'Delete Account',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteAccount();
      }
    });
  }

  private deleteAccount(): void {
    this.isDeletingAccount = true;

    this.authService.deleteAccount().subscribe({
      next: () => {
        this.isDeletingAccount = false;
        this.snackBar.open(
          'Your account has been permanently deleted',
          'Close',
          { duration: 5000 }
        );
        // Navigation happens in the service after clearing auth
      },
      error: (error) => {
        this.isDeletingAccount = false;
        const errorMessage = error.error?.error || 'Failed to delete account';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  get screenName() {
    return this.screenNameForm.get('screenName');
  }
}
