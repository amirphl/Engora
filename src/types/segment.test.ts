import { beforeEach, describe, expect, it } from '@jest/globals';
import { LEVEL_SELECTION_KEY, loadLevelSelection } from './segment';

describe('loadLevelSelection legacy targeting migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('infers Excel targeting from a legacy uploaded-file UUID', () => {
    localStorage.setItem(
      LEVEL_SELECTION_KEY,
      JSON.stringify({
        targetAudienceExcelFileUuid: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
      })
    );

    expect(loadLevelSelection()).toMatchObject({
      audienceTargetingMethod: 'excel',
      targetAudienceExcelFileUuid: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
    });
  });

  it('infers Smart Targeting from legacy selected tag IDs', () => {
    localStorage.setItem(
      LEVEL_SELECTION_KEY,
      JSON.stringify({
        selectedTagIds: [5, '5', 9, -1],
        smartTargetingSelectedRawCapacity: 700,
      })
    );

    expect(loadLevelSelection()).toMatchObject({
      audienceTargetingMethod: 'smart_targeting',
      selectedTagIds: [5, 9],
      smartTargetingSelectedRawCapacity: 700,
    });
  });
});
