import { renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { CampaignData } from '../types/campaign';
import { useCampaignValidation } from './useCampaignValidation';
import { getSmartTargetingTestPreviewInputKey } from '../utils/smartTargetingTestPreview';

const createValidCampaign = (): CampaignData => ({
  id: 10,
  uuid: 'campaign-uuid',
  segment: {
    campaignTitle: 'Campaign',
    level1: 'Consumers',
    level2s: ['Retail'],
    level3s: ['Online'],
    targetAudienceExcelFileUuid: null,
    platform: 'sms',
    tags: ['buyer'],
    audienceTargetingMethod: 'standard',
    selectedTagIds: [],
    smartTargetingSelectedRawCapacity: 0,
    capacityTooLow: false,
    capacity: 600,
    audienceGrades: ['A'],
    sex: '',
    city: [],
    jobCategory: '',
    job: '',
    bundleId: 12,
    phase: 'execution',
  },
  content: {
    insertLink: false,
    link: '',
    text: 'Campaign message',
    scheduleAt: '2026-07-27T07:00:00.000Z',
    shortLinkDomain: null,
    lineNumber: '30001234',
    platformSettingsId: null,
    mediaUuid: null,
  },
  budget: {
    totalBudget: 100000,
  },
  payment: {
    paymentMethod: '',
    termsAccepted: false,
    finalCost: 100000,
    total: 100000,
    hasEnoughBalance: true,
  },
});

describe('useCampaignValidation transitions', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T06:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('requires every preceding step before the payment step can finish', () => {
    const campaign = createValidCampaign();
    campaign.segment.campaignTitle = '';

    const { result } = renderHook(() => useCampaignValidation(campaign, 4));

    expect(result.current.isStepCompleted(4)).toBe(true);
    expect(result.current.isStepAccessible(4)).toBe(false);
    expect(result.current.canFinishCampaign()).toBe(false);
  });

  it('rejects a non-v4 Excel audience UUID', () => {
    const campaign = createValidCampaign();
    campaign.segment.audienceTargetingMethod = 'excel';
    campaign.segment.targetAudienceExcelFileUuid =
      '6ba7b810-9dad-31d1-80b4-00c04fd430c8';

    const { result } = renderHook(() => useCampaignValidation(campaign, 1));

    expect(result.current.isStepCompleted(1)).toBe(false);
    expect(result.current.getStepErrors(1)).toContain(
      'Please upload a valid Excel audience file'
    );
  });

  it('rejects fractional budgets before cost calculation', () => {
    const campaign = createValidCampaign();
    campaign.budget.totalBudget = 100000.5;

    const { result } = renderHook(() => useCampaignValidation(campaign, 3));

    expect(result.current.isStepCompleted(3)).toBe(false);
    expect(result.current.getStepErrors(3)).toContain(
      'Total budget must be a whole number'
    );
  });

  it('accepts a finite zero calculated cost for free campaigns', () => {
    const campaign = createValidCampaign();
    campaign.payment.finalCost = 0;

    const { result } = renderHook(() => useCampaignValidation(campaign, 4));

    expect(result.current.isStepCompleted(4)).toBe(true);
    expect(result.current.canFinishCampaign()).toBe(true);
  });

  it('keeps exact capacity optional until a Smart Targeting update requires it', () => {
    const campaign = createValidCampaign();
    campaign.segment.audienceTargetingMethod = 'smart_targeting';
    campaign.segment.selectedTagIds = [10];
    campaign.segment.smartTargetingSelectedRawCapacity = 1500;
    campaign.segment.audienceGrades = [];

    const { result: optionalResult, unmount: unmountOptional } = renderHook(
      () => useCampaignValidation(campaign, 3)
    );
    expect(optionalResult.current.isStepCompleted(1)).toBe(true);
    expect(optionalResult.current.isStepCompleted(3)).toBe(true);
    unmountOptional();

    campaign.segment.smartTargetingExactCapacityRequired = true;
    const { result: blockedResult, unmount: unmountBlocked } = renderHook(() =>
      useCampaignValidation(campaign, 1)
    );
    expect(blockedResult.current.isStepCompleted(1)).toBe(false);
    unmountBlocked();

    campaign.segment.smartTargetingCapacityCalculation = {
      calculation_id: 42,
      campaign_id: 10,
      bundle_id: 12,
      status: 'calculated',
      is_current: true,
      recalculation_required: false,
      selected_score_classes: ['A', 'B', 'C'],
      selected_tag_count: 1,
      usable_unique_audience_count: 800,
      created_at: '2026-07-27T06:00:00.000Z',
    };
    const { result: recalculatedResult } = renderHook(() =>
      useCampaignValidation(campaign, 1)
    );
    expect(recalculatedResult.current.isStepCompleted(1)).toBe(true);

    campaign.segment.smartTargetingSelectionDirty = true;
    campaign.segment.selectedTagIds = [11];
    const { result: changedSelectionResult } = renderHook(() =>
      useCampaignValidation(campaign, 1)
    );
    expect(changedSelectionResult.current.isStepCompleted(1)).toBe(false);
  });

  it('uses a current all-or-nothing preview for Smart Targeting Test Step 3', () => {
    const campaign = createValidCampaign();
    campaign.segment.audienceTargetingMethod = 'smart_targeting';
    campaign.segment.phase = 'test';
    campaign.segment.selectedTagIds = [30, 10];
    campaign.segment.smartTargetingSelectedRawCapacity = 10;
    campaign.segment.sampleSizePerTag = 600;
    campaign.segment.smartTargetingScoreClasses = ['A'];
    campaign.segment.smartTargetingExactCapacityRequired = true;
    campaign.segment.smartTargetingTestPreview = {
      sample_size_per_tag: 600,
      tag_sampling_order: [30, 10],
      satisfied_tags: [
        {
          tag_id: 30,
          tag_display_name: 'High intent',
          selection_order: 0,
          satisfied: true,
          available_count: 800,
        },
      ],
      unsatisfied_tags: [
        {
          tag_id: 10,
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
    campaign.segment.smartTargetingTestPreviewInputKey =
      getSmartTargetingTestPreviewInputKey(campaign.uuid, campaign.segment);
    campaign.budget.totalBudget = 84000;

    const { result } = renderHook(() => useCampaignValidation(campaign, 3));

    expect(result.current.isStepCompleted(1)).toBe(true);
    expect(result.current.isStepCompleted(3)).toBe(true);
  });

  it('requires Test sample size and at least one score class on Step 1', () => {
    const campaign = createValidCampaign();
    campaign.segment.audienceTargetingMethod = 'smart_targeting';
    campaign.segment.phase = 'test';
    campaign.segment.selectedTagIds = [30];
    campaign.segment.sampleSizePerTag = 0;
    campaign.segment.smartTargetingScoreClasses = [];

    const { result, unmount } = renderHook(() =>
      useCampaignValidation(campaign, 1)
    );

    expect(result.current.isStepCompleted(1)).toBe(false);
    expect(result.current.getStepErrors(1)).toContain(
      'Sample Size per Tag must be a positive whole number'
    );
    expect(result.current.getStepErrors(1)).toContain(
      'Please select at least one audience score class'
    );
    unmount();

    campaign.segment.sampleSizePerTag = 600;
    campaign.segment.smartTargetingScoreClasses = ['A'];
    const { result: completedResult } = renderHook(() =>
      useCampaignValidation(campaign, 1)
    );
    expect(completedResult.current.isStepCompleted(1)).toBe(true);
  });

  it('blocks Smart Targeting Execution when the calculated audience exceeds exact usable capacity', () => {
    const campaign = createValidCampaign();
    campaign.segment.audienceTargetingMethod = 'smart_targeting';
    campaign.segment.phase = 'execution';
    campaign.segment.selectedTagIds = [10];
    campaign.segment.smartTargetingSelectedRawCapacity = 1500;
    campaign.segment.smartTargetingCapacityCalculation = {
      calculation_id: 42,
      campaign_id: 10,
      bundle_id: 12,
      status: 'calculated',
      is_current: true,
      recalculation_required: false,
      selected_score_classes: ['A', 'B', 'C'],
      selected_tag_count: 1,
      usable_unique_audience_count: 800,
      created_at: '2026-07-27T06:00:00.000Z',
    };
    campaign.budget.estimatedMessages = 801;

    const { result } = renderHook(() => useCampaignValidation(campaign, 3));

    expect(result.current.isStepCompleted(3)).toBe(false);
    expect(result.current.getStepErrors(3)).toContain(
      'The requested audience count exceeds the exact usable capacity'
    );
  });

  it('explains a current Test preview with no satisfied tags instead of requesting the same preview again', () => {
    const campaign = createValidCampaign();
    campaign.segment.audienceTargetingMethod = 'smart_targeting';
    campaign.segment.phase = 'test';
    campaign.segment.selectedTagIds = [30];
    campaign.segment.sampleSizePerTag = 600;
    campaign.segment.smartTargetingTestPreview = {
      sample_size_per_tag: 600,
      tag_sampling_order: [30],
      satisfied_tags: [],
      unsatisfied_tags: [
        {
          tag_id: 30,
          tag_display_name: 'High intent',
          selection_order: 0,
          satisfied: false,
          available_count: 500,
        },
      ],
      satisfied_tag_count: 0,
      effective_audience_count: 0,
      campaign_cost: 0,
    };
    campaign.segment.smartTargetingTestPreviewInputKey =
      getSmartTargetingTestPreviewInputKey(campaign.uuid, campaign.segment);
    campaign.budget.totalBudget = 0;

    const { result } = renderHook(() => useCampaignValidation(campaign, 3));

    expect(result.current.isStepCompleted(3)).toBe(false);
    expect(result.current.getStepErrors(3)).toContain(
      'No selected tag can currently provide the full requested Test sample'
    );
  });
});
