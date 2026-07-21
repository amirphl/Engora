import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import { apiService } from '../../../services/api';
import { CampaignData } from '../../../types/campaign';
import { PlatformSettingsItem } from '../../../types/platformSettings';
import { handleCampaignFlowError } from '../common/CampaignFlowErrorHandler';
import { budgetI18n } from './budgetTranslations';
import {
  getTestMessageChecks,
  getTestMessageValidationErrorCode,
  TestMessageValidationErrorCode,
} from './testMessageValidation';

interface UseCampaignTestMessageParams {
  campaignData: CampaignData;
  activePlatformSettings: PlatformSettingsItem[];
  accessToken: string | null;
  language: string;
  targetPhoneNumber: string;
}

const isValidLocalTargetPhoneNumber = (value: string) => /^9\d{9}$/.test(value);

const getValidationMessage = (
  errorCode: TestMessageValidationErrorCode,
  language: 'en' | 'fa'
) => {
  const copy = budgetI18n[language];
  switch (errorCode) {
    case 'MISSING_CAMPAIGN_UUID':
      return copy.testMessageMissingCampaign;
    case 'MISSING_CONTENT':
      return copy.testMessageContentRequired;
    case 'MISSING_ADLINK':
      return copy.testMessageAdlinkRequired;
    case 'MISSING_PLATFORM_SETTINGS':
      return copy.testMessagePlatformSettingsRequired;
    case 'MISSING_LINE_NUMBER':
      return copy.testMessageLineNumberRequired;
    default:
      return copy.testMessageUnknownError;
  }
};

export const useCampaignTestMessage = ({
  campaignData,
  activePlatformSettings,
  accessToken,
  language,
  targetPhoneNumber,
}: UseCampaignTestMessageParams) => {
  const { showError, showSuccess } = useToast();
  const [isSending, setIsSending] = useState(false);
  const inFlightRef = useRef(false);
  const accessTokenRef = useRef(accessToken);
  const normalizedLanguage: 'en' | 'fa' = language === 'fa' ? 'fa' : 'en';
  const copy = budgetI18n[normalizedLanguage];

  const checks = useMemo(
    () => getTestMessageChecks(campaignData, activePlatformSettings),
    [campaignData, activePlatformSettings]
  );
  const validationErrorCode = useMemo(
    () => getTestMessageValidationErrorCode(checks),
    [checks]
  );
  const isReady = validationErrorCode === null;

  useEffect(() => {
    accessTokenRef.current = accessToken;
    inFlightRef.current = false;
    setIsSending(false);
  }, [accessToken]);

  const sendTestMessage = useCallback(async () => {
    if (inFlightRef.current) return;

    if (!accessToken) {
      showError(copy.testMessageAuthenticationRequired);
      return;
    }

    if (validationErrorCode) {
      showError(getValidationMessage(validationErrorCode, normalizedLanguage));
      return;
    }

    const normalizedTargetPhoneNumber = targetPhoneNumber.trim();
    if (!isValidLocalTargetPhoneNumber(normalizedTargetPhoneNumber)) {
      showError(copy.testMessageTargetPhoneInvalid);
      return;
    }

    inFlightRef.current = true;
    setIsSending(true);

    try {
      const requestToken = accessToken;
      apiService.setAccessToken(accessToken);
      const response = await apiService.sendCampaignTestMessage(
        campaignData.uuid,
        {
          target_phone_number: `+98${normalizedTargetPhoneNumber}`,
        }
      );
      if (accessTokenRef.current !== requestToken) return;

      if (response.success) {
        showSuccess(copy.testMessageSuccess);
        return;
      }

      showError(handleCampaignFlowError(response, normalizedLanguage));
    } catch {
      showError(copy.testMessageNetworkError);
    } finally {
      inFlightRef.current = false;
      setIsSending(false);
    }
  }, [
    accessToken,
    campaignData.uuid,
    copy.testMessageAuthenticationRequired,
    copy.testMessageNetworkError,
    copy.testMessageSuccess,
    copy.testMessageTargetPhoneInvalid,
    normalizedLanguage,
    showError,
    showSuccess,
    targetPhoneNumber,
    validationErrorCode,
  ]);

  return {
    isSending,
    isReady,
    checks,
    validationErrorCode,
    sendTestMessage,
  };
};
