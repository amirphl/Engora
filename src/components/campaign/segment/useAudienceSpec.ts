import { useEffect, useState } from 'react';
import { AudienceSpec } from '../../../types/campaign';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

export const useAudienceSpec = (platform: string = 'sms') => {
  const { accessToken } = useAuth();
  const [spec, setSpec] = useState<AudienceSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setSpec(null);
      setLoading(false);
      setError(null);
      return;
    }
    const cacheKey = platform || 'sms';
    let canceled = false;
    setLoading(true);
    setError(null);
    setSpec(null);

    (async () => {
      try {
        apiService.setAccessToken(accessToken);
        const res = await apiService.listAudienceSpec(cacheKey);
        const nextSpec = res.data?.spec;
        if (!res.success || !nextSpec) {
          throw new Error(res.message || 'Failed to load audience spec');
        }
        if (canceled) return;
        setSpec(nextSpec as AudienceSpec);
        setError(null);
      } catch (e: unknown) {
        if (canceled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load audience spec'
        );
      } finally {
        if (canceled) return;
        setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [accessToken, platform]);

  return { spec, loading, error };
};
