import { describe, expect, it } from '@jest/globals';
import { AudienceSpecItem } from '../../../types/campaign';
import { calculateAudienceGradeCapacity, getAudienceSpecItem } from './utils';

const audienceSpecItem: AudienceSpecItem = {
  layer1_category: 'level-1',
  layer2_category: 'level-2',
  layer3_category: 'level-3',
  tags: ['tag-1'],
  available_audience: 326,
  distinct_users: 400,
  black_users: 100,
  white_users: 240,
  pink_users: 60,
  weak_white: 40,
  good_white: 80,
  best_white: 120,
  weak_black: 20,
  good_black: 30,
  best_black: 50,
  weak_pink: 6,
  good_pink: 12,
  best_pink: 30,
  scored_users: 400,
};

describe('audience spec helpers', () => {
  it('reads the selected item from the API response hierarchy', () => {
    expect(
      getAudienceSpecItem(
        {
          'level-1': {
            'level-2': { items: { 'level-3': audienceSpecItem } },
          },
        },
        'level-1',
        'level-2',
        'level-3'
      )
    ).toBe(audienceSpecItem);
  });

  it.each([
    ['A', 130],
    ['B', 84],
    ['C', 42],
  ] as const)(
    'calculates SMS grade %s from white and pink users',
    (grade, expected) => {
      expect(
        calculateAudienceGradeCapacity(audienceSpecItem, grade, 'sms')
      ).toBe(expected);
    }
  );

  it.each([
    ['A', 200],
    ['B', 122],
    ['C', 66],
  ] as const)(
    'calculates non-SMS grade %s from white, pink, and black users',
    (grade, expected) => {
      expect(
        calculateAudienceGradeCapacity(audienceSpecItem, grade, 'rubika')
      ).toBe(expected);
    }
  );
});
