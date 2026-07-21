import { useEffect, useRef, useState } from 'react';
import { apiService } from '../../../services/api';
import { useToast } from '../../../hooks/useToast';

type LineNumberOption = { value: string; label: string; priceFactor?: number };

const activeLineNumbersCache = new Map<string, LineNumberOption[]>();
const activeLineNumbersFetchInFlight = new Map<
  string,
  Promise<LineNumberOption[]>
>();

export const useLineNumbers = (accessToken: string | null) => {
  const [lineNumberOptions, setLineNumberOptions] = useState<
    LineNumberOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (!accessToken) {
      setLineNumberOptions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    apiService.setAccessToken(accessToken);
    let isActive = true;

    const cached = activeLineNumbersCache.get(accessToken);
    if (cached) {
      setLineNumberOptions(cached);
      setIsLoading(false);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setError(null);
    let request = activeLineNumbersFetchInFlight.get(accessToken);
    if (!request) {
      request = (async () => {
        const res = await apiService.listActiveLineNumbers();
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to load line numbers');
        }
        const items = (res.data.items || []) as Array<{
          line_number: string;
          price_factor?: number;
        }>;
        return items.map(item => ({
          value: item.line_number,
          label: item.line_number,
          priceFactor:
            typeof item.price_factor === 'number'
              ? item.price_factor
              : undefined,
        }));
      })();
      activeLineNumbersFetchInFlight.set(accessToken, request);
    }

    request
      .then(options => {
        activeLineNumbersCache.set(accessToken, options);
        if (!isActive) return;
        setLineNumberOptions(options);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load line numbers';
        setError(message);
        showToastRef.current('error', message);
      })
      .finally(() => {
        if (activeLineNumbersFetchInFlight.get(accessToken) === request) {
          activeLineNumbersFetchInFlight.delete(accessToken);
        }
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  return { lineNumberOptions, isLoading, error };
};
