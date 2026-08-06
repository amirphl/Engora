import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import { CampaignData } from '../../../types/campaign';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import { budgetI18n } from './budgetTranslations';
import { isCurrentUsableSmartTargetingCapacity } from '../../../utils/smartTargetingCapacity';

export const useMessageCount = (campaignData: CampaignData) => {
  const [messageCount, setMessageCount] = useState<number | undefined>();
  const [maxMessageCount, setMaxMessageCount] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastApiCall, setLastApiCall] = useState(0);
  const { accessToken } = useAuth();
  const { language } = useLanguage();
  const t = budgetI18n[language as keyof typeof budgetI18n] || budgetI18n.en;
  const { showToast } = useToast();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestSequenceRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string | null>(null);
  const initialCalculatedRef = useRef(false);

  const clearDisplayedCalculation = useCallback(() => {
    setMessageCount(undefined);
    setMaxMessageCount(undefined);
    setError(null);
    setLastApiCall(0);
  }, []);

  const resetMessageCount = useCallback(() => {
    requestSequenceRef.current += 1;
    inFlightKeyRef.current = null;
    completedKeyRef.current = null;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setIsLoading(false);
    setIsQueued(false);
    clearDisplayedCalculation();
  }, [clearDisplayedCalculation]);

  useEffect(() => {
    apiService.setAccessToken(accessToken || null);
    initialCalculatedRef.current = false;
    resetMessageCount();
  }, [accessToken, resetMessageCount]);

  const calculateMessageCount = useCallback(
    async (_currentLineNumber?: string, currentBudget?: number) => {
      if (
        campaignData.segment.audienceTargetingMethod === 'smart_targeting' &&
        campaignData.segment.phase === 'test'
      ) {
        resetMessageCount();
        return;
      }
      const budget =
        currentBudget !== undefined
          ? currentBudget
          : campaignData.budget.totalBudget;
      const isSmartTargetingExecution =
        campaignData.segment.audienceTargetingMethod === 'smart_targeting' &&
        campaignData.segment.phase === 'execution';
      const exactUsableCapacity =
        isSmartTargetingExecution &&
        isCurrentUsableSmartTargetingCapacity(
          campaignData.segment.smartTargetingCapacityCalculation,
          campaignData.segment.selectedTagIds,
          campaignData.segment.smartTargetingScoreClasses
        )
          ? campaignData.segment.smartTargetingCapacityCalculation
              ?.usable_unique_audience_count
          : undefined;
      setIsQueued(false);

      if (!accessToken || !Number.isSafeInteger(budget) || budget <= 0) {
        resetMessageCount();
        return;
      }

      const campaignId =
        typeof campaignData.id === 'number' &&
        Number.isInteger(campaignData.id) &&
        campaignData.id > 0
          ? campaignData.id
          : null;
      if (!campaignId) {
        resetMessageCount();
        const errorMessage = t.campaignIdRequiredForCostCalculation;
        setError(errorMessage);
        showToast('error', errorMessage);
        return;
      }

      const requestKey = `${campaignId}:${budget}`;
      if (
        inFlightKeyRef.current === requestKey ||
        completedKeyRef.current === requestKey
      ) {
        return;
      }

      const sequence = requestSequenceRef.current + 1;
      requestSequenceRef.current = sequence;
      inFlightKeyRef.current = requestKey;
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.calculateCampaignCost({
          campaign_id: campaignId,
          budget,
        });
        if (requestSequenceRef.current !== sequence) return;

        const targetMessages = response.data?.msg_target;
        const maxTargetMessages =
          response.data?.max_msg_target === undefined
            ? undefined
            : response.data.max_msg_target;
        if (
          !response.success ||
          !response.data ||
          typeof targetMessages !== 'number' ||
          !Number.isInteger(targetMessages) ||
          targetMessages < 0 ||
          (maxTargetMessages !== undefined &&
            (typeof maxTargetMessages !== 'number' ||
              !Number.isInteger(maxTargetMessages) ||
              maxTargetMessages < 0))
        ) {
          const errorMessage = response.success
            ? 'Invalid message count response'
            : response.message || 'Failed to calculate message count';
          clearDisplayedCalculation();
          setError(errorMessage);
          showToast('error', errorMessage);
          return;
        }

        if (
          isSmartTargetingExecution &&
          typeof exactUsableCapacity === 'number' &&
          targetMessages > exactUsableCapacity
        ) {
          clearDisplayedCalculation();
          setError(t.requestedAudienceExceedsExactCapacity);
          showToast('error', t.requestedAudienceExceedsExactCapacity);
          return;
        }

        setMessageCount(targetMessages);
        setMaxMessageCount(
          isSmartTargetingExecution && typeof exactUsableCapacity === 'number'
            ? exactUsableCapacity
            : maxTargetMessages
        );
        setLastApiCall(Date.now());
        completedKeyRef.current = requestKey;
      } catch {
        if (requestSequenceRef.current !== sequence) return;
        const errorMessage = 'Network error while calculating message count';
        clearDisplayedCalculation();
        setError(errorMessage);
        showToast('error', errorMessage);
      } finally {
        if (requestSequenceRef.current === sequence) {
          setIsLoading(false);
          inFlightKeyRef.current = null;
        }
      }
    },
    [
      accessToken,
      campaignData.budget.totalBudget,
      campaignData.id,
      campaignData.segment.audienceTargetingMethod,
      campaignData.segment.selectedTagIds,
      campaignData.segment.smartTargetingCapacityCalculation,
      campaignData.segment.smartTargetingScoreClasses,
      campaignData.segment.phase,
      clearDisplayedCalculation,
      resetMessageCount,
      showToast,
      t.campaignIdRequiredForCostCalculation,
      t.requestedAudienceExceedsExactCapacity,
    ]
  );

  const calculateDebounced = useCallback(
    (lineNumber?: string, budget?: number) => {
      requestSequenceRef.current += 1;
      inFlightKeyRef.current = null;
      completedKeyRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearDisplayedCalculation();
      setIsLoading(false);
      setIsQueued(true);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        calculateMessageCount(lineNumber, budget);
      }, 1000);
    },
    [calculateMessageCount, clearDisplayedCalculation]
  );

  useEffect(() => {
    if (initialCalculatedRef.current) return;
    if (!accessToken) return;
    if (
      campaignData.segment.audienceTargetingMethod === 'smart_targeting' &&
      campaignData.segment.phase === 'test'
    ) {
      resetMessageCount();
      return;
    }
    const platform = campaignData.segment.platform || 'sms';
    const hasIdentifier =
      platform === 'sms'
        ? Boolean(campaignData.content.lineNumber)
        : Boolean(campaignData.content.platformSettingsId);
    if (!hasIdentifier || campaignData.budget.totalBudget <= 0) return;

    initialCalculatedRef.current = true;
    void calculateMessageCount(
      campaignData.content.lineNumber,
      campaignData.budget.totalBudget
    );
  }, [
    accessToken,
    calculateMessageCount,
    campaignData.budget.totalBudget,
    campaignData.content.lineNumber,
    campaignData.content.platformSettingsId,
    campaignData.segment.platform,
    campaignData.segment.audienceTargetingMethod,
    campaignData.segment.phase,
    resetMessageCount,
  ]);

  useEffect(
    () => () => {
      requestSequenceRef.current += 1;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  return {
    messageCount,
    maxMessageCount,
    isLoading,
    isQueued,
    error,
    lastApiCall,
    calculateMessageCount,
    calculateDebounced,
    resetMessageCount,
  };
};
