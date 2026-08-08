import React from 'react';
import DatePicker from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { AdminGetCampaignResponse } from '../../../types/admin';
import { AdminCampaignManagementCopy } from '../translations';

interface RescheduleCampaignModalProps {
  language: 'en' | 'fa';
  campaign: AdminGetCampaignResponse | null;
  selectedDate: Date | null;
  enInputValue: string;
  minFutureDate: Date;
  minLocalDateTimeValue: string;
  validationError: string | null;
  confirmOpen: boolean;
  submitting: boolean;
  copy: AdminCampaignManagementCopy;
  formatDateTime: (value?: string | null) => string;
  onClose: () => void;
  onEnDateTimeChange: (value: string) => void;
  onFaDateTimeChange: (value: unknown) => void;
  onRequestConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirmSubmit: () => void;
}

const RescheduleCampaignModal: React.FC<RescheduleCampaignModalProps> = ({
  language,
  campaign,
  selectedDate,
  enInputValue,
  minFutureDate,
  minLocalDateTimeValue,
  validationError,
  confirmOpen,
  submitting,
  copy,
  formatDateTime,
  onClose,
  onEnDateTimeChange,
  onFaDateTimeChange,
  onRequestConfirm,
  onCancelConfirm,
  onConfirmSubmit,
}) => {
  if (!campaign) return null;

  const isFa = language === 'fa';
  const previewDate = selectedDate
    ? formatDateTime(selectedDate.toISOString())
    : '-';

  return (
    <>
      <ConfirmationModal
        isOpen
        onConfirm={onRequestConfirm}
        onCancel={onClose}
        title={copy.modal.rescheduleTitle}
        confirmText={copy.modal.rescheduleApply}
        cancelText={copy.common.cancel}
        loading={submitting}
        containerClassName='max-w-lg sm:rounded-2xl'
      >
        <div className='space-y-3'>
          <div className='text-sm text-gray-700'>
            <div>
              <span className='font-medium'>{copy.table.headers.id}:</span>{' '}
              {campaign.id}
            </div>
            <div>
              <span className='font-medium'>{copy.modal.title}:</span>{' '}
              {campaign.title || '-'}
            </div>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              {copy.modal.rescheduleDateLabel}
            </label>

            {isFa ? (
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                plugins={[
                  <TimePicker
                    hideSeconds={true}
                    className='campaign-time-picker-24h'
                  />,
                ]}
                value={selectedDate || undefined}
                minDate={
                  new DateObject({
                    date: minFutureDate,
                    calendar: gregorian,
                    locale: gregorian_en,
                  })
                }
                onChange={onFaDateTimeChange}
                format='YYYY/MM/DD HH:mm'
                containerClassName='campaign-date-picker'
                inputClass='w-full rounded border border-gray-300 px-3 py-2'
              />
            ) : (
              <input
                type='datetime-local'
                value={enInputValue}
                min={minLocalDateTimeValue}
                onChange={e => onEnDateTimeChange(e.target.value)}
                className='w-full rounded border border-gray-300 px-3 py-2'
              />
            )}

            <p className='mt-1 text-xs text-gray-500'>
              {copy.modal.rescheduleDateHint}
            </p>
            <p className='mt-1 text-xs text-gray-600'>
              {copy.table.headers.scheduleAt}: {previewDate}
            </p>
          </div>

          {validationError ? (
            <div className='rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
              {validationError}
            </div>
          ) : null}
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={confirmOpen}
        onConfirm={onConfirmSubmit}
        onCancel={onCancelConfirm}
        title={copy.modal.rescheduleConfirmTitle}
        message={`${copy.modal.rescheduleConfirmMessage}\n\n${copy.table.headers.scheduleAt}: ${previewDate}`}
        confirmText={
          submitting
            ? copy.modal.rescheduleApplying
            : copy.table.actions.reschedule
        }
        cancelText={copy.common.cancel}
        loading={submitting}
        containerClassName='max-w-md sm:rounded-2xl'
      />
    </>
  );
};

export default RescheduleCampaignModal;
