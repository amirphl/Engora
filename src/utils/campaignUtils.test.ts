import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  calculateSMSParts,
  calculateTotalCharacterCount,
  countCharacters,
  normalizeLinkPlaceholder,
  serializeCampaignPayload,
  validateCampaignContent,
} from './campaignUtils';
import { CampaignData } from '../types/campaign';

const campaignData = (overrides: Partial<CampaignData> = {}): CampaignData => ({
  id: 7,
  uuid: 'campaign-uuid',
  segment: {
    campaignTitle: 'Campaign',
    level1: 'Consumers',
    level2s: ['Retail'],
    level3s: ['Online'],
    targetAudienceExcelFileUuid: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
    platform: 'sms',
    tags: ['buyer'],
    audienceTargetingMethod: 'standard',
    selectedTagIds: [21, 22],
    smartTargetingSelectedRawCapacity: 800,
    capacity: 1200,
    capacityTooLow: false,
    audienceGrades: ['A'],
    sex: 'all',
    city: ['Tehran'],
    jobCategory: 'Technology',
    job: 'Engineer',
    bundleId: 11,
    phase: 'execution',
  },
  content: {
    insertLink: true,
    link: 'https://example.com/promo/{uid}',
    text: 'Visit {YOUR_LINK}',
    scheduleAt: '2030-01-01T08:30:00.000Z',
    shortLinkDomain: null,
    lineNumber: '30001234',
    platformSettingsId: null,
    mediaUuid: null,
  },
  budget: {
    totalBudget: 100000,
    estimatedMessages: 1000,
  },
  payment: {
    paymentMethod: '',
    termsAccepted: false,
    finalCost: 50000,
    total: 50000,
    hasEnoughBalance: true,
  },
  ...overrides,
});

describe('campaignUtils SMS counting', () => {
  it('counts the adlink characters when short link is disabled', () => {
    const text = 'Visit {YOUR_LINK}';
    const adLink = 'https://example.com/promo/{uid}';

    expect(countCharacters(text, adLink, null, 'sms')).toBe(44);
  });

  it('counts the short link characters when a short link domain is enabled', () => {
    const text = 'Visit {YOUR_LINK}';
    const adLink = 'https://example.com/promo/{uid}';

    expect(countCharacters(text, adLink, 'jo1n.ir', 'sms')).toBe(26);
  });

  it('returns matching total characters and parts for raw adlink substitution', () => {
    const result = calculateTotalCharacterCount(
      'Visit {YOUR_LINK}',
      true,
      'https://example.com/promo/{uid}',
      null,
      'sms'
    );

    expect(result.startCount).toBe(6);
    expect(result.characterCount).toBe(38);
    expect(result.totalCharacterCount).toBe(44);
    expect(calculateSMSParts(result.totalCharacterCount)).toBe(1);
  });

  it('normalizes placeholders from every supported short-link domain', () => {
    expect(normalizeLinkPlaceholder('joinsahel.ir/xxxxxx')).toBe('{YOUR_LINK}');
  });
});

describe('campaignUtils API serialization', () => {
  it('preserves inactive targeting data and update-sensitive content fields', () => {
    const payload = serializeCampaignPayload(campaignData(), {
      includeContent: false,
      includeBudget: false,
      finalize: false,
    });

    expect(payload).toMatchObject({
      title: 'Campaign',
      level1: 'Consumers',
      level2s: ['Retail'],
      level3s: ['Online'],
      tags: ['buyer'],
      target_audience_excel_file_uuid: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
      audience_targeting_method: 'standard',
      sex: 'all',
      city: ['Tehran'],
      audience_grades: ['A'],
      adlink: 'https://example.com/promo/{uid}',
      scheduleat: '2030-01-01T08:30:00.000Z',
      short_link_domain: null,
      line_number: '30001234',
      bundle_id: 11,
      phase: 'execution',
      finalize: false,
    });
    expect(payload.selected_tag_ids).toBeUndefined();
    expect(payload.content).toBeUndefined();
    expect(payload.budget).toBeUndefined();
  });

  it('sends only valid Smart Targeting IDs while retaining standard fields', () => {
    const base = campaignData();
    const payload = serializeCampaignPayload({
      ...base,
      segment: {
        ...base.segment,
        audienceTargetingMethod: 'smart_targeting',
        selectedTagIds: [2, 2, -1, 3.5, 4],
        audienceGrades: [],
      },
    });

    expect(payload.selected_tag_ids).toEqual([2, 4]);
    expect(payload.level1).toBe('Consumers');
    expect(payload.level2s).toEqual(['Retail']);
    expect(payload.level3s).toEqual(['Online']);
    expect(payload.tags).toEqual(['buyer']);
    expect(payload.audience_grades).toBeUndefined();
  });

  it('serializes disabled link and schedule state with backend clear semantics', () => {
    const base = campaignData();
    const payload = serializeCampaignPayload({
      ...base,
      content: {
        ...base.content,
        insertLink: false,
        link: '',
        scheduleAt: undefined,
        shortLinkDomain: null,
      },
    });

    expect(payload).toHaveProperty('adlink', undefined);
    expect(payload).toHaveProperty('scheduleat', undefined);
    expect(payload.short_link_domain).toBeNull();
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty('adlink');
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty(
      'scheduleat'
    );
  });
});

describe('campaignUtils content validation', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects an invalid link for non-SMS platforms', () => {
    expect(
      validateCampaignContent(
        {
          text: 'Message {YOUR_LINK}',
          insertLink: true,
          link: 'ftp://example.com/file',
          shortLinkDomain: null,
        },
        'bale'
      ).isValid
    ).toBe(false);
  });

  it('rejects unsupported short-link domains', () => {
    expect(
      validateCampaignContent(
        {
          text: 'Message {YOUR_LINK}',
          insertLink: true,
          link: 'https://example.com',
          shortLinkDomain: 'unsupported.example',
        },
        'sms'
      ).isValid
    ).toBe(false);
  });

  it('accepts an explicit schedule at least 10 minutes ahead', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T08:00:00.000Z'));

    const result = validateCampaignContent(
      {
        text: 'Campaign message',
        insertLink: false,
        scheduleAt: '2026-07-27T08:11:00.000Z',
      },
      'sms'
    );

    expect(result).toEqual({ isValid: true, error: null });
  });

  it('rejects immediate delivery outside the Tehran delivery window', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T18:00:00.000Z'));

    const result = validateCampaignContent(
      {
        text: 'Campaign message',
        insertLink: false,
      },
      'sms'
    );

    expect(result).toEqual({
      isValid: false,
      error:
        'Immediate delivery would fall outside 08:00 to 21:00 Tehran time; please schedule the campaign',
    });
  });
});
