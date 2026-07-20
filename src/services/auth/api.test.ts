import {
  beforeEach,
  describe,
  expect,
  it,
  jest as jestGlobals,
} from '@jest/globals';
import { login, requestLoginOtp } from './api';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? 'application/json' : null,
    },
    json: async () => body,
  }) as Response;

describe('customer login API', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jestGlobals.restoreAllMocks();
  });

  it('sends identifier, password, and OTP to the single login endpoint', async () => {
    const data = {
      Customer: {
        id: 1,
        uuid: 'customer-uuid',
        email: 'customer@example.com',
        representative_first_name: 'Test',
        representative_last_name: 'Customer',
        representative_mobile: '+989123456789',
        account_type: 'company',
        created_at: '2026-01-01T00:00:00Z',
      },
      Session: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
    };
    const fetchMock = jestGlobals
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data }));

    const response = await login('09123456789', 'SecurePass123!', '123456');

    expect(response).toEqual({ success: true, message: 'Success', data });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/auth/login');
    expect(JSON.parse(String(options?.body))).toEqual({
      identifier: '+989123456789',
      password: 'SecurePass123!',
      otp_code: '123456',
    });
  });

  it('rejects an invalid OTP without making a request', async () => {
    const fetchMock = jestGlobals.spyOn(globalThis, 'fetch');

    const response = await login('09123456789', 'SecurePass123!', '12345');

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INVALID_OTP_CODE');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes an international identifier without duplicating country code', async () => {
    const fetchMock = jestGlobals
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: { Customer: {}, Session: {} } }));

    await login('989123456789', 'SecurePass123!', '123456');

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(options?.body)).identifier).toBe('+989123456789');
  });

  it('uses the dedicated OTP request endpoint with the identifier only', async () => {
    const fetchMock = jestGlobals
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: { otp_sent: true } }));

    await requestLoginOtp('+989123456789');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/auth/login/otp');
    expect(JSON.parse(String(options?.body))).toEqual({
      identifier: '+989123456789',
    });
  });

  it('normalizes HTTP rate limits into a translatable error code', async () => {
    jestGlobals
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({}, 429));

    const response = await requestLoginOtp('+989123456789');

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
