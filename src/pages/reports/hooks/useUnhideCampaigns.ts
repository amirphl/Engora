import { useCallback, useRef, useState } from 'react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import { useToast } from '../../../hooks/useToast';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import { ReportsCopy } from '../translations';

interface UseUnhideCampaignsOptions {
  copy: ReportsCopy;
  onUnhidden?: (unhiddenCampaignIds: number[]) => void;
}

export const useUnhideCampaigns = ({
  copy,
  onUnhidden,
}: UseUnhideCampaignsOptions) => {
  const { accessToken } = useAuth();
  const { language } = useLanguage();
  const { showError, showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const unhideCampaigns = useCallback(
    async (campaignIds: number[]) => {
      if (isSubmittingRef.current) return false;
      if (campaignIds.length === 0) {
        showError(copy.bulkUnhide.errors.emptySelection);
        return false;
      }

      if (!accessToken) {
        showError(copy.bulkUnhide.errors.unauthorized);
        return false;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        apiService.setAccessToken(accessToken);
        const response = await apiService.unhideCampaigns({
          campaign_ids: campaignIds,
        });

        if (!response.success) {
          const errorCode = response.error?.code;
          if (errorCode === 'CAMPAIGN_NOT_FOUND') {
            showError(copy.bulkUnhide.errors.notFound);
            return false;
          }
          showError(
            getApiErrorMessage(
              response,
              language === 'fa' ? 'fa' : 'en',
              copy.bulkUnhide.errors.fallback
            )
          );
          return false;
        }

        showSuccess(
          response.data?.updated_count
            ? copy.bulkUnhide.success(response.data.updated_count)
            : response.message || copy.bulkUnhide.success(campaignIds.length)
        );
        onUnhidden?.(campaignIds);
        return true;
      } catch {
        showError(copy.bulkUnhide.errors.fallback);
        return false;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [accessToken, copy.bulkUnhide, language, onUnhidden, showError, showSuccess]
  );

  return {
    unhideCampaigns,
    isSubmitting,
  };
};
