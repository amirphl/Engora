import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../../../services/api';
import { CampaignPayment } from '../../../types/campaign';

export const useWalletBalance = (
  accessToken: string | null,
  totalCost: number | undefined,
  onUpdatePayment: (data: Partial<CampaignPayment>) => void
) => {
  const [walletBalance, setWalletBalance] = useState<number | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean | undefined>(
    undefined
  );
  const [balanceChecked, setBalanceChecked] = useState(false);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    requestSequenceRef.current += 1;
    setWalletBalance(undefined);
    setHasEnoughBalance(undefined);
    setBalanceChecked(false);
    setIsLoading(false);
    setError(null);
    onUpdatePayment({ hasEnoughBalance: undefined });
  }, [accessToken, onUpdatePayment]);

  const getWalletBalance = useCallback(async () => {
    if (balanceChecked) {
      return;
    }
    if (!accessToken) {
      setError('Authentication is required to get wallet balance');
      setBalanceChecked(true);
      return;
    }

    const sequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = sequence;
    setIsLoading(true);
    setError(null);

    try {
      apiService.setAccessToken(accessToken);
      const response = await apiService.getWalletBalance();
      if (requestSequenceRef.current !== sequence) return;

      if (response.success && response.data) {
        const free = response.data.free;
        const credit = response.data.credit ?? 0;
        // const agencyShare = Number(
        //   (response.data as any).agency_share_with_tax || 0
        // );
        // const balance = free + credit + agencyShare;
        const balance = free + credit;
        if (
          typeof free !== 'number' ||
          typeof credit !== 'number' ||
          !Number.isFinite(balance) ||
          balance < 0
        ) {
          throw new Error('Invalid wallet balance response');
        }
        setWalletBalance(balance);
        setBalanceChecked(true);
      } else {
        const errorMessage = response.message || 'Failed to get wallet balance';
        setError(errorMessage);
        setWalletBalance(undefined);
        setHasEnoughBalance(undefined);
        onUpdatePayment({ hasEnoughBalance: undefined });
        setBalanceChecked(true);
      }
    } catch (error) {
      if (requestSequenceRef.current !== sequence) return;
      const errorMessage =
        error instanceof Error &&
        error.message === 'Invalid wallet balance response'
          ? error.message
          : 'Network error while getting wallet balance';
      setError(errorMessage);
      setWalletBalance(undefined);
      setHasEnoughBalance(undefined);
      onUpdatePayment({ hasEnoughBalance: undefined });
      setBalanceChecked(true);
    } finally {
      if (requestSequenceRef.current === sequence) {
        setIsLoading(false);
      }
    }
  }, [accessToken, balanceChecked, onUpdatePayment]);

  // Recompute sufficiency when total cost or wallet balance changes
  useEffect(() => {
    if (walletBalance !== undefined && totalCost !== undefined) {
      const hasEnough = walletBalance >= totalCost;
      setHasEnoughBalance(hasEnough);
      onUpdatePayment({ hasEnoughBalance: hasEnough });
      return;
    }
    setHasEnoughBalance(undefined);
    onUpdatePayment({ hasEnoughBalance: undefined });
  }, [walletBalance, totalCost, onUpdatePayment]);

  return {
    walletBalance,
    isLoading,
    error,
    hasEnoughBalance,
    balanceChecked,
    getWalletBalance,
  };
};
