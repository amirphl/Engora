import { act, renderHook, waitFor } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  it,
  jest as jestGlobals,
} from '@jest/globals';
import type { Mocked } from 'jest-mock';
import bundlesApi from '../api';
import { getBundlesCopy } from '../translations';
import { useBundleTagEvaluation } from './useBundleTagEvaluation';

jestGlobals.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ accessToken: 'test-token' }),
}));

jestGlobals.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

jestGlobals.mock('../../../services/api', () => ({
  __esModule: true,
  default: { setAccessToken: () => undefined },
}));

jestGlobals.mock('../api');

const mockedBundlesApi = bundlesApi as Mocked<typeof bundlesApi>;
const copy = getBundlesCopy('en');
const score = {
  evaluation_run_id: 41,
  tag_id: 7,
  tag_display_title_snapshot: 'Investors',
  bundle_fit_score: 88,
  fit_level: 'high',
  relation_type: 'direct',
  reason: 'The personas overlap.',
};

describe('useBundleTagEvaluation', () => {
  beforeEach(() => {
    jestGlobals.clearAllMocks();
    mockedBundlesApi.listTagScores.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        message: 'ok',
        items: [score],
        pagination: {
          page: 1,
          limit: 20,
          total_items: 1,
          total_pages: 1,
        },
      },
    });
  });

  it('loads the previous successful scores while an update is required', async () => {
    mockedBundlesApi.getTagEvaluationStatus.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        message: 'ok',
        item: {
          bundle_id: 12,
          status: 'update_required',
          latest_successful_run_id: 41,
        },
      },
    });

    const { result, unmount } = renderHook(() =>
      useBundleTagEvaluation({ bundleId: 12, copy })
    );

    await waitFor(() => expect(result.current.status).toBe('update_required'));
    await waitFor(() => expect(result.current.scores).toEqual([score]));
    expect(mockedBundlesApi.listTagScores).toHaveBeenCalledWith(
      12,
      { page: 1, limit: 20 },
      expect.any(AbortSignal)
    );
    unmount();
  });

  it('keeps successful scores visible when a new evaluation starts', async () => {
    mockedBundlesApi.getTagEvaluationStatus.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        message: 'ok',
        item: {
          bundle_id: 12,
          status: 'evaluated',
          latest_successful_run_id: 41,
        },
      },
    });
    mockedBundlesApi.requestTagEvaluation.mockResolvedValue({
      success: true,
      message: 'accepted',
      data: {
        message: 'accepted',
        evaluation_run_id: 42,
        status: 'evaluating',
        created_at: '2026-07-14T10:00:00Z',
      },
    });

    const { result, unmount } = renderHook(() =>
      useBundleTagEvaluation({ bundleId: 12, copy })
    );

    await waitFor(() => expect(result.current.scores).toEqual([score]));

    await act(async () => {
      expect(await result.current.requestEvaluation()).toBe(true);
    });

    expect(result.current.status).toBe('evaluating');
    expect(result.current.statusItem?.latest_run_id).toBe(42);
    expect(result.current.statusItem?.latest_successful_run_id).toBe(41);
    expect(result.current.scores).toEqual([score]);
    unmount();
  });

  it('does not request scores when the scores feature is disabled', async () => {
    mockedBundlesApi.getTagEvaluationStatus.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        message: 'ok',
        item: {
          bundle_id: 12,
          status: 'evaluated',
          latest_successful_run_id: 41,
        },
      },
    });

    const { result, unmount } = renderHook(() =>
      useBundleTagEvaluation({
        bundleId: 12,
        copy,
        scoresEnabled: false,
      })
    );

    await waitFor(() => expect(result.current.status).toBe('evaluated'));
    expect(mockedBundlesApi.listTagScores).not.toHaveBeenCalled();
    expect(result.current.scores).toEqual([]);
    unmount();
  });
});
