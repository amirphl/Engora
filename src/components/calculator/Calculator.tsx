import React, { useMemo, useState } from 'react';
import {
  CalculatorTranslations,
  calculatorTranslations,
} from './calculatorTranslations';

export interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: CalculatorTranslations;
  dir?: 'rtl' | 'ltr';
  initialAmount?: number;
  initialPercent?: number;
  onApply?: (percent: number) => void;
}

const formatNumber = (n: number, dir: 'rtl' | 'ltr') => {
  const locale = dir === 'rtl' ? 'fa-IR' : 'en-US';
  return new Intl.NumberFormat(locale).format(Math.round(n));
};

const AgencyCalculatorModal: React.FC<CalculatorProps> = ({
  isOpen,
  onClose,
  translations = calculatorTranslations.en,
  dir = 'ltr',
  initialAmount = 300000000,
  initialPercent = 80,
  onApply,
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [giftPercent, setGiftPercent] = useState<number>(initialPercent);

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const calculations = useMemo(() => {
    const P = Math.max(0, Number(amount || 0));
    const E = clamp(Number(giftPercent || 0), 0, 100);
    const e = E / 100;
    const d = (2 * e) / (1 + e);
    const gift = P * e;
    const yourRevenue = P - P / (2 - d);
    const baselineAgency = P * 0.5;
    const reduction = Math.max(0, baselineAgency - yourRevenue);
    const totalCharge = P + gift;
    return { P, E, gift, yourRevenue, reduction, totalCharge };
  }, [amount, giftPercent]);

  const percentChips = [0, 20, 40, 60, 80, 90, 100];
  const amountChips = [20000000, 60000000, 140000000, 300000000];

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div
        className='relative bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl border border-gray-200'
        dir={dir}
      >
        <div className='p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              {translations.title}
            </h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 text-xl leading-none'
            >
              ×
            </button>
          </div>

          <div className='calc-grid'>
            <div>
              <div className='flex items-center justify-between mb-2 flex-wrap gap-2'>
                <label className='text-sm text-gray-600'>
                  {translations.amountLabel}
                </label>
                <div className='text-xs text-gray-500'>
                  {translations.amountPreview}{' '}
                  {formatNumber(calculations.P, dir)} تومان
                </div>
              </div>
              <div className='calc-row'>
                <input
                  type='number'
                  min={0}
                  step={1000}
                  value={amount}
                  onChange={e =>
                    setAmount(Math.max(0, Number(e.target.value || 0)))
                  }
                  placeholder={translations.amountPlaceholder}
                  className='w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500'
                />
                {amountChips.map((amt, idx) => (
                  <button
                    key={amt}
                    className={`calc-chip-amt ${amount === amt ? 'active' : ''}`}
                    onClick={() => setAmount(amt)}
                    type='button'
                  >
                    {translations.amountChips[idx] || formatNumber(amt, dir)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className='flex items-center justify-between mb-2 flex-wrap gap-2'>
                <label className='text-sm text-gray-600'>
                  {translations.percentLabel}
                </label>
                <div className='text-xs text-gray-500'>
                  {translations.percentHint}
                </div>
              </div>
              <div className='calc-row'>
                <input
                  type='number'
                  min={0}
                  max={100}
                  step={1}
                  value={giftPercent}
                  onChange={e =>
                    setGiftPercent(clamp(Number(e.target.value || 0), 0, 100))
                  }
                  className='w-24 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500'
                />
                {percentChips.map((pct, idx) => (
                  <button
                    key={pct}
                    className={`calc-chip ${calculations.E === pct ? 'active' : ''}`}
                    onClick={() => setGiftPercent(pct)}
                    type='button'
                    data-e={pct}
                  >
                    {translations.percentChips[idx] || `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='calc-divider' />

          <div className='overflow-x-auto'>
            <table className='calc-table' dir={dir}>
              <thead>
                <tr>
                  <th>{translations.tableHeadDesc}</th>
                  <th>{translations.tableHeadValue}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {translations.reductionLabel}{' '}
                    <span
                      className='calc-hint'
                      data-tip={translations.reductionTip}
                    >
                      ?
                    </span>
                  </td>
                  <td className='calc-val calc-warn'>
                    {formatNumber(calculations.reduction, dir)}
                  </td>
                </tr>
                <tr>
                  <td>
                    {translations.giftLabel}{' '}
                    <span className='calc-hint' data-tip={translations.giftTip}>
                      ?
                    </span>
                  </td>
                  <td className='calc-val calc-good'>
                    {formatNumber(calculations.gift, dir)}
                  </td>
                </tr>
                <tr className='calc-rule'>
                  <td colSpan={2}>
                    <strong>{translations.ruleFixed}</strong>{' '}
                    <span className='font-semibold text-gray-900'>
                      {formatNumber(calculations.gift, dir)} ={' '}
                      {dir === 'rtl' ? '۲' : '2'} ×{' '}
                      {formatNumber(calculations.reduction, dir)}
                    </span>{' '}
                    <span className='calc-rule-check'>✔</span>
                  </td>
                </tr>
                <tr className='calc-row-sep'>
                  <td>
                    <strong>{translations.yourRevenueLabel}</strong>
                  </td>
                  <td className='calc-val'>
                    {formatNumber(calculations.yourRevenue, dir)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>{translations.totalChargeLabel}</strong>
                  </td>
                  <td className='calc-val'>
                    {formatNumber(calculations.totalCharge, dir)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className='calc-footer'>
            {onApply && (
              <button
                className='calc-btn'
                type='button'
                onClick={() => {
                  onApply(giftPercent);
                  onClose();
                }}
              >
                {translations.apply}
              </button>
            )}
            <button
              className='calc-btn'
              type='button'
              onClick={() => {
                setAmount(initialAmount);
                setGiftPercent(initialPercent);
              }}
            >
              {translations.reset}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyCalculatorModal;
export { calculatorTranslations };
