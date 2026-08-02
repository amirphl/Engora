import {
  CampaignData,
  CampaignSegment,
  SmartTargetingTestSamplingPreviewResponse,
  SmartTargetingTestSamplingTagResult,
} from '../types/campaign';
import { getEffectiveScoreClassKey } from './smartTargetingCapacity';

export const DEFAULT_SMART_TARGETING_TEST_SAMPLE_SIZE = 10_000;

const normalizePositiveSafeInteger = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
};

const normalizeNonNegativeSafeInteger = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
};

export const normalizeOrderedTagIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const normalized: number[] = [];
  const seen = new Set<number>();

  value.forEach(item => {
    const tagId = normalizePositiveSafeInteger(item);
    if (tagId === null || seen.has(tagId)) return;
    seen.add(tagId);
    normalized.push(tagId);
  });

  return normalized;
};

export const areSameOrderedTagIds = (
  left: unknown,
  right: unknown
): boolean => {
  const normalizedLeft = normalizeOrderedTagIds(left);
  const normalizedRight = normalizeOrderedTagIds(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((tagId, index) => tagId === normalizedRight[index])
  );
};

const normalizeTagResult = (
  value: unknown
): SmartTargetingTestSamplingTagResult | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const tagId = normalizePositiveSafeInteger(candidate.tag_id);
  const selectionOrder = normalizeNonNegativeSafeInteger(
    candidate.selection_order
  );
  const availableCount = normalizeNonNegativeSafeInteger(
    candidate.available_count
  );

  if (
    tagId === null ||
    selectionOrder === null ||
    availableCount === null ||
    typeof candidate.satisfied !== 'boolean'
  ) {
    return null;
  }

  return {
    tag_id: tagId,
    selection_order: selectionOrder,
    satisfied: candidate.satisfied,
    available_count: availableCount,
  };
};

export const normalizeSmartTargetingTestPreview = (
  value: unknown
): SmartTargetingTestSamplingPreviewResponse | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const sampleSizePerTag = normalizePositiveSafeInteger(
    candidate.sample_size_per_tag
  );
  const tagSamplingOrder = normalizeOrderedTagIds(candidate.tag_sampling_order);
  const satisfiedTagCount = normalizeNonNegativeSafeInteger(
    candidate.satisfied_tag_count
  );
  const effectiveAudienceCount = normalizeNonNegativeSafeInteger(
    candidate.effective_audience_count
  );
  const campaignCost = normalizeNonNegativeSafeInteger(candidate.campaign_cost);
  const satisfiedTags = Array.isArray(candidate.satisfied_tags)
    ? candidate.satisfied_tags.map(normalizeTagResult)
    : [];
  const unsatisfiedTags = Array.isArray(candidate.unsatisfied_tags)
    ? candidate.unsatisfied_tags.map(normalizeTagResult)
    : [];

  if (
    sampleSizePerTag === null ||
    tagSamplingOrder.length === 0 ||
    satisfiedTagCount === null ||
    effectiveAudienceCount === null ||
    campaignCost === null ||
    !Array.isArray(candidate.tag_sampling_order) ||
    tagSamplingOrder.length !== candidate.tag_sampling_order.length ||
    !Array.isArray(candidate.satisfied_tags) ||
    !Array.isArray(candidate.unsatisfied_tags) ||
    satisfiedTags.some(item => item === null) ||
    unsatisfiedTags.some(item => item === null)
  ) {
    return null;
  }

  const normalizedSatisfiedTags =
    satisfiedTags as SmartTargetingTestSamplingTagResult[];
  const normalizedUnsatisfiedTags =
    unsatisfiedTags as SmartTargetingTestSamplingTagResult[];
  const resultTagIds = [
    ...normalizedSatisfiedTags,
    ...normalizedUnsatisfiedTags,
  ].map(item => item.tag_id);
  const allTagResults = [
    ...normalizedSatisfiedTags,
    ...normalizedUnsatisfiedTags,
  ];
  const selectionOrders = allTagResults.map(item => item.selection_order);
  const orderedTagResults = [...allTagResults].sort(
    (left, right) => left.selection_order - right.selection_order
  );
  const firstSelectionOrder = orderedTagResults[0]?.selection_order;
  const hasContiguousSelectionOrder =
    (firstSelectionOrder === 0 || firstSelectionOrder === 1) &&
    orderedTagResults.every(
      (item, index) => item.selection_order === firstSelectionOrder + index
    );
  const expectedEffectiveCount = satisfiedTagCount * sampleSizePerTag;

  if (
    !Number.isSafeInteger(expectedEffectiveCount) ||
    satisfiedTagCount !== normalizedSatisfiedTags.length ||
    effectiveAudienceCount !== expectedEffectiveCount ||
    normalizedSatisfiedTags.some(item => !item.satisfied) ||
    normalizedUnsatisfiedTags.some(item => item.satisfied) ||
    resultTagIds.length !== tagSamplingOrder.length ||
    new Set(resultTagIds).size !== resultTagIds.length ||
    resultTagIds.some(tagId => !tagSamplingOrder.includes(tagId)) ||
    new Set(selectionOrders).size !== selectionOrders.length ||
    !hasContiguousSelectionOrder ||
    orderedTagResults.some(
      (item, index) => tagSamplingOrder[index] !== item.tag_id
    ) ||
    normalizedSatisfiedTags.some(
      item => item.available_count < sampleSizePerTag
    ) ||
    normalizedUnsatisfiedTags.some(
      item => item.available_count >= sampleSizePerTag
    )
  ) {
    return null;
  }

  return {
    sample_size_per_tag: sampleSizePerTag,
    tag_sampling_order: tagSamplingOrder,
    satisfied_tags: normalizedSatisfiedTags,
    unsatisfied_tags: normalizedUnsatisfiedTags,
    satisfied_tag_count: satisfiedTagCount,
    effective_audience_count: effectiveAudienceCount,
    campaign_cost: campaignCost,
  };
};

export const getSmartTargetingTestPreviewInputKey = (
  campaignUuid: string | undefined,
  segment: Partial<CampaignSegment>
): string => {
  const orderedTagIds = normalizeOrderedTagIds(segment.selectedTagIds);
  const sampleSize = normalizePositiveSafeInteger(segment.sampleSizePerTag);
  return [
    campaignUuid?.trim() || 'unsaved',
    segment.bundleId ?? 'no-bundle',
    segment.audienceTargetingMethod ?? 'standard',
    segment.phase ?? 'execution',
    segment.platform ?? 'sms',
    segment.smartTargetingSortBy || 'default',
    segment.smartTargetingSortBy
      ? segment.smartTargetingSortDirection || 'desc'
      : 'default',
    orderedTagIds.join(','),
    sampleSize ?? 'invalid-sample',
    getEffectiveScoreClassKey(segment.smartTargetingScoreClasses),
  ].join('|');
};

export const isCurrentSmartTargetingTestPreview = (
  campaignData: CampaignData
): boolean => {
  const { segment } = campaignData;
  const preview = normalizeSmartTargetingTestPreview(
    segment.smartTargetingTestPreview
  );
  if (
    segment.audienceTargetingMethod !== 'smart_targeting' ||
    segment.phase !== 'test' ||
    !preview ||
    segment.smartTargetingTestPreviewStale === true ||
    !segment.smartTargetingTestPreviewInputKey
  ) {
    return false;
  }

  return (
    segment.smartTargetingTestPreviewInputKey ===
      getSmartTargetingTestPreviewInputKey(campaignData.uuid, segment) &&
    preview.sample_size_per_tag === segment.sampleSizePerTag &&
    areSameOrderedTagIds(preview.tag_sampling_order, segment.selectedTagIds)
  );
};

export const hasUsableSmartTargetingTestPreview = (
  campaignData: CampaignData
): boolean =>
  isCurrentSmartTargetingTestPreview(campaignData) &&
  (campaignData.segment.smartTargetingTestPreview?.effective_audience_count ??
    0) > 0;
