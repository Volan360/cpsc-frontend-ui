import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '@core/services/auth.service';
import { ConfirmSignUpRequest } from '@core/models/auth.models';

@Component({
  selector: 'app-confirm-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './confirm-signup.component.html',
  styleUrl: './confirm-signup.component.scss'
})
export class ConfirmSignupComponent implements OnInit {
  confirmForm!: FormGroup;
  loading = signal(false);
  resending = signal(false);
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    this.initializeForm();
  }

  private initializeForm(): void {
    this.confirmForm = this.fb.group({
      email: [this.email, [Validators.required, Validators.email]],
      confirmationCode: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.confirmForm.valid && !this.loading()) {
      this.loading.set(true);
      
      const request: ConfirmSignUpRequest = {
        email: this.confirmForm.value.email,
        confirmationCode: this.confirmForm.value.confirmationCode
      };

      this.authService.confirmSignUp(request).subscribe({
        next: () => {
          this.loading.set(false);
          this.showSuccess('Account confirmed successfully! You can now sign in.');
          this.router.navigate(['/auth/sign-in']);
        },
        error: (error) => {
          this.loading.set(false);
          this.handleError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.confirmForm);
    }
  }

  resendCode(): void {
    const email = this.confirmForm.value.email;
    if (!email) {
      this.showError('Please enter your email address');
      return;
    }

    this.resending.set(true);
    this.authService.resendConfirmationCode(email).subscribe({
      next: () => {
        this.resending.set(false);
        this.showSuccess('Confirmation code resent! Please check your email.');
      },
      error: (error) => {
        this.resending.set(false);
        this.handleError(error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(error: any): void {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      errorMessage = 'Invalid confirmation code';
    }

    this.showError(errorMessage);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.confirmForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.capitalize(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return 'Confirmation code must be at least 6 characters';
    }
    
    return '';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
