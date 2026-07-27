import React, { useEffect, useState, useMemo } from 'react';
import Card from '../../ui/Card';
import { useLanguage } from '../../../hooks/useLanguage';
import { budgetI18n } from './budgetTranslations';
import { apiService } from '../../../services/api';
import { useToast } from '../../../hooks/useToast';

interface BudgetSelectorProps {
  accessToken?: string | null;
  initialPercent?: number;
  onChange?: (percent: number, amount: number) => void;
}

const BudgetSelector: React.FC<BudgetSelectorProps> = ({
  accessToken,
  initialPercent = 10,
  onChange,
}) => {
  const { language } = useLanguage();
  const t = budgetI18n[language as keyof typeof budgetI18n] || budgetI18n.en;
  const balanceErrorMessage =
    t.balanceError || 'Failed to check wallet balance';
  const { showToast } = useToast();

  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [percent, setPercent] = useState<number>(initialPercent);

  const MIN_BUDGET = 100000;
  const MAX_BUDGET = 160000000;
  const BUDGET_STEP = 100000;

  useEffect(() => {
    let cancelled = false;
    if (!accessToken) {
      setBalance(null);
      setError(null);
      return;
    }

    const fetchBalance = async () => {
      setError(null);
      try {
        apiService.setAccessToken(accessToken);
        const resp = await apiService.getWalletBalance();
        if (cancelled) {
          return;
        }

        if (resp.success && resp.data) {
          const freeBalance = resp.data.free;
          const creditBalance = resp.data.credit ?? 0;
          const availableBalance = freeBalance + creditBalance;
          if (
            typeof freeBalance !== 'number' ||
            typeof creditBalance !== 'number' ||
            !Number.isFinite(availableBalance) ||
            availableBalance < 0
          ) {
            setBalance(null);
            setError(balanceErrorMessage);
            showToast('error', balanceErrorMessage);
            return;
          }
          setBalance(availableBalance);
        } else {
          setError(balanceErrorMessage);
          showToast('error', balanceErrorMessage);
        }
      } catch {
        setError(balanceErrorMessage);
        showToast('error', balanceErrorMessage);
      }
    };

    fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [accessToken, balanceErrorMessage, showToast]);

  const availableMax = useMemo(() => {
    if (balance === null) return 0;
    return Math.max(0, balance);
  }, [balance]);

  const computeAmount = (pct: number) => {
    const computed = Math.floor((availableMax * pct) / 100);
    const rounded = Math.floor(computed / BUDGET_STEP) * BUDGET_STEP;
    if (rounded <= 0) return 0;
    const capped = Math.min(MAX_BUDGET, rounded);
    return Math.max(MIN_BUDGET, capped);
  };

  const rawAmount = computeAmount(percent);

  // Hide selector if user has zero or negative balance
  if (balance !== null && balance <= 0) {
    return null;
  }

  const propagateChange = (nextPercent: number) => {
    if (nextPercent <= 0) {
      onChange?.(0, 0);
      return;
    }
    const nextAmount = computeAmount(nextPercent);
    onChange?.(nextPercent, nextAmount);
  };

  const formatNumber = (n: number | null) => {
    if (n === null) return '-';
    try {
      return language === 'fa'
        ? n.toLocaleString('fa-IR')
        : n.toLocaleString('en-US');
    } catch {
      return String(n);
    }
  };

  return (
    <Card>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-medium text-gray-900'>
            {t.selectBudgetPercentTitle || 'Use Wallet Balance'}
          </h3>
        </div>

        <div>
          <input
            type='range'
            min={0}
            max={100}
            value={percent}
            onChange={e => {
              const next = Number(e.target.value);
              setPercent(next);
              propagateChange(next);
            }}
            className='w-full'
          />
          <div className='flex justify-between text-xs text-gray-500 mt-1'>
            <span>0%</span>
            <span>{percent}%</span>
            <span>100%</span>
          </div>
        </div>

        <div className='text-sm text-gray-700'>
          {t.budgetFromBalance || 'Budget from balance'}:{' '}
          <strong>{formatNumber(rawAmount)}</strong>
        </div>

        {rawAmount > 0 &&
          (rawAmount < MIN_BUDGET || rawAmount > MAX_BUDGET) && (
            <div className='mt-2 text-sm text-red-500'>
              {rawAmount < MIN_BUDGET
                ? t.budgetTooLow?.replace('{min}', formatNumber(MIN_BUDGET))
                : t.budgetTooHigh?.replace('{max}', formatNumber(MAX_BUDGET))}
            </div>
          )}

        {error && <p className='text-sm text-red-600'>{error}</p>}
      </div>
    </Card>
  );
};

export default BudgetSelector;
