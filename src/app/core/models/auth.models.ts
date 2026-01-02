export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignUpResponse {
  userSub: string;
  codeDeliveryDetails: {
    destination: string;
    deliveryMedium: string;
    attributeName: string;
  };
}

export interface ConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export interface UserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
}
