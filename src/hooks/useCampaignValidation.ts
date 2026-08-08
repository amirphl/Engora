import { useMemo } from 'react';
import { CampaignData } from '../types/campaign';
import {
  isUuidV4,
  isValidCampaignStringArray,
  MAX_CAMPAIGN_STRING_LENGTH,
  validateCampaignContent,
} from '../utils/campaignUtils';
import { isCurrentUsableSmartTargetingCapacity } from '../utils/smartTargetingCapacity';

export const useCampaignValidation = (
  campaignData: CampaignData,
  currentStep: number,
  isAgencyAccount?: boolean
) => {
  const accountType =
    typeof window !== 'undefined' ? localStorage.getItem('account_type') : null;
  const isAgency = isAgencyAccount ?? accountType === 'marketing_agency';
  const MIN_BUDGET = 100000;
  const MAX_BUDGET = 160000000;
  // Precompute step validation booleans with memoization
  const step1Valid = useMemo(() => {
    const { segment } = campaignData;
    const audienceTargetingMethod =
      segment.audienceTargetingMethod ??
      (segment.targetAudienceExcelFileUuid != null ? 'excel' : 'standard');
    const isTargetAudienceExcelFileMode = audienceTargetingMethod === 'excel';
    const isSmartTargetingMode = audienceTargetingMethod === 'smart_targeting';
    const excelFileUploaded = isUuidV4(segment.targetAudienceExcelFileUuid);
    const hasSmartTargetingSelection =
      (segment.selectedTagIds?.length ?? 0) > 0 &&
      (segment.selectedTagIds?.length ?? 0) <= 10000 &&
      segment.selectedTagIds?.every(
        tagId => Number.isInteger(tagId) && tagId > 0
      ) &&
      new Set(segment.selectedTagIds ?? []).size ===
        (segment.selectedTagIds?.length ?? 0) &&
      (segment.smartTargetingSelectedRawCapacity ?? 0) >= 500;
    const exactCapacityRequirementSatisfied =
      segment.smartTargetingExactCapacityRequired !== true ||
      (segment.smartTargetingSelectionDirty !== true &&
        isCurrentUsableSmartTargetingCapacity(
          segment.smartTargetingCapacityCalculation,
          segment.selectedTagIds,
          segment.smartTargetingScoreClasses
        ));
    const audienceGradesValid =
      (segment.audienceGrades?.length ?? 0) <= 3 &&
      (segment.audienceGrades ?? []).every(
        grade => grade === 'A' || grade === 'B' || grade === 'C'
      ) &&
      new Set(segment.audienceGrades ?? []).size ===
        (segment.audienceGrades?.length ?? 0);
    const hasValidLevelSelection =
      !!segment.level1?.trim() &&
      segment.level1.length <= MAX_CAMPAIGN_STRING_LENGTH &&
      isValidCampaignStringArray(segment.level2s, { required: true }) &&
      isValidCampaignStringArray(segment.level3s, { required: true }) &&
      isValidCampaignStringArray(segment.tags, { required: true }) &&
      (segment.audienceGrades?.length ?? 0) > 0 &&
      audienceGradesValid;
    const csvCapacityBlocked =
      !isTargetAudienceExcelFileMode &&
      !isSmartTargetingMode &&
      hasValidLevelSelection &&
      (segment.capacity ?? 0) < 500;
    return !!(
      segment.campaignTitle.trim() &&
      segment.campaignTitle.length <= MAX_CAMPAIGN_STRING_LENGTH &&
      segment.platform &&
      (!isTargetAudienceExcelFileMode || excelFileUploaded) &&
      (!isSmartTargetingMode || hasSmartTargetingSelection) &&
      (!isSmartTargetingMode || exactCapacityRequirementSatisfied) &&
      (isTargetAudienceExcelFileMode ||
        isSmartTargetingMode ||
        hasValidLevelSelection) &&
      (isTargetAudienceExcelFileMode ||
        isSmartTargetingMode ||
        segment.capacityTooLow !== true) &&
      audienceGradesValid &&
      !csvCapacityBlocked &&
      (!isAgency ||
        (segment.jobCategory?.trim() &&
          segment.jobCategory.length <= MAX_CAMPAIGN_STRING_LENGTH &&
          segment.job?.trim() &&
          segment.job.length <= MAX_CAMPAIGN_STRING_LENGTH)) &&
      (!segment.sex ||
        (segment.sex.trim().length > 0 &&
          segment.sex.length <= MAX_CAMPAIGN_STRING_LENGTH)) &&
      (segment.city === undefined ||
        isValidCampaignStringArray(segment.city)) &&
      Number.isInteger(segment.bundleId) &&
      (segment.bundleId ?? 0) > 0 &&
      (segment.phase === 'test' || segment.phase === 'execution')
    );
  }, [campaignData, isAgency]);

  const step2Valid = useMemo(() => {
    const { content, segment: level } = campaignData;
    const contentValid = validateCampaignContent(
      content,
      level.platform
    ).isValid;
    if (level.platform === 'sms') {
      return contentValid && !!content.lineNumber;
    }
    return contentValid && !!content.platformSettingsId;
  }, [campaignData]);

  const step3Valid = useMemo(() => {
    const { budget, content, segment: level } = campaignData;
    return (
      (level.platform === 'sms'
        ? !!content.lineNumber
        : !!content.platformSettingsId) &&
      Number.isInteger(budget.totalBudget) &&
      budget.totalBudget >= MIN_BUDGET &&
      budget.totalBudget <= MAX_BUDGET
    );
  }, [campaignData]);

  const step4Valid = useMemo(() => {
    const { payment } = campaignData;
    return (
      payment.hasEnoughBalance === true &&
      typeof payment.finalCost === 'number' &&
      Number.isFinite(payment.finalCost) &&
      payment.finalCost >= 0
    );
  }, [campaignData]);

  const stepValidation = useMemo(
    () => ({
      step1: (): boolean => step1Valid,
      step2: (): boolean => step2Valid,
      step3: (): boolean => step3Valid,
      step4: (): boolean => step4Valid,
    }),
    [step1Valid, step2Valid, step3Valid, step4Valid]
  );

  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1:
        return stepValidation.step1();
      case 2:
        return stepValidation.step2();
      case 3:
        return stepValidation.step3();
      case 4:
        return stepValidation.step4();
      default:
        return false;
    }
  };

  const isStepAccessible = (step: number): boolean => {
    if (step <= 1) return true;
    for (let previousStep = 1; previousStep < step; previousStep += 1) {
      if (!isStepCompleted(previousStep)) return false;
    }
    return true;
  };

  const canProceedToNextStep = (currentStep: number): boolean => {
    for (let step = 1; step <= currentStep; step += 1) {
      if (!isStepCompleted(step)) return false;
    }
    return true;
  };

  const canFinishCampaign = (): boolean => {
    return (
      currentStep === 4 && [1, 2, 3, 4].every(step => isStepCompleted(step))
    );
  };

  const getStepErrors = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!step1Valid) {
          const audienceTargetingMethod =
            campaignData.segment.audienceTargetingMethod ??
            (campaignData.segment.targetAudienceExcelFileUuid != null
              ? 'excel'
              : 'standard');
          const isSmartTargetingMode =
            audienceTargetingMethod === 'smart_targeting';
          const isTargetAudienceExcelFileMode =
            audienceTargetingMethod === 'excel';

          errors.push('Please configure campaign title and audience criteria');
          if (!campaignData.segment.campaignTitle) {
            errors.push('Please enter a campaign title');
          } else if (campaignData.segment.campaignTitle.length > 255) {
            errors.push('Campaign title must be at most 255 characters');
          }
          if (!campaignData.segment.platform) {
            errors.push('Please select a platform');
          }
          if (
            !isTargetAudienceExcelFileMode &&
            !isSmartTargetingMode &&
            (!campaignData.segment.level1 ||
              !campaignData.segment.level2s ||
              campaignData.segment.level2s.length === 0 ||
              !campaignData.segment.level3s ||
              campaignData.segment.level3s.length === 0 ||
              !campaignData.segment.tags ||
              campaignData.segment.tags.length === 0)
          ) {
            errors.push('Please select audience levels');
          }
          if (
            !isTargetAudienceExcelFileMode &&
            !isSmartTargetingMode &&
            (campaignData.segment.audienceGrades?.length ?? 0) === 0
          ) {
            errors.push('Please select at least one audience grade');
          }
          if (
            !isTargetAudienceExcelFileMode &&
            !isSmartTargetingMode &&
            campaignData.segment.capacityTooLow === true
          ) {
            errors.push('Audience capacity is too low');
          }
          if (
            !isTargetAudienceExcelFileMode &&
            !isSmartTargetingMode &&
            campaignData.segment.level3s.length > 0 &&
            (campaignData.segment.capacity ?? 0) < 500
          ) {
            errors.push('Audience capacity is too low');
          }
          if (
            isSmartTargetingMode &&
            (campaignData.segment.selectedTagIds?.length ?? 0) === 0
          ) {
            errors.push(
              'At least one tag must be selected for Smart Targeting'
            );
          } else if (
            isSmartTargetingMode &&
            (campaignData.segment.selectedTagIds?.length ?? 0) > 10000
          ) {
            errors.push('Smart Targeting supports at most 10,000 tags');
          } else if (
            isSmartTargetingMode &&
            (!(campaignData.segment.selectedTagIds ?? []).every(
              tagId => Number.isInteger(tagId) && tagId > 0
            ) ||
              new Set(campaignData.segment.selectedTagIds ?? []).size !==
                (campaignData.segment.selectedTagIds?.length ?? 0))
          ) {
            errors.push('Smart Targeting selection contains invalid tag IDs');
          } else if (
            isSmartTargetingMode &&
            (campaignData.segment.smartTargetingSelectedRawCapacity ?? 0) < 500
          ) {
            errors.push('Audience capacity is too low');
          }
          if (
            isSmartTargetingMode &&
            campaignData.segment.smartTargetingExactCapacityRequired === true &&
            !isCurrentUsableSmartTargetingCapacity(
              campaignData.segment.smartTargetingCapacityCalculation,
              campaignData.segment.selectedTagIds,
              campaignData.segment.smartTargetingScoreClasses
            )
          ) {
            errors.push(
              'Calculate the current exact Smart Targeting capacity before continuing'
            );
          }
          if (isAgency && !campaignData.segment.jobCategory) {
            errors.push('Please select a category');
          }
          if (isAgency && !campaignData.segment.job) {
            errors.push('Please select a job');
          }
          if (
            isTargetAudienceExcelFileMode &&
            !isUuidV4(campaignData.segment.targetAudienceExcelFileUuid)
          ) {
            errors.push('Please upload a valid Excel audience file');
          }
          if (!campaignData.segment.bundleId) {
            errors.push('Please select a bundle');
          }
          if (!campaignData.segment.phase) {
            errors.push('Please select a sending phase');
          }
        }
        break;
      case 2:
        if (!step2Valid) {
          const { content } = campaignData;
          const validation = validateCampaignContent(
            content,
            campaignData.segment.platform
          );
          if (!validation.isValid && validation.error) {
            errors.push(validation.error);
          }
          if (campaignData.segment.platform === 'sms') {
            if (!campaignData.content.lineNumber) {
              errors.push('Please select a line number');
            }
          } else if (!campaignData.content.platformSettingsId) {
            errors.push('Please select an active service');
          }
        }
        break;
      case 3:
        if (!step3Valid) {
          if (campaignData.segment.platform === 'sms') {
            if (!campaignData.content.lineNumber) {
              errors.push('Please select a line number');
            }
          } else {
            if (!campaignData.content.platformSettingsId) {
              errors.push('Please select an active service');
            }
          }
          if (!Number.isInteger(campaignData.budget.totalBudget)) {
            errors.push('Total budget must be a whole number');
          } else if (campaignData.budget.totalBudget < MIN_BUDGET) {
            errors.push('Please set a total budget of at least 100,000');
          } else if (campaignData.budget.totalBudget > MAX_BUDGET) {
            errors.push('Total budget exceeds the maximum allowed');
          }
        }
        break;
      case 4:
        if (
          typeof campaignData.payment.finalCost !== 'number' ||
          !Number.isFinite(campaignData.payment.finalCost) ||
          campaignData.payment.finalCost < 0
        ) {
          errors.push('Campaign cost must be calculated before finishing');
        } else if (campaignData.payment.hasEnoughBalance !== true) {
          errors.push('Insufficient wallet balance for campaign');
        }
        break;
    }

    return errors;
  };

  return {
    stepValidation,
    isStepCompleted,
    isStepAccessible,
    canProceedToNextStep,
    canFinishCampaign,
    getStepErrors,
  };
};
