import { useCallback, useRef, useState } from 'react';
import { GetCampaignResponse } from '../../../types/campaign';
import { getApiUrl } from '../../../config/environment';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { ReportsCopy } from '../translations';

export const useCancelCampaign = (copy: ReportsCopy) => {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [cancelling, setCancelling] = useState<Record<number, boolean>>({});
  const [cancelled, setCancelled] = useState<Record<number, boolean>>({});
  const cancellingIdsRef = useRef(new Set<number>());

  const cancelCampaign = useCallback(
    async (campaign: GetCampaignResponse) => {
      const id = campaign.id;
      if (
        !id ||
        cancellingIdsRef.current.has(id) ||
        cancelling[id] ||
        cancelled[id]
      ) {
        return;
      }
      if (!accessToken) {
        showError(copy.modal.cancelError);
        return;
      }
      const ok = window.confirm(copy.modal.cancelConfirm);
      if (!ok) return;

      cancellingIdsRef.current.add(id);
      setCancelling(prev => ({ ...prev, [id]: true }));
      try {
        const resp = await fetch(getApiUrl(`/campaigns/${id}/cancel`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const raw = await resp.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          data = null;
        }
        if (!resp.ok || data?.success === false) {
          const message =
            data?.message || data?.error?.code || copy.modal.cancelError;
          showError(message);
          return;
        }
        setCancelled(prev => ({ ...prev, [id]: true }));
        showSuccess(data?.message || copy.modal.cancelSuccess);
      } catch {
        showError(copy.modal.cancelError);
      } finally {
        cancellingIdsRef.current.delete(id);
        setCancelling(prev => ({ ...prev, [id]: false }));
      }
    },
    [
      accessToken,
      cancelling,
      cancelled,
      copy.modal.cancelConfirm,
      copy.modal.cancelError,
      copy.modal.cancelSuccess,
      showError,
      showSuccess,
    ]
  );

  return { cancelCampaign, cancelling, cancelled };
};
