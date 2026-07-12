import React from 'react';
import { Controller } from 'react-hook-form';
import { useLanguage } from '../../hooks/useLanguage';
import { loginTranslations, LoginLocale } from './translations';
import { useLoginForm } from './hooks';
import {
  FormErrorAlert,
  IdentifierField,
  LoginHeader,
  OtpField,
  PasswordField,
  SubmitButton,
} from './components';
import { LoginPageProps } from './types';

type LoginStrings = (typeof loginTranslations)[LoginLocale];

const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToSignup,
  onNavigateToForgotPassword,
}) => {
  const { isRTL, language } = useLanguage();
  const strings = (loginTranslations[language as LoginLocale] ||
    loginTranslations.en) as LoginStrings;
  const {
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
    isSubmitting,
  } = useLoginForm({ language: language as LoginLocale, strings });

  const identifierValue = form.watch('identifier');
  const passwordValue = form.watch('password');
  const otpCodeValue = form.watch('otpCode');
  const { errors } = form.formState;
  const isAuthenticationStep = step === 'authenticate';

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <LoginHeader title={strings.title} subtitle={strings.subtitle} />

        <div className='bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200'>
          <form onSubmit={handleSubmit} className='space-y-6' noValidate>
            <FormErrorAlert message={errorMessage} />

            <Controller
              name='identifier'
              control={form.control}
              rules={identifierRules}
              render={({ field }) => (
                <IdentifierField
                  label={strings.mobileOnly}
                  placeholder={strings.mobileOnlyPlaceholder}
                  value={field.value || ''}
                  onChange={setIdentifierValue}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={errors.identifier?.message as string | undefined}
                  disabled={isAuthenticationStep || isSubmitting}
                />
              )}
            />

            {isAuthenticationStep && (
              <>
                <div
                  className='rounded-md border border-green-200 bg-green-50 p-4'
                  role='status'
                >
                  <p className='text-sm text-green-800'>
                    {strings.otpSentTo} {identifierValue}
                  </p>
                  <button
                    type='button'
                    onClick={handleChangeIdentifier}
                    disabled={isSubmitting}
                    className='mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50'
                  >
                    {strings.changeMobile}
                  </button>
                </div>

                <Controller
                  name='otpCode'
                  control={form.control}
                  rules={otpRules}
                  render={({ field }) => (
                    <OtpField
                      value={otpCodeValue}
                      label={strings.otpCode}
                      placeholder={strings.otpPlaceholder}
                      onChange={setOtpValue}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={errors.otpCode?.message as string | undefined}
                    />
                  )}
                />

                <Controller
                  name='password'
                  control={form.control}
                  rules={passwordRules}
                  render={({ field }) => (
                    <PasswordField
                      value={passwordValue}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={errors.password?.message as string | undefined}
                      label={strings.password}
                      placeholder={strings.passwordPlaceholder}
                      showPassword={showPassword}
                      onToggleShow={() =>
                        setShowPassword(previous => !previous)
                      }
                      isRTL={isRTL}
                    />
                  )}
                />

                <div className='text-center'>
                  {canResendOtp ? (
                    <button
                      type='button'
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className='text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50'
                    >
                      {strings.resendOtp}
                    </button>
                  ) : (
                    <p className='text-sm text-gray-600'>
                      {strings.resendIn} {resendCountdown} {strings.seconds}
                    </p>
                  )}
                </div>
              </>
            )}

            <SubmitButton
              isLoading={isSubmitting}
              label={isAuthenticationStep ? strings.signIn : strings.sendOtp}
              showArrow={isAuthenticationStep}
              isRTL={isRTL}
            />

            <div className='text-center'>
              <button
                type='button'
                onClick={onNavigateToForgotPassword}
                className='text-sm text-primary-600 hover:text-primary-700'
              >
                {strings.forgotPassword}
              </button>
            </div>
          </form>
        </div>

        <div className='text-center'>
          <p className='text-sm text-gray-600'>
            {strings.noAccount}{' '}
            <button
              type='button'
              onClick={onNavigateToSignup}
              className='text-primary-600 hover:text-primary-700 font-medium'
            >
              {strings.signUpHere}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
