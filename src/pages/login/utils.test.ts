import { describe, expect, it } from '@jest/globals';
import { loginTranslations } from './translations';
import { getLoginErrorMessage } from './utils';

describe('getLoginErrorMessage', () => {
  it('returns the localized message for a known backend code', () => {
    const message = getLoginErrorMessage(
      { success: false, error: { code: 'OTP_EXPIRED' } },
      'fa',
      loginTranslations.fa,
      loginTranslations.fa.error.loginFailed
    );

    expect(message).toBe(loginTranslations.fa.error.otpExpired);
  });

  it('does not expose an unknown backend message to the user', () => {
    const fallback = loginTranslations.en.error.loginFailed;
    const message = getLoginErrorMessage(
      {
        success: false,
        message: 'database connection details',
        error: { code: 'UNRECOGNIZED_BACKEND_ERROR' },
      },
      'en',
      loginTranslations.en,
      fallback
    );

    expect(message).toBe(fallback);
  });
});
