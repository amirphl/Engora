import { useState, useEffect } from 'react';
import {
  LevelSelectionState,
  loadLevelSelection,
  createEmptyLevelSelection,
  LEVEL_SELECTION_KEY,
} from '../types/segment';
import { isUuidV4, isValidCampaignStringArray } from '../utils/campaignUtils';

/**
 * Custom hook to access the current level selection state from localStorage
 * This provides a reactive way to read the level selection data
 */
export const useLevelSelection = () => {
  const [selection, setSelection] = useState<LevelSelectionState>(() => {
    return loadLevelSelection() || createEmptyLevelSelection();
  });

  const isTargetAudienceExcelFileMode =
    selection.audienceTargetingMethod === 'excel';
  const isSmartTargetingMode =
    selection.audienceTargetingMethod === 'smart_targeting';
  const excelFileUploaded = isUuidV4(selection.targetAudienceExcelFileUuid);
  const hasLevelSelections =
    isValidCampaignStringArray(selection.level1s, { required: true }) &&
    isValidCampaignStringArray(selection.level2s, { required: true }) &&
    isValidCampaignStringArray(selection.level3s, { required: true }) &&
    isValidCampaignStringArray(selection.tags, { required: true });
  const hasSmartTargetingSelection =
    selection.selectedTagIds.length > 0 &&
    selection.selectedTagIds.length <= 10000 &&
    selection.selectedTagIds.every(
      tagId => Number.isInteger(tagId) && tagId > 0
    ) &&
    new Set(selection.selectedTagIds).size ===
      selection.selectedTagIds.length &&
    selection.smartTargetingSelectedRawCapacity >= 500;

  useEffect(() => {
    // Listen for storage changes (e.g., from other tabs or components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LEVEL_SELECTION_KEY) {
        const newSelection =
          loadLevelSelection() || createEmptyLevelSelection();
        setSelection(newSelection);
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleLevelUpdate = () => {
      const newSelection = loadLevelSelection() || createEmptyLevelSelection();
      setSelection(newSelection);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('levelSelectionUpdated', handleLevelUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('levelSelectionUpdated', handleLevelUpdate);
    };
  }, []);

  return {
    selection,
    // Convenience accessors
    campaignTitle: selection.campaignTitle,
    level1s: selection.level1s,
    level2s: selection.level2s,
    level3s: selection.level3s,
    targetAudienceExcelFileUuid: selection.targetAudienceExcelFileUuid,
    audienceTargetingMethod: selection.audienceTargetingMethod,
    selectedTagIds: selection.selectedTagIds,
    smartTargetingSelectedRawCapacity:
      selection.smartTargetingSelectedRawCapacity,
    smartTargetingScoreClasses: selection.smartTargetingScoreClasses,
    metadata: selection.metadata,
    tags: selection.tags,
    count: selection.count,
    lastUpdated: selection.lastUpdated,
    isTargetAudienceExcelFileMode,
    isSmartTargetingMode,
    excelFileUploaded,
    hasLevelSelections,
    hasSmartTargetingSelection,
    // Checks
    hasSelections:
      (selection.audienceTargetingMethod === 'standard' &&
        hasLevelSelections) ||
      (isTargetAudienceExcelFileMode && excelFileUploaded) ||
      (isSmartTargetingMode && hasSmartTargetingSelection),
    isEmpty:
      selection.level1s.length === 0 &&
      selection.level2s.length === 0 &&
      selection.level3s.length === 0 &&
      !excelFileUploaded &&
      !hasSmartTargetingSelection,
  };
};
