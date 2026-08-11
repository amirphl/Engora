import React, { useMemo, useState } from 'react';
import apiService from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import WalletHeader from './wallet/components/WalletHeader';
import BalanceSummary from './wallet/components/BalanceSummary';
import ChargeForm from './wallet/components/ChargeForm';
import HistoryTable from './wallet/components/HistoryTable';
import PaymentSummaryModal from './wallet/components/PaymentSummaryModal';
import { useWalletBalance } from './wallet/hooks/useWalletBalance';
import { useWalletHistory } from './wallet/hooks/useWalletHistory';
import { formatWalletDatetime, recommendedAmounts } from './wallet/utils';
import { WalletCopy, getWalletCopy } from './wallet/translations';
import DepositReceiptSection from './wallet/components/DepositReceiptSection';
import { X } from 'lucide-react';

const WalletPage: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  const isMarketingAgency = user?.account_type === 'marketing_agency';
  const walletCopy: WalletCopy = useMemo(
    () => getWalletCopy(language),
    [language]
  );
  const currencyLabel = walletCopy.currency;

  const {
    balances,
    loading: loadingBalance,
    error: balanceError,
  } = useWalletBalance(accessToken);
  const {
    items: historyItems,
    page: historyPage,
    hasNext: historyHasNext,
    loading: loadingHistory,
    error: historyError,
    goNext: nextHistory,
    goPrev: prevHistory,
  } = useWalletHistory(accessToken);

  const MIN_CHARGE = 1_000_000;
  const STEP_CHARGE = 1_000;
  const MAX_CHARGE = 1_000_000_000;

  const [chargeAmount, setChargeAmount] = useState<number | ''>('');
  const [error, setError] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState<boolean>(false);

  const handleChargeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setChargeAmount('');
      setError('');
      return;
    }

    const numValue = Math.min(parseInt(value, 10), MAX_CHARGE);
    if (isNaN(numValue)) {
      setError(walletCopy.errorInvalidNumber);
      return;
    }

    const minBypass = (window as any).__disableMinCharge === true;
    if (!minBypass && numValue < MIN_CHARGE) {
      setError(walletCopy.errorMinAmount);
    } else if (numValue % STEP_CHARGE !== 0) {
      setError(walletCopy.errorMultipleOf);
    } else {
      setError('');
    }

    setChargeAmount(numValue);
  };

  const handleRecommendedAmountClick = (amount: number) => {
    setChargeAmount(amount);
    setError('');
  };

  const handlePayClick = () => {
    if (!error && chargeAmount !== '') {
      setShowPaymentModal(true);
    }
  };

  const handleDepositPayClick = () => {
    if (!error && chargeAmount !== '') {
      setShowDepositModal(true);
    } else {
      setError(walletCopy.depositNeedAmount);
    }
  };

  const handlePaymentContinue = async () => {
    if (chargeAmount === '' || error) return;
    if (paymentSubmitting) return;
    setPaymentSubmitting(true);
    try {
      const baseAmount = Number(chargeAmount);
      const tax = Math.round(baseAmount * 0.1);
      const amountWithTax = baseAmount + tax;
      const resp = await apiService.startWalletCharge(amountWithTax, language);
      if (resp.success && resp.data && (resp.data as any).token) {
        const token = (resp.data as any).token;
        // Build and submit a form to Atipay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://mipg.atipay.net/v1/redirect-to-gateway';
        form.hidden = true;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token';
        input.value = token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      } else {
        setShowPaymentModal(false);
        setError(resp.message || 'Failed to start payment');
      }
    } catch (e) {
      setShowPaymentModal(false);
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <WalletHeader
        onBack={() => (window.location.href = '/dashboard')}
        copy={walletCopy}
      />

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
          <div className='space-y-6'>
            <BalanceSummary
              balances={balances}
              loading={loadingBalance}
              error={balanceError}
              currencyLabel={currencyLabel}
              formatDatetime={iso => formatWalletDatetime(iso, language)}
              isMarketingAgency={isMarketingAgency}
              copy={walletCopy}
            />

            <ChargeForm
              amount={chargeAmount}
              error={error}
              onAmountChange={handleChargeAmountChange}
              onSelectRecommended={handleRecommendedAmountClick}
              onPay={handlePayClick}
              onPayByDeposit={handleDepositPayClick}
              recommendedAmounts={recommendedAmounts}
              currencyLabel={currencyLabel}
              copy={walletCopy}
            />

            <HistoryTable
              items={historyItems}
              loading={loadingHistory}
              error={historyError}
              page={historyPage}
              hasNext={historyHasNext}
              accessToken={accessToken}
              language={language}
              currencyLabel={currencyLabel}
              formatDatetime={iso => formatWalletDatetime(iso, language)}
              onNext={nextHistory}
              onPrev={prevHistory}
              copy={walletCopy}
            />
          </div>
        </div>
      </div>

      <PaymentSummaryModal
        isOpen={showPaymentModal}
        amount={Number(chargeAmount) || 0}
        currencyLabel={currencyLabel}
        loading={paymentSubmitting}
        onConfirm={handlePaymentContinue}
        onCancel={() => setShowPaymentModal(false)}
        copy={walletCopy}
      />

      {showDepositModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-5xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {walletCopy.payByDeposit}
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <div className='p-6'>
              <DepositReceiptSection
                accessToken={accessToken}
                language={language}
                currencyLabel={currencyLabel}
                amount={chargeAmount}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
