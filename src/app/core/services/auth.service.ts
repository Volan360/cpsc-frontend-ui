import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  ConfirmSignUpRequest,
  UserProfile,
  AuthState,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ConfirmForgotPasswordRequest,
  ConfirmForgotPasswordResponse,
  UpdateScreenNameRequest,
  UpdateScreenNameResponse
} from '@core/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'cpsc_access_token';
  private readonly REFRESH_TOKEN_KEY = 'cpsc_refresh_token';
  private readonly USER_KEY = 'cpsc_user';

  // Reactive state using signals
  private authStateSubject = new BehaviorSubject<AuthState>(this.getInitialAuthState());
  authState$ = this.authStateSubject.asObservable();
  
  // Signals for reactive UI updates
  isAuthenticated = signal(this.hasValidToken());
  currentUser = signal<UserProfile | null>(this.getStoredUser());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  private getInitialAuthState(): AuthState {
    return {
      isAuthenticated: this.hasValidToken(),
      user: this.getStoredUser(),
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken()
    };
  }

  private initializeAuthState(): void {
    // Check token validity on initialization
    if (this.hasValidToken()) {
      this.isAuthenticated.set(true);
    } else {
      this.clearAuth();
    }
  }

  /**
   * Sign in with email and password
   */
  signIn(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Sign up new user
   */
  signUp(request: SignUpRequest): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(`${environment.apiUrl}/auth/signup`, request)
      .pipe(
        catchError(error => {
          console.error('Signup error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirm user registration with code
   */
  confirmSignUp(request: ConfirmSignUpRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/confirm`, request)
      .pipe(
        catchError(error => {
          console.error('Confirm signup error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Resend confirmation code
   */
  resendConfirmationCode(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/resend-code`, { email })
      .pipe(
        catchError(error => {
          console.error('Resend code error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/secure/profile`)
      .pipe(
        tap(user => {
          this.currentUser.set(user);
          this.storeUser(user);
        }),
        catchError(error => {
          console.error('Get profile error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Initiate forgot password flow
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/auth/forgot-password`, request)
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirm forgot password with code and new password
   */
  confirmForgotPassword(request: ConfirmForgotPasswordRequest): Observable<ConfirmForgotPasswordResponse> {
    return this.http.post<ConfirmForgotPasswordResponse>(`${environment.apiUrl}/auth/confirm-forgot-password`, request)
      .pipe(
        catchError(error => {
          console.error('Confirm forgot password error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update user's screen name
   */
  updateScreenName(request: UpdateScreenNameRequest): Observable<UpdateScreenNameResponse> {
    return this.http.patch<UpdateScreenNameResponse>(`${environment.apiUrl}/secure/update-screen-name`, request)
      .pipe(
        tap(response => {
          // Update the current user with new screen name
          const currentUserData = this.currentUser();
          if (currentUserData) {
            const updatedUser = { ...currentUserData, screenName: response.screenName };
            this.currentUser.set(updatedUser);
            this.storeUser(updatedUser);
          }
        }),
        catchError(error => {
          console.error('Update screen name error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete user account permanently
   */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/secure/delete-account`)
      .pipe(
        tap(() => {
          // Clear all auth data after successful deletion
          this.clearAuth();
          this.router.navigate(['/auth/sign-in']);
        }),
        catchError(error => {
          console.error('Delete account error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Sign out current user
   */
  signOut(): void {
    this.clearAuth();
    this.router.navigate(['/auth/sign-in']);
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: LoginResponse): void {
    this.storeAccessToken(response.accessToken);
    this.storeRefreshToken(response.refreshToken);
    this.isAuthenticated.set(true);
    
    // Create user profile from login response
    // Note: screenName comes from the ID token during login, not from the access token
    const user: UserProfile = {
      email: response.email || '',
      screenName: response.screenName,
      authenticated: true
    };
    this.currentUser.set(user);
    this.storeUser(user);

    this.authStateSubject.next({
      isAuthenticated: true,
      user: user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null
    });
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store access token
   */
  private storeAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Store refresh token
   */
  private storeRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Store user data
   */
  private storeUser(user: UserProfile): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get stored user
   */
  private getStoredUser(): UserProfile | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if token exists and is not expired
   */
  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      // Parse JWT to check expiration
      const payload = this.parseJwt(token);
      if (payload.exp) {
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < expirationTime;
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }

    return true;
  }

  /**
   * Parse JWT token
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }
}
