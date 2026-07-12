import React from 'react';
import { AdminCaptchaInitResponse } from '../../../types/admin';
import { AdminLoginLocale } from '../translations';
import { clampCaptchaAngle, toCaptchaImageSrc } from '../utils';

interface AdminCaptchaStepProps {
  locale: AdminLoginLocale;
  strings: {
    fields: {
      username: string;
      usernamePlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      captcha: string;
      captchaMasterAlt: string;
      captchaThumbAlt: string;
    };
    actions: {
      reloadCaptcha: string;
      sendOtp: string;
      sendingOtp: string;
      loadingCaptcha: string;
      retryCaptcha: string;
    };
  };
  username: string;
  password: string;
  captcha: AdminCaptchaInitResponse | null;
  angle: number;
  loadingCaptcha: boolean;
  submitting: boolean;
  captchaError: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAngleChange: (value: number) => void;
  onReloadCaptcha: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const AdminCaptchaStep: React.FC<AdminCaptchaStepProps> = ({
  locale,
  strings,
  username,
  password,
  captcha,
  angle,
  loadingCaptcha,
  submitting,
  captchaError,
  onUsernameChange,
  onPasswordChange,
  onAngleChange,
  onReloadCaptcha,
  onSubmit,
}) => {
  const masterSrc = toCaptchaImageSrc(captcha?.master_image_base64);
  const thumbSrc = toCaptchaImageSrc(captcha?.thumb_image_base64);
  const isBusy = loadingCaptcha || submitting;

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium mb-1'>
          {strings.fields.username}
        </label>
        <input
          type='text'
          className='w-full border rounded px-3 py-2'
          value={username}
          onChange={event => onUsernameChange(event.target.value)}
          autoComplete='username'
          placeholder={strings.fields.usernamePlaceholder}
          disabled={isBusy}
        />
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>
          {strings.fields.password}
        </label>
        <input
          type='password'
          className='w-full border rounded px-3 py-2'
          value={password}
          onChange={event => onPasswordChange(event.target.value)}
          autoComplete='current-password'
          placeholder={strings.fields.passwordPlaceholder}
          disabled={isBusy}
        />
      </div>

      <div>
        <div className='flex items-center justify-between gap-3 mb-2'>
          <label className='block text-sm font-medium'>
            {strings.fields.captcha}
          </label>
          <button
            type='button'
            onClick={onReloadCaptcha}
            disabled={isBusy}
            className='text-sm text-blue-600 disabled:opacity-50'
          >
            {loadingCaptcha
              ? strings.actions.loadingCaptcha
              : strings.actions.reloadCaptcha}
          </button>
        </div>

        <div className='flex flex-col items-center gap-3 rounded border border-gray-200 p-4'>
          {masterSrc ? (
            <img
              src={masterSrc}
              alt={strings.fields.captchaMasterAlt}
              className='rounded border border-gray-200 max-h-48'
            />
          ) : (
            <div className='h-40 w-full rounded bg-gray-100 animate-pulse' />
          )}

          <div className='flex items-center gap-3 w-full justify-center'>
            {thumbSrc ? (
              <svg
                viewBox='0 0 64 64'
                role='img'
                aria-label={strings.fields.captchaThumbAlt}
                className='w-16 h-16 rounded-full border border-gray-200'
              >
                <image
                  href={thumbSrc}
                  width='64'
                  height='64'
                  preserveAspectRatio='xMidYMid slice'
                  transform={`rotate(${angle} 32 32)`}
                />
              </svg>
            ) : (
              <div className='w-16 h-16 rounded-full bg-gray-100' />
            )}

            <input
              type='range'
              min={0}
              max={360}
              step={1}
              value={angle}
              onChange={event =>
                onAngleChange(clampCaptchaAngle(Number(event.target.value)))
              }
              className='flex-1 max-w-xs'
              disabled={isBusy || !captcha}
              aria-label={strings.fields.captcha}
            />

            <span className='w-16 text-sm text-right'>
              {locale === 'fa'
                ? new Intl.NumberFormat('fa-IR').format(angle)
                : angle}
              °
            </span>
          </div>
        </div>

        {captchaError && (
          <p className='mt-2 text-sm text-red-600'>{captchaError}</p>
        )}
      </div>

      <button
        type='submit'
        disabled={isBusy}
        className='w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 disabled:opacity-60'
      >
        {submitting ? strings.actions.sendingOtp : strings.actions.sendOtp}
      </button>

      {!captcha && !loadingCaptcha && (
        <button
          type='button'
          onClick={onReloadCaptcha}
          className='w-full border border-gray-300 rounded py-2 text-sm'
        >
          {strings.actions.retryCaptcha}
        </button>
      )}
    </form>
  );
};
