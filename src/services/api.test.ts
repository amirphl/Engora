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
      value: jestGlobals.fn(() => new AbortController().signal),
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

  it('posts the Smart Targeting Test preview without a request body', async () => {
    const fetchMock = jestGlobals.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: 'ok',
          data: {
            sample_size_per_tag: 600,
            tag_sampling_order: [2],
            satisfied_tags: [
              {
                tag_id: 2,
                selection_order: 0,
                satisfied: true,
                available_count: 700,
              },
            ],
            unsatisfied_tags: [],
            satisfied_tag_count: 1,
            effective_audience_count: 600,
            campaign_cost: 84000,
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    );

    const response =
      await apiService.previewSmartTargetingTestSampling('campaign-uuid');

    expect(response.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/campaigns/campaign-uuid/smart-targeting/test-sampling-preview'
      ),
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined();
    expect(AbortSignal.timeout).toHaveBeenCalledWith(150000);
  });
});
