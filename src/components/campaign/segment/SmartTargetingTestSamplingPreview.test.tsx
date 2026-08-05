import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
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

const preview = {
  sample_size_per_tag: 600,
  tag_sampling_order: [2, 1],
  satisfied_tags: [
    {
      tag_id: 2,
      selection_order: 0,
      satisfied: true,
      available_count: 800,
    },
  ],
  unsatisfied_tags: [
    {
      tag_id: 1,
      selection_order: 1,
      satisfied: false,
      available_count: 500,
    },
  ],
  satisfied_tag_count: 1,
  effective_audience_count: 600,
  campaign_cost: 84000,
};

describe('SmartTargetingTestSamplingPreview', () => {
  beforeEach(() => {
    jestGlobals.clearAllMocks();
    mockedApiService.replaceCampaignSmartTargetingSelection.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        selected_tag_ids: [2, 1],
        summary: { selected_tag_count: 2, selected_raw_capacity: 1300 },
      },
    } as any);
  });

  it('ignores an in-flight preview after the platform context changes', async () => {
    let resolvePreview: (value: any) => void = () => {};
    mockedApiService.previewSmartTargetingTestSampling.mockImplementation(
      () =>
        new Promise(resolve => {
          resolvePreview = resolve;
        })
    );
    const onPreviewChange = jestGlobals.fn();
    const commonProps = {
      campaignUuid: 'campaign-uuid',
      bundleId: 12,
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
      canCreateCampaign: true,
      prepareCampaign: async () => ({
        success: true,
        uuid: 'campaign-uuid',
      }),
      onSampleSizeChange: jestGlobals.fn(),
      onScoreClassesChange: jestGlobals.fn(),
      onConfigurationPersisted: jestGlobals.fn(),
      onPreviewChange,
      copy,
    };

    const { rerender } = render(
      <SmartTargetingTestSamplingPreview {...commonProps} platform='sms' />
    );
    fireEvent.click(
      screen.getByRole('button', { name: copy.checkAvailability })
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(
      mockedApiService.previewSmartTargetingTestSampling
    ).toHaveBeenCalledTimes(1);

    rerender(
      <SmartTargetingTestSamplingPreview {...commonProps} platform='bale' />
    );
    await act(async () => {
      resolvePreview({ success: true, message: 'ok', data: preview });
      await Promise.resolve();
    });

    expect(onPreviewChange).not.toHaveBeenCalled();
  });
});
