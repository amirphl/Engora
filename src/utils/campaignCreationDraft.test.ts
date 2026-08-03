import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  normalizeCampaignResponseToDraft,
  prepareCampaignCreationDraft,
} from './campaignCreationDraft';
import { GetCampaignResponse } from '../types/campaign';
import { LEVEL_SELECTION_KEY } from '../types/segment';

const response: GetCampaignResponse = {
  id: 42,
  uuid: 'source-uuid',
  status: 'rejected',
  created_at: '2026-01-01T00:00:00Z',
  title: 'Source',
  level1: 'Consumers',
  level2s: ['Retail'],
  level3s: ['Online'],
  target_audience_excel_file_uuid: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
  tags: ['buyer'],
  audience_targeting_method: 'smart_targeting',
  sex: 'all',
  city: ['Tehran', 'Shiraz'],
  adlink: 'https://example.com/{uid}',
  content: 'Visit joinsahel.ir/xxxxxx',
  short_link_domain: null,
  job_category: 'Technology',
  job: 'Engineer',
  scheduleat: '2030-01-01T08:30:00Z',
  line_number: '30001234',
  platform: 'bale',
  platform_settings_id: 9,
  media_uuid: '6ba7b811-9dad-41d1-80b4-00c04fd430c8',
  budget: 250000,
  num_audience: 750,
  audience_grades: ['A', 'B'],
  bundle_id: 12,
  phase: 'test',
};

describe('campaign creation draft normalization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('maps every campaign creation field without inventing a short domain', () => {
    const draft = normalizeCampaignResponseToDraft(response, {
      smartTargetingSelection: {
        selectedTagIds: [3, 3, -1, 4],
        selectedRawCapacity: 750,
      },
    });

    expect(draft.id).toBe(42);
    expect(draft.uuid).toBe('source-uuid');
    expect(draft.segment).toMatchObject({
      campaignTitle: 'Source',
      level1: 'Consumers',
      level2s: ['Retail'],
      level3s: ['Online'],
      audienceTargetingMethod: 'smart_targeting',
      selectedTagIds: [3, 4],
      smartTargetingSelectedRawCapacity: 750,
      audienceGrades: ['A', 'B'],
      sex: 'all',
      city: ['Tehran', 'Shiraz'],
      jobCategory: 'Technology',
      job: 'Engineer',
      bundleId: 12,
      phase: 'test',
    });
    expect(draft.content).toMatchObject({
      insertLink: true,
      link: 'https://example.com/{uid}',
      text: 'Visit {YOUR_LINK}',
      scheduleAt: '2030-01-01T08:30:00Z',
      shortLinkDomain: null,
      lineNumber: '30001234',
      platformSettingsId: 9,
      mediaUuid: '6ba7b811-9dad-41d1-80b4-00c04fd430c8',
    });
    expect(draft.budget.totalBudget).toBe(250000);
    expect(draft.payment.finalCost).toBeUndefined();
  });

  it('clears identity and schedule for restart without falling back to source', () => {
    const draft = normalizeCampaignResponseToDraft(response, {
      id: null,
      uuid: '',
      clearSchedule: true,
    });

    expect(draft.id).toBeUndefined();
    expect(draft.uuid).toBe('');
    expect(draft.content.scheduleAt).toBeUndefined();
  });

  it('persists targeting mode and Smart Targeting selection in both stores', () => {
    const draft = normalizeCampaignResponseToDraft(response, {
      smartTargetingSelection: {
        selectedTagIds: [3, 4],
        selectedRawCapacity: 750,
      },
    });

    prepareCampaignCreationDraft(draft);

    expect(
      JSON.parse(localStorage.getItem('campaign_creation_data') || '{}').segment
        .selectedTagIds
    ).toEqual([3, 4]);
    expect(
      JSON.parse(localStorage.getItem(LEVEL_SELECTION_KEY) || '{}')
    ).toMatchObject({
      audienceTargetingMethod: 'smart_targeting',
      selectedTagIds: [3, 4],
      smartTargetingSelectedRawCapacity: 750,
    });
    expect(localStorage.getItem('campaign_creation_step')).toBe('1');
  });
});
