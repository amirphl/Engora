import React from 'react';
import DatePicker from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { AdminListCampaignsFilter } from '../../../types/admin';
import { CampaignStatusOption } from '../hooks/useCampaignFilters';
import { AdminCampaignManagementCopy } from '../translations';

interface AdminCampaignFiltersBarProps {
  language: 'en' | 'fa';
  title: string;
  status: AdminListCampaignsFilter['status'] | undefined;
  start: string;
  end: string;
  loading: boolean;
  copy: AdminCampaignManagementCopy;
  statusOptions: CampaignStatusOption[];
  onTitleChange: (value: string) => void;
  onStatusChange: (
    value: AdminListCampaignsFilter['status'] | undefined
  ) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply: () => void;
}

const FiltersBar: React.FC<AdminCampaignFiltersBarProps> = ({
  language,
  title,
  status,
  start,
  end,
  loading,
  copy,
  statusOptions,
  onTitleChange,
  onStatusChange,
  onStartChange,
  onEndChange,
  onApply,
}) => {
  const isFa = language === 'fa';

  const handleDateChange =
    (onChange: (value: string) => void) => (value: DateObject | null) => {
      if (!value) {
        onChange('');
        return;
      }

      try {
        const jsDate = value.toDate();
        onChange(jsDate.toISOString());
      } catch {
        onChange('');
      }
    };

  return (
    <>
      <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            {copy.filters.titleLabel}
          </label>
          <input
            type='text'
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            className='w-full border rounded px-3 py-2'
            placeholder={copy.filters.titlePlaceholder}
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>
            {copy.filters.statusLabel}
          </label>
          <select
            className='w-full border rounded px-3 py-2'
            value={status || ''}
            onChange={e =>
              onStatusChange(
                (e.target.value ||
                  undefined) as AdminListCampaignsFilter['status']
              )
            }
          >
            {statusOptions.map(opt => (
              <option
                key={`${opt.value || 'all'}-${opt.label}`}
                value={opt.value || ''}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>
            {copy.filters.startDateLabel}
          </label>
          <DatePicker
            calendar={isFa ? persian : gregorian}
            locale={isFa ? persian_fa : gregorian_en}
            plugins={[
              <TimePicker
                hideSeconds={false}
                className='campaign-time-picker-24h'
              />,
            ]}
            value={start ? new Date(start) : undefined}
            onChange={handleDateChange(onStartChange)}
            format='YYYY/MM/DD HH:mm:ss'
            containerClassName='campaign-date-picker'
            inputClass='w-full rounded border px-3 py-2'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>
            {copy.filters.endDateLabel}
          </label>
          <DatePicker
            calendar={isFa ? persian : gregorian}
            locale={isFa ? persian_fa : gregorian_en}
            plugins={[
              <TimePicker
                hideSeconds={false}
                className='campaign-time-picker-24h'
              />,
            ]}
            value={end ? new Date(end) : undefined}
            onChange={handleDateChange(onEndChange)}
            format='YYYY/MM/DD HH:mm:ss'
            containerClassName='campaign-date-picker'
            inputClass='w-full rounded border px-3 py-2'
          />
        </div>
      </div>

      <div className='mb-6'>
        <button
          type='button'
          onClick={onApply}
          className='w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto'
          disabled={loading}
        >
          {loading ? copy.common.loading : copy.filters.apply}
        </button>
      </div>
    </>
  );
};

export default FiltersBar;
