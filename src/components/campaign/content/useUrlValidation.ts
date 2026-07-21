import { useState, useEffect, useCallback } from 'react';
import { isValidCampaignUrl } from '../../../utils/campaignUtils';

export const useUrlValidation = (
  url: string,
  insertLink: boolean,
  errorMessage: string
) => {
  const [linkError, setLinkError] = useState<string>('');
  const validateUrl = useCallback((urlToValidate: string) => {
    // empty is considered valid (handled elsewhere if required)
    if (!urlToValidate.trim()) return true;
    return isValidCampaignUrl(urlToValidate);
  }, []);

  // Validate link when loaded from localStorage
  useEffect(() => {
    if (url && insertLink) {
      setLinkError('');
      if (!validateUrl(url)) {
        setLinkError(errorMessage);
      }
    }
  }, [url, insertLink, errorMessage, validateUrl]);

  const handleLinkChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    setLinkError('');
    if (value.trim() && !validateUrl(value)) {
      setLinkError(errorMessage);
    }
    onChange(value);
  };

  const clearError = () => setLinkError('');

  return {
    linkError,
    validateUrl,
    handleLinkChange,
    clearError,
  };
};
