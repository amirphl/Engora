import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { login, requestLoginOtp } from '../../../services/auth/api';
import {
  OTP_CODE_LENGTH,
  OTP_RESEND_SECONDS,
} from '../../../services/auth/constants';
import {
  AuthCustomerDTO,
  CustomerSessionDTO,
  LoginResponse,
} from '../../../services/auth/types';
import {
  isValidOtpIdentifier,
  normalizeIdentifierInput,
  sanitizeOtpIdentifierInput,
} from '../../../services/auth/utils';
import { LoginFormValues, LoginStep } from '../types';
import { loginTranslations } from '../translations';
import { getLoginErrorMessage } from '../utils';

type LoginStrings = (typeof loginTranslations)[keyof typeof loginTranslations];

interface UseLoginFormOptions {
  language: keyof typeof loginTranslations;
  strings: LoginStrings;
}

interface ParsedLoginResponse {
  customer: AuthCustomerDTO;
  session: CustomerSessionDTO;
}

const parseLoginResponse = (value: unknown): ParsedLoginResponse | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<LoginResponse>;
  const customer = candidate.Customer ?? candidate.customer;
  const session = candidate.Session ?? {
    access_token: candidate.access_token,
    refresh_token: candidate.refresh_token,
    expires_in: candidate.expires_in,
    token_type: candidate.token_type,
  };

  if (
    !customer ||
    typeof customer.id !== 'number' ||
    typeof customer.uuid !== 'string' ||
    !customer.uuid.trim() ||
    typeof customer.account_type !== 'string' ||
    !session ||
    typeof session.access_token !== 'string' ||
    !session.access_token ||
    typeof session.refresh_token !== 'string' ||
    !session.refresh_token
  ) {
    return null;
  }

  return {
    customer,
    session: {
      ...session,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  };
};

export const useLoginForm = ({ language, strings }: UseLoginFormOptions) => {
  const { login: saveSession } = useAuth();
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<LoginStep>('request-otp');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpRequestedFor, setOtpRequestedFor] = useState<string | null>(null);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(OTP_RESEND_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestInFlightRef = useRef(false);
  const loginInFlightRef = useRef(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      identifier: '',
      password: '',
      otpCode: '',
    },
  });

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCountdown(), [stopCountdown]);

  const startResendCountdown = useCallback(() => {
    stopCountdown();
    setCanResendOtp(false);
    setResendCountdown(OTP_RESEND_SECONDS);

    countdownRef.current = setInterval(() => {
      setResendCountdown(previous => {
        if (previous <= 1) {
          stopCountdown();
          setCanResendOtp(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  }, [stopCountdown]);

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      login(values.identifier, values.password, values.otpCode),
    retry: false,
  });

  const requestOtpMutation = useMutation({
    mutationFn: (identifier: string) => requestLoginOtp(identifier),
    retry: false,
  });

  const showFormError = useCallback(
    (message: string) => {
      setErrorMessage(message);
      showError(message);
    },
    [showError]
  );

  const resolveErrorMessage = useCallback(
    (
      response: {
        success: boolean;
        message?: string;
        error?: { code?: string; details?: unknown };
      },
      fallbackMessage: string
    ) => getLoginErrorMessage(response, language, strings, fallbackMessage),
    [language, strings]
  );

  const sendOtp = useCallback(
    async (identifier: string) => {
      if (requestInFlightRef.current) return;
      requestInFlightRef.current = true;
      setErrorMessage('');

      try {
        const response = await requestOtpMutation.mutateAsync(identifier);
        if (!response.success) {
          showFormError(
            resolveErrorMessage(response, strings.error.otpSendFailed)
          );
          return;
        }

        setOtpRequestedFor(identifier);
        setStep('authenticate');
        startResendCountdown();
        showSuccess(strings.otpSentSuccess);
      } catch {
        showFormError(strings.error.unexpected);
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [
      requestOtpMutation,
      resolveErrorMessage,
      showFormError,
      showSuccess,
      startResendCountdown,
      strings,
    ]
  );

  const handleSubmit = form.handleSubmit(async values => {
    const identifier = normalizeIdentifierInput(values.identifier);

    if (step === 'request-otp') {
      await sendOtp(identifier);
      return;
    }

    if (!otpRequestedFor || identifier !== otpRequestedFor) {
      showFormError(strings.error.otpNotRequested);
      return;
    }

    if (loginInFlightRef.current) return;
    loginInFlightRef.current = true;
    setErrorMessage('');

    try {
      const response = await loginMutation.mutateAsync({
        identifier,
        password: values.password,
        otpCode: values.otpCode,
      });

      if (!response.success) {
        showFormError(
          resolveErrorMessage(response, strings.error.invalidCredentials)
        );
        return;
      }

      const loginResponse = parseLoginResponse(response.data);
      if (!loginResponse) {
        showFormError(strings.error.invalidResponse);
        return;
      }

      saveSession(
        {
          token: loginResponse.session.access_token,
          refresh_token: loginResponse.session.refresh_token,
        },
        loginResponse.customer
      );
      stopCountdown();
      showSuccess(strings.success);
      window.location.assign('/dashboard');
    } catch {
      showFormError(strings.error.unexpected);
    } finally {
      loginInFlightRef.current = false;
    }
  });

  const handleResendOtp = useCallback(async () => {
    if (!canResendOtp || !otpRequestedFor || requestInFlightRef.current) {
      return;
    }
    await sendOtp(otpRequestedFor);
  }, [canResendOtp, otpRequestedFor, sendOtp]);

  const handleChangeIdentifier = useCallback(() => {
    stopCountdown();
    setStep('request-otp');
    setOtpRequestedFor(null);
    setCanResendOtp(false);
    setResendCountdown(OTP_RESEND_SECONDS);
    setErrorMessage('');
    form.clearErrors();
    form.setValue('password', '');
    form.setValue('otpCode', '');
    form.setFocus('identifier');
  }, [form, stopCountdown]);

  const identifierRules = useMemo(
    () => ({
      required: strings.validation.identifierRequired,
      validate: (value: string) =>
        isValidOtpIdentifier(value) || strings.validation.invalidMobile,
    }),
    [strings]
  );

  const passwordRules = useMemo(
    () => ({
      required: strings.validation.passwordRequired,
      minLength: {
        value: 8,
        message: strings.validation.passwordLength,
      },
      maxLength: {
        value: 100,
        message: strings.validation.passwordLength,
      },
    }),
    [strings]
  );

  const otpRules = useMemo(
    () => ({
      required: strings.validation.otpRequired,
      pattern: {
        value: /^\d{6}$/,
        message: strings.validation.otpRequired,
      },
    }),
    [strings]
  );

  const setIdentifierValue = useCallback(
    (value: string) => {
      form.setValue('identifier', sanitizeOtpIdentifierInput(value), {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      });
    },
    [form]
  );

  const setOtpValue = useCallback(
    (value: string) => {
      form.setValue(
        'otpCode',
        value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH),
        {
          shouldDirty: true,
          shouldValidate: form.formState.isSubmitted,
        }
      );
    },
    [form]
  );

  return {
    form,
    step,
    showPassword,
    setShowPassword,
    errorMessage,
    handleSubmit,
    identifierRules,
    passwordRules,
    otpRules,
    setIdentifierValue,
    setOtpValue,
    handleChangeIdentifier,
    handleResendOtp,
    canResendOtp,
    resendCountdown,
    isSubmitting: loginMutation.isPending || requestOtpMutation.isPending,
  };
};
