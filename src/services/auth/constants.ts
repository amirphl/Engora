export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  loginOtp: '/auth/login/otp',
} as const;

export const OTP_CODE_LENGTH = 6;
export const OTP_RESEND_SECONDS = 120;

export const AUTH_STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  customerData: 'customer_data',
  isAuthenticated: 'is_authenticated',
  userId: 'user_id',
  userUuid: 'user_uuid',
  accountType: 'account_type',
} as const;
