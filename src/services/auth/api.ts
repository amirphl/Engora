import { getApiUrl, isProduction } from '../../config/environment';
import { AUTH_ENDPOINTS } from './constants';
import { AuthApiResponse, LoginResponse } from './types';
import { isPhoneLikeIdentifier, normalizeIdentifierInput } from './utils';

const AUTH_ERROR_CODES = {
  invalidUrl: 'INVALID_URL',
  invalidIdentifier: 'INVALID_IDENTIFIER',
  invalidPassword: 'INVALID_PASSWORD',
  invalidMobileNumber: 'INVALID_MOBILE_NUMBER',
  invalidOtpCode: 'INVALID_OTP_CODE',
  invalidResponseContentType: 'INVALID_RESPONSE_CONTENT_TYPE',
  networkError: 'NETWORK_ERROR',
  timeoutError: 'TIMEOUT_ERROR',
} as const;

const LOGIN_OTP_CONSOLE_FLAG_KEY = 'log_login_otp_to_console';

const createAuthErrorResponse = <T>(
  code: string,
  message = code,
  details: unknown = null
): AuthApiResponse<T> => ({
  success: false,
  message,
  error: {
    code,
    details,
  },
});

const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('access_token');
};

const shouldLogLoginOtpToConsole = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const runtimeFlag = (
    window as typeof window & {
      __logLoginOtpToConsole?: unknown;
    }
  ).__logLoginOtpToConsole;

  if (typeof runtimeFlag === 'boolean') {
    return runtimeFlag;
  }

  return window.localStorage.getItem(LOGIN_OTP_CONSOLE_FLAG_KEY) === 'true';
};

const createTimeoutSignal = (
  timeoutMs: number,
  signal?: AbortSignal | null
): AbortSignal => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  const clearTimer = () => globalThis.clearTimeout(timeoutId);

  if (signal?.aborted) {
    clearTimer();
    controller.abort(signal.reason);
    return controller.signal;
  }

  signal?.addEventListener(
    'abort',
    () => {
      clearTimer();
      controller.abort(signal.reason);
    },
    { once: true }
  );

  controller.signal.addEventListener('abort', clearTimer, { once: true });

  return controller.signal;
};

const parseJsonResponse = async (response: Response): Promise<any | null> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const formatPhoneNumber = (phoneNumber: string): string => {
  const normalized = normalizeIdentifierInput(phoneNumber);
  const nationalNumber = normalized
    .replace(/^\+98/, '')
    .replace(/^0098/, '')
    .replace(/^98/, '')
    .replace(/^0/, '');

  return `+98${nationalNumber}`;
};

const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    if (isProduction() && urlObj.protocol !== 'https:') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const getHttpErrorCode = (status: number): string => {
  switch (status) {
    case 400:
      return 'INVALID_REQUEST';
    case 401:
      return 'INVALID_CREDENTIALS';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'CUSTOMER_NOT_FOUND';
    case 408:
      return AUTH_ERROR_CODES.timeoutError;
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
    case 503:
    case 504:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
};

const authRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AuthApiResponse<T>> => {
  const url = getApiUrl(endpoint);

  if (!isValidUrl(url)) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidUrl);
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    signal: createTimeoutSignal(30000, options.signal),
  };

  const accessToken = getStoredAccessToken();
  if (
    accessToken &&
    !(config.headers as Record<string, string>).Authorization
  ) {
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await parseJsonResponse(response);
    if (data === null) {
      return createAuthErrorResponse(
        AUTH_ERROR_CODES.invalidResponseContentType
      );
    }

    if (!response.ok) {
      const errorCode =
        typeof data.error?.code === 'string' && data.error.code.trim()
          ? data.error.code.trim()
          : getHttpErrorCode(response.status);
      const errorMessage =
        typeof data.message === 'string' && data.message.trim()
          ? data.message.trim()
          : errorCode;

      return {
        success: false,
        message: errorMessage,
        error: {
          code: errorCode,
          details: data.error?.details,
        },
      };
    }

    return {
      success: true,
      message: data.message || 'Success',
      data: data.data,
    };
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      return createAuthErrorResponse(AUTH_ERROR_CODES.timeoutError);
    }

    const errorMessage =
      error instanceof TypeError
        ? AUTH_ERROR_CODES.networkError
        : isProduction()
          ? AUTH_ERROR_CODES.networkError
          : error instanceof Error
            ? error.message
            : AUTH_ERROR_CODES.networkError;

    return createAuthErrorResponse(
      errorMessage === AUTH_ERROR_CODES.networkError
        ? AUTH_ERROR_CODES.networkError
        : 'UNKNOWN_ERROR',
      errorMessage
    );
  }
};

export const login = async (
  identifier: string,
  password: string,
  otpCode: string
): Promise<AuthApiResponse<LoginResponse>> => {
  if (
    !identifier ||
    typeof identifier !== 'string' ||
    identifier.length > 255
  ) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidIdentifier);
  }

  if (
    !password ||
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 100
  ) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidPassword);
  }

  if (typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode)) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidOtpCode);
  }

  let formattedIdentifier = normalizeIdentifierInput(identifier);
  if (!formattedIdentifier || formattedIdentifier.length > 255) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidIdentifier);
  }

  if (!isPhoneLikeIdentifier(formattedIdentifier)) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidIdentifier);
  }

  formattedIdentifier = formatPhoneNumber(formattedIdentifier);

  return authRequest(AUTH_ENDPOINTS.login, {
    method: 'POST',
    body: JSON.stringify({
      identifier: formattedIdentifier,
      password,
      otp_code: otpCode,
    }),
  });
};

export const requestLoginOtp = async (
  identifier: string
): Promise<AuthApiResponse> => {
  if (
    !identifier ||
    typeof identifier !== 'string' ||
    identifier.length > 255
  ) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidIdentifier);
  }

  let formattedIdentifier = normalizeIdentifierInput(identifier);
  if (!isPhoneLikeIdentifier(formattedIdentifier)) {
    return createAuthErrorResponse(AUTH_ERROR_CODES.invalidMobileNumber);
  }

  formattedIdentifier = formatPhoneNumber(formattedIdentifier);

  const payload: Record<string, string | boolean> = {
    identifier: formattedIdentifier,
  };

  if (shouldLogLoginOtpToConsole()) {
    payload.log_otp_to_console = true;
  }

  return authRequest(AUTH_ENDPOINTS.loginOtp, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
