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
});
