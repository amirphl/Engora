import { useCallback, useRef, useState } from 'react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import { useToast } from '../../../hooks/useToast';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import { ReportsCopy } from '../translations';

interface UseHideCampaignsOptions {
  copy: ReportsCopy;
  onHidden?: (hiddenCampaignIds: number[]) => void;
}

export const useHideCampaigns = ({
  copy,
  onHidden,
}: UseHideCampaignsOptions) => {
  const { accessToken } = useAuth();
  const { language } = useLanguage();
  const { showError, showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const hideCampaigns = useCallback(
    async (campaignIds: number[]) => {
      if (isSubmittingRef.current) return false;
      if (campaignIds.length === 0) {
        showError(copy.bulkHide.errors.emptySelection);
        return false;
      }

      if (!accessToken) {
        showError(copy.bulkHide.errors.unauthorized);
        return false;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        apiService.setAccessToken(accessToken);
        const response = await apiService.hideCampaigns({
          campaign_ids: campaignIds,
        });

        if (!response.success) {
          showError(
            getApiErrorMessage(
              response,
              language === 'fa' ? 'fa' : 'en',
              copy.bulkHide.errors.fallback
            )
          );
          return false;
        }

        showSuccess(
          response.data?.updated_count
            ? copy.bulkHide.success(response.data.updated_count)
            : response.message || copy.bulkHide.success(campaignIds.length)
        );
        onHidden?.(campaignIds);
        return true;
      } catch {
        showError(copy.bulkHide.errors.fallback);
        return false;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [accessToken, copy.bulkHide, language, onHidden, showError, showSuccess]
  );

  return {
    hideCampaigns,
    isSubmitting,
  };
};
