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
import { campaignLevelI18n } from './segmentTranslations';
import SmartTargetingExactCapacity from './SmartTargetingExactCapacity';

jestGlobals.mock('../../../services/api');
jestGlobals.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ accessToken: 'access-token' }),
}));
jestGlobals.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const mockedApiService = apiService as Mocked<typeof apiService>;
const copy = campaignLevelI18n.en.smartTargeting.exactCapacity;

const calculation = (overrides: Record<string, unknown> = {}) => ({
  calculation_id: 42,
  campaign_id: 7,
  bundle_id: 3,
  status: 'calculated',
  is_current: true,
  recalculation_required: false,
  selected_score_classes: ['A', 'B', 'C'],
  selected_tag_count: 1,
  raw_audience_count: 1500,
  eligible_unique_audience_count_before_approved_campaign_deduction: 900,
  approved_campaign_audience_deduction: 100,
  usable_unique_audience_count: 800,
  created_at: '2026-08-03T10:00:00Z',
  ...overrides,
});

const defaultProps = () => ({
  campaignUuid: 'campaign-uuid',
  selectedTagIds: [10],
  selectedRawCapacity: 1500,
  selectionIsDirty: false,
  selectedScoreClasses: [],
  scoreClassesAreDirty: false,
  initialCalculation: null,
  onSelectionPersisted: jestGlobals.fn(),
  onScoreClassesChange: jestGlobals.fn(),
  onCalculationChange: jestGlobals.fn(),
  copy,
});

describe('SmartTargetingExactCapacity', () => {
  beforeEach(() => {
    jestGlobals.clearAllMocks();
    mockedApiService.getCurrentSmartTargetingCapacityCalculation.mockResolvedValue(
      {
        success: false,
        message: 'not found',
        error: { code: 'NOT_FOUND' },
      }
    );
  });

  afterEach(() => {
    jestGlobals.useRealTimers();
  });

  it('persists the full dirty selection before starting a calculation', async () => {
    const props = { ...defaultProps(), selectionIsDirty: true };
    mockedApiService.replaceCampaignSmartTargetingSelection.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        selected_tag_ids: [10],
        summary: { selected_tag_count: 1, selected_raw_capacity: 1500 },
      },
    });
    mockedApiService.startSmartTargetingCapacityCalculation.mockResolvedValue({
      success: true,
      message: 'accepted',
      data: calculation({
        status: 'calculating',
        raw_audience_count: null,
        eligible_unique_audience_count_before_approved_campaign_deduction: null,
        approved_campaign_audience_deduction: null,
        usable_unique_audience_count: null,
      }) as any,
    });

    render(<SmartTargetingExactCapacity {...props} />);
    const calculateButton = screen.getByRole('button', {
      name: copy.calculate,
    });
    await waitFor(() =>
      expect((calculateButton as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(
        mockedApiService.replaceCampaignSmartTargetingSelection
      ).toHaveBeenCalledWith(
        'campaign-uuid',
        { tag_ids: [10] },
        expect.any(AbortSignal)
      );
    });
    await waitFor(() => {
      expect(
        mockedApiService.startSmartTargetingCapacityCalculation
      ).toHaveBeenCalledWith('campaign-uuid', {}, expect.any(AbortSignal));
    });
    expect(props.onSelectionPersisted).toHaveBeenCalledWith([10], 1500);
    expect(await screen.findByText(copy.calculationInProgress)).toBeTruthy();
  });

  it('restores and displays every backend capacity value, including zero', async () => {
    mockedApiService.getCurrentSmartTargetingCapacityCalculation.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: calculation({ usable_unique_audience_count: 0 }) as any,
      }
    );

    render(<SmartTargetingExactCapacity {...defaultProps()} />);

    expect(await screen.findByText(copy.zeroCapacity)).toBeTruthy();
    expect(screen.getByText(copy.eligibleBeforeDeduction)).toBeTruthy();
    expect(screen.getByText(copy.approvedDeduction)).toBeTruthy();
    expect(screen.getByText(copy.exactUsableCapacity)).toBeTruthy();
    expect(screen.getByText(`0 ${copy.audiences}`)).toBeTruthy();
  });

  it('marks a restored result stale and hides its usable value after tags change', async () => {
    mockedApiService.getCurrentSmartTargetingCapacityCalculation.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: calculation() as any,
      }
    );
    const props = defaultProps();
    const { rerender } = render(<SmartTargetingExactCapacity {...props} />);

    expect(await screen.findByText(`800 ${copy.audiences}`)).toBeTruthy();
    rerender(
      <SmartTargetingExactCapacity
        {...props}
        selectedTagIds={[10, 20]}
        selectionIsDirty
      />
    );

    expect(await screen.findByText(copy.recalculationMessage)).toBeTruthy();
    expect(screen.queryByText(`800 ${copy.audiences}`)).toBeNull();
  });

  it('disables calculation and explains the state before a Campaign exists', () => {
    const props = defaultProps();
    render(<SmartTargetingExactCapacity {...props} campaignUuid={undefined} />);

    expect(
      (
        screen.getByRole('button', {
          name: copy.calculate,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(screen.getByText(copy.saveCampaignFirst)).toBeTruthy();
  });

  it('waits more than ten seconds before polling and stops on completion', async () => {
    jestGlobals.useFakeTimers();
    mockedApiService.getCurrentSmartTargetingCapacityCalculation.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: calculation({
          status: 'calculating',
          raw_audience_count: null,
          eligible_unique_audience_count_before_approved_campaign_deduction:
            null,
          approved_campaign_audience_deduction: null,
          usable_unique_audience_count: null,
        }) as any,
      }
    );
    mockedApiService.getSmartTargetingCapacityCalculationById.mockResolvedValue(
      {
        success: true,
        message: 'ok',
        data: calculation() as any,
      }
    );

    render(<SmartTargetingExactCapacity {...defaultProps()} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => jestGlobals.advanceTimersByTime(10_000));
    expect(
      mockedApiService.getSmartTargetingCapacityCalculationById
    ).not.toHaveBeenCalled();

    await act(async () => {
      jestGlobals.advanceTimersByTime(2_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      mockedApiService.getSmartTargetingCapacityCalculationById
    ).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`800 ${copy.audiences}`)).toBeTruthy();

    act(() => jestGlobals.advanceTimersByTime(60_000));
    expect(
      mockedApiService.getSmartTargetingCapacityCalculationById
    ).toHaveBeenCalledTimes(1);
  });
});
