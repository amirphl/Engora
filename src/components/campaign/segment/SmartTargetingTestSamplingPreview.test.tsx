import React from 'react';
import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest as jestGlobals,
} from '@jest/globals';
import type { Mocked } from 'jest-mock';
import { apiService } from '../../../services/api';
import { AudienceGrade } from '../../../types/campaign';
import { campaignLevelI18n } from './segmentTranslations';
import SmartTargetingTestSamplingPreview from './SmartTargetingTestSamplingPreview';

jestGlobals.mock('../../../services/api');
jestGlobals.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ accessToken: 'token' }),
}));
jestGlobals.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const mockedApiService = apiService as Mocked<typeof apiService>;
const copy = campaignLevelI18n.en.smartTargeting.testPreview;

const calculation = (overrides: Record<string, unknown> = {}) => ({
  calculation_id: 91,
  campaign_id: 7,
  bundle_id: 12,
  status: 'queued',
  is_current: true,
  recalculation_required: false,
  sample_size_per_tag: 600,
  tag_sampling_order: [2, 1],
  selected_score_classes: ['A'],
  created_at: '2026-08-16T10:00:00Z',
  ...overrides,
});

const completedPreview = {
  sample_size_per_tag: 600,
  tag_sampling_order: [2, 1],
  satisfied_tags: [
    {
      tag_id: 2,
      tag_display_name: 'High intent',
      selection_order: 0,
      satisfied: true,
      available_count: 800,
    },
  ],
  unsatisfied_tags: [
    {
      tag_id: 1,
      tag_display_name: 'Dormant customers',
      selection_order: 1,
      satisfied: false,
      available_count: 500,
    },
  ],
  satisfied_tag_count: 1,
  effective_audience_count: 600,
  campaign_cost: 84000,
};

const completedCalculation = calculation({
  status: 'completed',
  ...completedPreview,
});

const defaultProps = () => ({
  campaignUuid: 'campaign-uuid',
  bundleId: 12,
  platform: 'sms' as const,
  selectedTagIds: [2, 1],
  selectedRawCapacity: 1300,
  sampleSizePerTag: 600,
  selectedScoreClasses: ['A'] as AudienceGrade[],
  sortBy: 'tag_capacity' as const,
  sortDirection: 'desc' as const,
  preview: null,
  previewIsCurrent: false,
  previewIsStale: false,
  selectionOrderIsPending: false,
  prepareCampaign: jestGlobals.fn(async () => ({
    success: true,
    uuid: 'campaign-uuid',
  })),
  onConfigurationPersisted: jestGlobals.fn(),
  onPreviewChange: jestGlobals.fn(),
  onPreviewInvalidated: jestGlobals.fn(),
  copy,
});

const notFoundResponse = {
  success: false,
  message: 'not found',
  error: { code: 'NOT_FOUND' },
};

describe('SmartTargetingTestSamplingPreview', () => {
  beforeEach(() => {
    jestGlobals.clearAllMocks();
    mockedApiService.getCurrentSmartTargetingTestSamplingCalculation.mockResolvedValue(
      notFoundResponse
    );
    mockedApiService.replaceCampaignSmartTargetingSelection.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        selected_tag_ids: [2, 1],
        summary: { selected_tag_count: 2, selected_raw_capacity: 1300 },
      },
    } as any);
  });

  afterEach(() => {
    jestGlobals.useRealTimers();
  });

  it('uses tag display names in the sampling result lists', async () => {
    render(
      <SmartTargetingTestSamplingPreview
        {...defaultProps()}
        preview={completedPreview}
        previewIsCurrent
      />
    );

    expect(screen.getByText('High intent')).toBeTruthy();
    expect(screen.getByText(/Dormant customers/)).toBeTruthy();
    expect(screen.queryByText(`${copy.tagLabel} 2`)).toBeNull();
    expect(screen.queryByText(`${copy.tagLabel} 1`)).toBeNull();
    await waitFor(() =>
      expect(screen.queryByText(copy.loadingCurrent)).toBeNull()
    );
  });

  it('falls back to the tag ID when a display name is unavailable', async () => {
    render(
      <SmartTargetingTestSamplingPreview
        {...defaultProps()}
        preview={{
          ...completedPreview,
          satisfied_tags: [
            {
              ...completedPreview.satisfied_tags[0],
              tag_display_name: null,
            },
          ],
        }}
        previewIsCurrent
      />
    );

    expect(screen.getByText(`${copy.tagLabel} 2`)).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText(copy.loadingCurrent)).toBeNull()
    );
  });

  it('invalidates an older preview when the backend reports an active job', async () => {
    const props = defaultProps();
    mockedApiService.getCurrentSmartTargetingTestSamplingCalculation.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: calculation({ status: 'calculating' }) as any,
      }
    );

    render(
      <SmartTargetingTestSamplingPreview
        {...props}
        preview={completedPreview}
        previewIsCurrent
      />
    );

    await waitFor(() =>
      expect(props.onPreviewInvalidated).toHaveBeenCalledTimes(1)
    );
  });

  it('keeps the button disabled with a spinner until polling completes', async () => {
    const props = defaultProps();
    mockedApiService.startSmartTargetingTestSamplingCalculation.mockResolvedValue(
      {
        success: true,
        message: 'accepted',
        data: calculation() as any,
      }
    );
    mockedApiService.getSmartTargetingTestSamplingCalculationById.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: completedCalculation as any,
      }
    );

    render(<SmartTargetingTestSamplingPreview {...props} />);
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    const button = screen.getByRole('button', {
      name: copy.checkAvailability,
    });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    );

    jestGlobals.useFakeTimers();
    fireEvent.click(button);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const calculatingButton = screen.getByRole('button', {
      name: copy.checkingAvailability,
    });
    expect((calculatingButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('smart-targeting-sampling-spinner')).toBeTruthy();
    expect(screen.getByText(copy.calculationInProgress)).toBeTruthy();

    await act(async () => {
      jestGlobals.advanceTimersByTime(12_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      mockedApiService.getSmartTargetingTestSamplingCalculationById
    ).toHaveBeenCalledWith('campaign-uuid', 91, expect.any(AbortSignal));
    expect(props.onPreviewChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sample_size_per_tag: 600,
        effective_audience_count: 600,
        campaign_cost: 84000,
      }),
      'campaign-uuid'
    );
    expect(
      (
        screen.getByRole('button', {
          name: copy.checkAvailability,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  it('resumes an active calculation returned by the current-job endpoint', async () => {
    mockedApiService.getCurrentSmartTargetingTestSamplingCalculation.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: calculation({ status: 'calculating' }) as any,
      }
    );

    render(<SmartTargetingTestSamplingPreview {...defaultProps()} />);

    const button = await screen.findByRole('button', {
      name: copy.checkingAvailability,
    });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(
      mockedApiService.startSmartTargetingTestSamplingCalculation
    ).not.toHaveBeenCalled();
  });

  it('reconciles an ambiguous submit failure instead of submitting twice', async () => {
    const props = defaultProps();
    mockedApiService.getCurrentSmartTargetingTestSamplingCalculation
      .mockResolvedValueOnce(notFoundResponse)
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: calculation({ status: 'processing' }) as any,
      });
    mockedApiService.startSmartTargetingTestSamplingCalculation.mockResolvedValue(
      {
        success: false,
        message: 'timeout',
        error: { code: 'TIMEOUT_ERROR' },
      }
    );

    render(<SmartTargetingTestSamplingPreview {...props} />);
    const button = screen.getByRole('button', {
      name: copy.checkAvailability,
    });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(button);

    expect(
      (await screen.findByRole('button', {
        name: copy.checkingAvailability,
      })) as HTMLButtonElement
    ).toHaveProperty('disabled', true);
    expect(
      mockedApiService.startSmartTargetingTestSamplingCalculation
    ).toHaveBeenCalledTimes(1);
    expect(
      mockedApiService.getCurrentSmartTargetingTestSamplingCalculation
    ).toHaveBeenCalledTimes(2);
  });

  it('shows a translated failure and allows a new submission', async () => {
    mockedApiService.startSmartTargetingTestSamplingCalculation.mockResolvedValue(
      {
        success: true,
        message: 'accepted',
        data: calculation({
          status: 'failed',
          error_code: 'SMART_TARGETING_TEST_SAMPLING_FAILED',
        }) as any,
      }
    );

    render(<SmartTargetingTestSamplingPreview {...defaultProps()} />);
    const button = screen.getByRole('button', {
      name: copy.checkAvailability,
    });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(button);

    expect(
      await screen.findByText(
        'Smart Targeting Test sampling calculation failed. Please try again'
      )
    ).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('allows a new submission after a terminal polling error', async () => {
    mockedApiService.startSmartTargetingTestSamplingCalculation.mockResolvedValue(
      {
        success: true,
        message: 'accepted',
        data: calculation() as any,
      }
    );
    mockedApiService.getSmartTargetingTestSamplingCalculationById.mockResolvedValue(
      {
        success: false,
        message: 'not found',
        error: {
          code: 'SMART_TARGETING_TEST_SAMPLING_CALCULATION_NOT_FOUND',
        },
      }
    );

    render(<SmartTargetingTestSamplingPreview {...defaultProps()} />);
    const button = screen.getByRole('button', {
      name: copy.checkAvailability,
    });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    );

    jestGlobals.useFakeTimers();
    fireEvent.click(button);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      jestGlobals.advanceTimersByTime(12_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      (
        screen.getByRole('button', {
          name: copy.checkAvailability,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  it('ignores an in-flight submission after the platform context changes', async () => {
    let resolveCalculation: (value: any) => void = () => {};
    mockedApiService.startSmartTargetingTestSamplingCalculation.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCalculation = resolve;
        })
    );
    const props = defaultProps();
    const { rerender } = render(
      <SmartTargetingTestSamplingPreview {...props} />
    );
    const button = screen.getByRole('button', {
      name: copy.checkAvailability,
    });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        mockedApiService.startSmartTargetingTestSamplingCalculation
      ).toHaveBeenCalledTimes(1)
    );

    rerender(<SmartTargetingTestSamplingPreview {...props} platform='bale' />);
    await act(async () => {
      resolveCalculation({
        success: true,
        message: 'accepted',
        data: calculation(),
      });
      await Promise.resolve();
    });

    expect(props.onPreviewChange).not.toHaveBeenCalled();
  });
});
