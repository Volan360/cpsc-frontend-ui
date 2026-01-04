import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.status === 0) {
        // Network error - server unreachable
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        notificationService.error(errorMessage);
      } else if (error.status === 401) {
        // Unauthorized - token expired or invalid
        errorMessage = 'Your session has expired. Please log in again.';
        notificationService.warning(errorMessage);
        authService.signOut();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden
        errorMessage = 'You do not have permission to perform this action.';
        notificationService.error(errorMessage);
      } else if (error.status === 404) {
        // Not found - let the component handle this
        errorMessage = error.error?.error || 'The requested resource was not found.';
      } else if (error.status === 500) {
        // Server error
        errorMessage = 'A server error occurred. Please try again later.';
        notificationService.error(errorMessage);
      } else if (error.status >= 500) {
        // Other server errors
        errorMessage = 'The server is experiencing issues. Please try again later.';
        notificationService.error(errorMessage);
      } else if (error.status === 400) {
        // Bad request - let the component handle validation errors
        errorMessage = error.error?.error || 'Invalid request. Please check your input.';
      }

      // Log the error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message,
        error: error.error
      });

      // Return a user-friendly error object
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        error: error.error
      }));
    })
  );
};
