export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  screenName?: string;
  email?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  screenName: string;
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

export interface ResendCodeRequest {
  email: string;
}

export interface ResendCodeResponse {
  message: string;
}

export interface UserProfile {
  message?: string;
  email: string;
  screenName?: string;
  authenticated?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  deliveryMedium?: string;
  destination?: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface ConfirmForgotPasswordResponse {
  message: string;
}

export interface UpdateScreenNameRequest {
  screenName: string;
}

export interface UpdateScreenNameResponse {
  message: string;
  screenName: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
}
