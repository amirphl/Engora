import { useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { useToast } from './useToast';
import { PlatformKey, PlatformSettingsItem } from '../types/platformSettings';

type Option = { value: string; label: string };

const platformSettingsCache = new Map<string, PlatformSettingsItem[]>();
const platformSettingsFetchInFlight = new Map<
  string,
  Promise<PlatformSettingsItem[]>
>();

export const usePlatformSettingsList = (
  accessToken: string | null,
  platform: PlatformKey
) => {
  const [items, setItems] = useState<PlatformSettingsItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (!accessToken) {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    apiService.setAccessToken(accessToken);
    let isActive = true;

    const cached = platformSettingsCache.get(accessToken);
    if (cached) {
      setItems(cached);
      setIsLoading(false);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setError(null);
    let request = platformSettingsFetchInFlight.get(accessToken);
    if (!request) {
      request = (async () => {
        const res = await apiService.listPlatformSettings();
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to load platform settings');
        }
        return res.data.items || [];
      })();
      platformSettingsFetchInFlight.set(accessToken, request);
    }

    request
      .then(data => {
        platformSettingsCache.set(accessToken, data);
        if (!isActive) return;
        setItems(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load platform settings';
        setError(message);
        showToastRef.current('error', message);
      })
      .finally(() => {
        if (platformSettingsFetchInFlight.get(accessToken) === request) {
          platformSettingsFetchInFlight.delete(accessToken);
        }
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  const filteredItems = useMemo(() => {
    const normalizedPlatform = platform.trim().toLowerCase();
    return items.filter(item => {
      const normalizedItemPlatform = item.platform?.trim().toLowerCase();
      const normalizedStatus = item.status?.trim().toLowerCase();
      return (
        normalizedItemPlatform === normalizedPlatform &&
        normalizedStatus === 'active'
      );
    });
  }, [items, platform]);

  const options = useMemo<Option[]>(
    () =>
      filteredItems
        .filter(item => item.name && item.id)
        .map(item => ({
          value: String(item.id),
          label: item.name as string,
        })),
    [filteredItems]
  );

  return { items: filteredItems, options, isLoading, error };
};
