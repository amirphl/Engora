import { LoginLocale, loginTranslations } from './translations';

type LoginStrings = (typeof loginTranslations)[LoginLocale];

const LOGIN_ERROR_MESSAGES = {
  INVALID_IDENTIFIER: 'invalidIdentifier',
  INVALID_MOBILE_NUMBER: 'invalidMobile',
  INVALID_PASSWORD: 'invalidPassword',
  INVALID_OTP: 'invalidOtp',
  INVALID_OTP_CODE: 'invalidOtp',
  INVALID_OTP_FORMAT: 'invalidOtp',
  NO_VALID_OTP: 'invalidOtp',
  OTP_NOT_FOUND: 'invalidOtp',
  OTP_VERIFICATION_FAILED: 'invalidOtp',
  OTP_EXPIRED: 'otpExpired',
  OTP_REQUIRED: 'otpNotRequested',
  CUSTOMER_NOT_FOUND: 'customerNotFound',
  ACCOUNT_INACTIVE: 'accountInactive',
  ACCOUNT_TYPE_NOT_FOUND: 'accountTypeNotFound',
  INCORRECT_PASSWORD: 'incorrectPassword',
  INVALID_CREDENTIALS: 'invalidCredentials',
  UNAUTHORIZED: 'invalidCredentials',
  FORBIDDEN: 'invalidCredentials',
  PASSWORD_REQUIRED: 'invalidPassword',
  LOGIN_FAILED: 'loginFailed',
  OTP_SEND_FAILED: 'otpSendFailed',
  RESEND_OTP_FAILED: 'otpSendFailed',
  INVALID_URL: 'invalidRequest',
  INVALID_REQUEST: 'invalidRequest',
  VALIDATION_ERROR: 'invalidRequest',
  INVALID_RESPONSE: 'invalidResponse',
  INVALID_RESPONSE_CONTENT_TYPE: 'invalidResponse',
  NETWORK_ERROR: 'networkError',
  TIMEOUT_ERROR: 'timeoutError',
  REQUEST_TIMEOUT: 'timeoutError',
  RATE_LIMITED: 'rateLimited',
  RATE_LIMIT_EXCEEDED: 'rateLimited',
  TOO_MANY_REQUESTS: 'rateLimited',
  TOO_MANY_OTP_REQUESTS: 'rateLimited',
  OTP_ATTEMPTS_EXCEEDED: 'rateLimited',
  INTERNAL_SERVER_ERROR: 'serviceUnavailable',
  SERVICE_UNAVAILABLE: 'serviceUnavailable',
  UNKNOWN_ERROR: 'unexpected',
} as const;

type LoginErrorCode = keyof typeof LOGIN_ERROR_MESSAGES;

const isLoginErrorCode = (value: string): value is LoginErrorCode =>
  value in LOGIN_ERROR_MESSAGES;

export const getLoginErrorMessage = (
  response: {
    success: boolean;
    message?: string;
    error?: { code?: string; details?: unknown };
  },
  _language: LoginLocale,
  strings: LoginStrings,
  fallbackMessage: string
): string => {
  const errorCode = response.error?.code;

  if (errorCode && isLoginErrorCode(errorCode)) {
    return strings.error[LOGIN_ERROR_MESSAGES[errorCode]];
  }

  return fallbackMessage;
};
