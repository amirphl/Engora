import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { CampaignProvider, useCampaign } from './useCampaign';
import { LEVEL_SELECTION_KEY } from '../types/segment';

const CampaignProbe = () => {
  const { campaignData, currentStep } = useCampaign();
  return (
    <output data-testid='campaign-state'>
      {JSON.stringify({ campaignData, currentStep })}
    </output>
  );
};

const ResetCampaignProbe = () => {
  const { campaignData, currentStep, resetCampaign } = useCampaign();
  return (
    <>
      <button type='button' onClick={resetCampaign}>
        Reset
      </button>
      <output data-testid='campaign-state'>
        {JSON.stringify({ campaignData, currentStep })}
      </output>
    </>
  );
};

describe('CampaignProvider draft hydration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes malformed and legacy localStorage fields safely', async () => {
    localStorage.setItem('campaign_creation_step', '99');
    localStorage.setItem(
      'campaign_creation_data',
      JSON.stringify({
        id: 2.5,
        uuid: 123,
        level: {
          campaignTitle: 99,
          level1: 'Consumers',
          level2s: ['Retail', null],
          level3s: 'invalid',
          platform: 'invalid',
          audienceTargetingMethod: 'smart_targeting',
          selectedTagIds: [2, 2, -1, '4'],
          smartTargetingSelectedRawCapacity: -10,
          audienceGrades: ['A', 'D', 'A'],
          city: ['Tehran', null, ''],
          bundleId: -1,
          phase: 'invalid',
        },
        content: {
          insertLink: 'yes',
          link: 5,
          text: 'Visit jo1n.ir/xxxxxx',
          shortLinkDomain: '',
          platformSettingsId: -1,
          mediaUuid: 4,
        },
        budget: { totalBudget: Number.NaN },
        payment: {
          termsAccepted: 'yes',
          finalCost: 1000,
          total: 1000,
          hasEnoughBalance: true,
        },
      })
    );

    render(
      <CampaignProvider>
        <CampaignProbe />
      </CampaignProvider>
    );

    const state = JSON.parse(
      screen.getByTestId('campaign-state').textContent || '{}'
    );
    expect(state.currentStep).toBe(1);
    expect(state.campaignData.id).toBeUndefined();
    expect(state.campaignData).toMatchObject({
      uuid: '',
      segment: {
        campaignTitle: '',
        level1: 'Consumers',
        level2s: ['Retail'],
        level3s: [],
        platform: 'sms',
        audienceTargetingMethod: 'smart_targeting',
        selectedTagIds: [2, 4],
        smartTargetingSelectedRawCapacity: 0,
        audienceGrades: ['A'],
        city: ['Tehran'],
        bundleId: null,
        phase: 'execution',
      },
      content: {
        insertLink: false,
        link: '',
        text: 'Visit {YOUR_LINK}',
        shortLinkDomain: null,
        platformSettingsId: null,
        mediaUuid: null,
      },
      budget: { totalBudget: 0 },
      payment: {
        termsAccepted: false,
      },
    });
    expect(state.campaignData.payment.finalCost).toBeUndefined();
    expect(state.campaignData.payment.total).toBeUndefined();
    expect(state.campaignData.payment.hasEnoughBalance).toBeUndefined();

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem('campaign_creation_data') || '{}'
      );
      expect({
        finalCost: stored.payment.finalCost,
        estimatedMessages: stored.budget.estimatedMessages,
      }).toEqual({
        finalCost: undefined,
        estimatedMessages: undefined,
      });
    });
  });

  it('keeps all campaign storage cleared after resetting state', async () => {
    localStorage.setItem('campaign_creation_step', '3');
    localStorage.setItem(
      'campaign_creation_data',
      JSON.stringify({
        id: 7,
        uuid: 'campaign-uuid',
        segment: {
          campaignTitle: 'Draft campaign',
          level1: 'Consumers',
        },
      })
    );
    localStorage.setItem(LEVEL_SELECTION_KEY, '{"campaignTitle":"Draft"}');

    render(
      <CampaignProvider>
        <ResetCampaignProbe />
      </CampaignProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => {
      expect(localStorage.getItem('campaign_creation_data')).toBeNull();
    });

    const state = JSON.parse(
      screen.getByTestId('campaign-state').textContent || '{}'
    );
    expect(state.currentStep).toBe(1);
    expect(state.campaignData.uuid).toBe('');
    expect(state.campaignData.segment.campaignTitle).toBe('');
    expect(localStorage.getItem('campaign_creation_step')).toBeNull();
    expect(localStorage.getItem(LEVEL_SELECTION_KEY)).toBeNull();
  });
});
