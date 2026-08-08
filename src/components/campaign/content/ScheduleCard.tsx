import React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../../ui/Card';
import DatePicker from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import {
  isScheduleWithinTehranWindow,
  MIN_SCHEDULE_LEAD_TIME_MS,
} from '../../../utils/campaignUtils';

interface ScheduleCardProps {
  showDateTimePicker: boolean;
  scheduleAt?: string;
  isEnglish: boolean;
  onToggleChange: (value: boolean) => void;
  onScheduleChange: (scheduleAt?: string) => void;
  title: string;
  disableLabel: string;
  enableLabel: string;
  scheduledLabel: string;
  immediateLabel: string;
  dateTimeLabel: string;
  tooSoonError: string;
  outsideWindowError: string;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  showDateTimePicker,
  scheduleAt,
  isEnglish,
  onToggleChange,
  onScheduleChange,
  title,
  disableLabel,
  enableLabel,
  scheduledLabel,
  immediateLabel,
  dateTimeLabel,
  tooSoonError,
  outsideWindowError,
}) => {
  const nowMs = Date.now();
  const minMs = nowMs + MIN_SCHEDULE_LEAD_TIME_MS;
  const schedMs = scheduleAt ? new Date(scheduleAt).getTime() : NaN;
  const isTooSoon =
    Boolean(scheduleAt) && (Number.isNaN(schedMs) || schedMs < minMs);
  const isOutsideWindow =
    (Boolean(scheduleAt) &&
      !Number.isNaN(schedMs) &&
      !isScheduleWithinTehranWindow(scheduleAt!)) ||
    (!showDateTimePicker &&
      !isScheduleWithinTehranWindow(
        new Date(nowMs + MIN_SCHEDULE_LEAD_TIME_MS)
      ));

  return (
    <Card className='h-full'>
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-1'>
          <Calendar className='h-5 w-5 text-primary-600' />
          {title}
        </h3>
        <div className='flex items-center space-x-4'>
          <label className='inline-flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='scheduleToggle'
              value='on'
              checked={showDateTimePicker === true}
              onChange={() => onToggleChange(true)}
              className='h-4 w-4 text-primary-600 border-gray-300'
            />
            <span className='text-sm text-gray-700'>{enableLabel}</span>
          </label>
          <label className='inline-flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='scheduleToggle'
              value='off'
              checked={showDateTimePicker === false}
              onChange={() => onToggleChange(false)}
              className='h-4 w-4 text-primary-600 border-gray-300'
            />
            <span className='text-sm text-gray-700'>{disableLabel}</span>
          </label>
          <span className='text-sm text-gray-600'>
            {showDateTimePicker ? scheduledLabel : immediateLabel}
          </span>
        </div>
        {showDateTimePicker && (
          <div className='space-y-3'>
            <div>
              <label
                htmlFor='scheduleAt'
                className='block text-sm font-medium text-gray-700'
              >
                {dateTimeLabel}
              </label>
              <DatePicker
                calendar={isEnglish ? gregorian : persian}
                locale={isEnglish ? gregorian_en : persian_fa}
                plugins={[
                  <TimePicker
                    hideSeconds={true}
                    className='campaign-time-picker-24h'
                  />,
                ]}
                value={scheduleAt ? new Date(scheduleAt) : undefined}
                onChange={(val: DateObject | null) => {
                  if (!val) {
                    onScheduleChange(undefined);
                    return;
                  }
                  try {
                    const jsDate = val.toDate();
                    jsDate.setSeconds(0, 0);
                    onScheduleChange(jsDate.toISOString());
                  } catch {
                    onScheduleChange(undefined);
                  }
                }}
                format='YYYY/MM/DD HH:mm'
                containerClassName='campaign-date-picker mt-1'
                inputClass='w-full rounded border border-gray-300 px-3 py-2'
              />
              {isTooSoon && (
                <p className='text-sm text-red-600 mt-2'>{tooSoonError}</p>
              )}
              {!isTooSoon && isOutsideWindow && (
                <p className='text-sm text-red-600 mt-2'>
                  {outsideWindowError}
                </p>
              )}
            </div>
          </div>
        )}
        {!showDateTimePicker && isOutsideWindow && (
          <p className='text-sm text-red-600'>{outsideWindowError}</p>
        )}
      </div>
    </Card>
  );
};

export default ScheduleCard;
