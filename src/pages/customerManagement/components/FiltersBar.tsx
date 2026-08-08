import React from 'react';
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import Button from '../../../components/ui/Button';
import { Filter } from 'lucide-react';
import { AgencyReportTranslations } from '../translations';
import DateObject from 'react-date-object';

interface FiltersBarProps {
  language: string;
  startDate?: string;
  endDate?: string;
  nameFilter: string;
  onStartChange: (value?: string) => void;
  onEndChange: (value?: string) => void;
  onNameChange: (value: string) => void;
  onApply: () => void;
  loading: boolean;
  copy: Pick<
    AgencyReportTranslations,
    'startDate' | 'endDate' | 'name' | 'namePlaceholder' | 'applyFilters'
  >;
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  language,
  startDate,
  endDate,
  nameFilter,
  onStartChange,
  onEndChange,
  onNameChange,
  onApply,
  loading,
  copy,
}) => {
  return (
    <div className='bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='flex flex-col'>
          <label
            htmlFor='startDate'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {copy.startDate}
          </label>
          <DatePicker
            calendar={language === 'fa' ? persian : gregorian}
            locale={language === 'fa' ? persian_fa : gregorian_en}
            plugins={[
              <TimePicker
                hideSeconds={false}
                className='campaign-time-picker-24h'
              />,
            ]}
            value={startDate ? new Date(startDate) : undefined}
            onChange={(val: DateObject | null) => {
              if (!val) {
                onStartChange(undefined);
                return;
              }
              try {
                const jsDate = val.toDate();
                onStartChange(jsDate.toISOString());
              } catch {
                onStartChange(undefined);
              }
            }}
            format='YYYY/MM/DD HH:mm:ss'
            className='w-full rounded-lg border-2 border-primary-300 bg-gradient-to-r from-white to-blue-50 shadow-inner'
            containerClassName='campaign-date-picker mt-1'
            inputClass='w-full px-3 py-2 text-sm font-semibold rounded-lg focus:outline-none'
          />
        </div>
        <div className='flex flex-col'>
          <label
            htmlFor='endDate'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {copy.endDate}
          </label>
          <DatePicker
            calendar={language === 'fa' ? persian : gregorian}
            locale={language === 'fa' ? persian_fa : gregorian_en}
            plugins={[
              <TimePicker
                hideSeconds={false}
                className='campaign-time-picker-24h'
              />,
            ]}
            value={endDate ? new Date(endDate) : undefined}
            onChange={(val: DateObject | null) => {
              if (!val) {
                onEndChange(undefined);
                return;
              }
              try {
                const jsDate = val.toDate();
                onEndChange(jsDate.toISOString());
              } catch {
                onEndChange(undefined);
              }
            }}
            format='YYYY/MM/DD HH:mm:ss'
            className='w-full rounded-lg border-2 border-primary-300 bg-gradient-to-r from-white to-blue-50 shadow-inner'
            containerClassName='campaign-date-picker mt-1'
            inputClass='w-full px-3 py-2 text-sm font-semibold rounded-lg focus:outline-none'
          />
        </div>
        <div className='flex flex-col'>
          <label
            htmlFor='nameFilter'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {copy.name}
          </label>
          <input
            id='nameFilter'
            type='text'
            value={nameFilter}
            onChange={e => onNameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !loading) onApply();
            }}
            placeholder={copy.namePlaceholder}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mt-1'
          />
        </div>
      </div>
      <div className='flex justify-end mt-4'>
        <Button
          variant='primary'
          onClick={onApply}
          disabled={loading}
          className='inline-flex items-center gap-2 px-5'
        >
          <Filter className='h-4 w-4' />
          {copy.applyFilters}
        </Button>
      </div>
    </div>
  );
};

export default FiltersBar;
