// Level Selection State
// This represents the complete selection state for the level component
import type { AudienceGrade, AudienceTargetingMethod } from './campaign';

export interface LevelMetadata {
  [key: string]: any;
}

export interface LevelSelectionState {
  // Campaign title
  campaignTitle: string;

  // Selected level 1 (currently single selection, but stored as array for future flexibility)
  level1s: string[];

  // Selected level 2s (multiple selection)
  level2s: string[];

  // Selected level 3s (multiple selection)
  level3s: string[];

  // Optional target audience Excel file associated with the selection
  targetAudienceExcelFileUuid: string | null;

  audienceTargetingMethod: AudienceTargetingMethod;
  selectedTagIds: number[];
  smartTargetingSelectedRawCapacity: number;
  smartTargetingScoreClasses: AudienceGrade[];

  // Metadata from selected items
  metadata: Record<string, LevelMetadata>;

  // Union of all tags from selected level 3 items
  tags: string[];

  // Total count/capacity from selected level 3 items
  count: number;

  // Timestamp of last update
  lastUpdated: string;
}

export const createEmptyLevelSelection = (): LevelSelectionState => ({
  campaignTitle: '',
  level1s: [],
  level2s: [],
  level3s: [],
  targetAudienceExcelFileUuid: null,
  audienceTargetingMethod: 'standard',
  selectedTagIds: [],
  smartTargetingSelectedRawCapacity: 0,
  smartTargetingScoreClasses: [],
  metadata: {},
  tags: [],
  count: 0,
  lastUpdated: new Date().toISOString(),
});

// LocalStorage key for level selection
export const LEVEL_SELECTION_KEY = 'campaign_level_selection';

// Helper functions for localStorage operations
export const saveLevelSelection = (selection: LevelSelectionState): void => {
  try {
    const nextSelection = {
      ...selection,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(LEVEL_SELECTION_KEY, JSON.stringify(nextSelection));

    // Dispatch custom event for same-tab reactivity
    window.dispatchEvent(new Event('levelSelectionUpdated'));
  } catch (error) {
    console.error('❌ [LevelSelection] Failed to save:', error);
  }
};

export const loadLevelSelection = (): LevelSelectionState | null => {
  try {
    const stored = localStorage.getItem(LEVEL_SELECTION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LevelSelectionState>;
      const defaults = createEmptyLevelSelection();
      const normalizeStrings = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.filter(
              (item): item is string =>
                typeof item === 'string' && item.trim().length > 0
            )
          : [];
      const selectedTagIds = Array.isArray(parsed.selectedTagIds)
        ? Array.from(
            new Set(
              parsed.selectedTagIds
                .map(Number)
                .filter(item => Number.isInteger(item) && item > 0)
            )
          )
        : [];
      const targetingMethod =
        parsed.audienceTargetingMethod === 'smart_targeting' ||
        parsed.audienceTargetingMethod === 'excel' ||
        parsed.audienceTargetingMethod === 'standard'
          ? parsed.audienceTargetingMethod
          : selectedTagIds.length > 0
            ? 'smart_targeting'
            : typeof parsed.targetAudienceExcelFileUuid === 'string'
              ? 'excel'
              : 'standard';
      const smartTargetingScoreClasses = Array.isArray(
        parsed.smartTargetingScoreClasses
      )
        ? Array.from(
            new Set(
              parsed.smartTargetingScoreClasses.filter(
                (item): item is AudienceGrade =>
                  item === 'A' || item === 'B' || item === 'C'
              )
            )
          )
        : [];

      return {
        ...defaults,
        campaignTitle:
          typeof parsed.campaignTitle === 'string'
            ? parsed.campaignTitle
            : defaults.campaignTitle,
        level1s: normalizeStrings(parsed.level1s),
        level2s: normalizeStrings(parsed.level2s),
        level3s: normalizeStrings(parsed.level3s),
        targetAudienceExcelFileUuid:
          typeof parsed.targetAudienceExcelFileUuid === 'string'
            ? parsed.targetAudienceExcelFileUuid
            : null,
        audienceTargetingMethod: targetingMethod,
        selectedTagIds,
        smartTargetingSelectedRawCapacity:
          typeof parsed.smartTargetingSelectedRawCapacity === 'number' &&
          Number.isFinite(parsed.smartTargetingSelectedRawCapacity)
            ? Math.max(0, parsed.smartTargetingSelectedRawCapacity)
            : 0,
        smartTargetingScoreClasses,
        metadata:
          parsed.metadata &&
          typeof parsed.metadata === 'object' &&
          !Array.isArray(parsed.metadata)
            ? parsed.metadata
            : {},
        tags: normalizeStrings(parsed.tags),
        count:
          typeof parsed.count === 'number' && Number.isFinite(parsed.count)
            ? Math.max(0, parsed.count)
            : 0,
        lastUpdated:
          typeof parsed.lastUpdated === 'string'
            ? parsed.lastUpdated
            : defaults.lastUpdated,
      };
    }
  } catch (error) {
    console.error('❌ [LevelSelection] Failed to load:', error);
  }
  return null;
};

export const clearLevelSelection = (): void => {
  try {
    localStorage.removeItem(LEVEL_SELECTION_KEY);
  } catch (error) {
    console.error('❌ [LevelSelection] Failed to clear:', error);
  }
};
