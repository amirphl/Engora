export type LoginStep = 'request-otp' | 'authenticate';

export interface LoginFormValues {
  identifier: string;
  password: string;
  otpCode: string;
}

export interface LoginPageProps {
  onNavigateToSignup?: () => void;
  onNavigateToForgotPassword?: () => void;
}
