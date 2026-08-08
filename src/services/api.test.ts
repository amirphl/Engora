import {
  beforeEach,
  describe,
  expect,
  it,
  jest as jestGlobals,
} from '@jest/globals';
import { apiService } from './api';

describe('campaign creation API safety', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(AbortSignal, 'timeout', {
      configurable: true,
      value: () => new AbortController().signal,
    });
    apiService.setAccessToken('access-token');
    jestGlobals.restoreAllMocks();
  });

  it('does not adopt another Campaign after an ambiguous POST response', async () => {
    const fetchMock = jestGlobals
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const response = await apiService.createCampaign({
      title: 'New sending',
      platform: 'sms',
      audience_targeting_method: 'smart_targeting',
      selected_tag_ids: [10],
      audience_grades: [],
      bundle_id: 12,
      phase: 'execution',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      success: false,
      error: { code: 'NETWORK_ERROR' },
    });
  });
});
