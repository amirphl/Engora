import { useEffect, useState } from 'react';
import { apiService } from '../../../services/api';

type BundleOption = { value: string; label: string };

const bundlesCache = new Map<string, BundleOption[]>();
const bundlesFetchInFlight = new Map<string, Promise<BundleOption[]>>();
let bundlesCacheVersion = 0;

export const resetBundlesCache = () => {
  bundlesCacheVersion += 1;
  bundlesCache.clear();
  bundlesFetchInFlight.clear();
};

export const useBundles = (accessToken: string | null) => {
  const [bundleOptions, setBundleOptions] = useState<BundleOption[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setBundleOptions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    apiService.setAccessToken(accessToken);
    let isActive = true;
    const cacheVersion = bundlesCacheVersion;

    const cached = bundlesCache.get(accessToken);
    if (cached) {
      setBundleOptions(cached);
      setIsLoading(false);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setError(null);
    let request = bundlesFetchInFlight.get(accessToken);
    if (!request) {
      request = (async () => {
        const response = await apiService.listBundles({
          page: 1,
          limit: 500,
        });
        if (!response.success || !response.data) {
          throw new Error(
            response.error?.code || response.message || 'FETCH_FAILED'
          );
        }
        return (response.data.items || [])
          .map(item => ({
            value: String(item.id || ''),
            label: item.title || String(item.id || ''),
          }))
          .filter(option => option.value);
      })();
      bundlesFetchInFlight.set(accessToken, request);
    }

    request
      .then(options => {
        if (cacheVersion !== bundlesCacheVersion) return;
        bundlesCache.set(accessToken, options);
        if (!isActive) return;
        setBundleOptions(options);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'FETCH_FAILED');
      })
      .finally(() => {
        if (bundlesFetchInFlight.get(accessToken) === request) {
          bundlesFetchInFlight.delete(accessToken);
        }
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  return { bundleOptions, isLoading, error };
};
