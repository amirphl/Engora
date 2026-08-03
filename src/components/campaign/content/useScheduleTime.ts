import { useState, useEffect } from 'react';
import {
  isScheduleWithinTehranWindow,
  MIN_SCHEDULE_LEAD_TIME_MS,
} from '../../../utils/campaignUtils';

const getDefaultSchedule = (): string => {
  const targetMs = Date.now() + MIN_SCHEDULE_LEAD_TIME_MS + 60 * 1000;
  let candidateMs = Math.ceil(targetMs / 60000) * 60000;

  for (let offset = 0; offset <= 24 * 60; offset += 1) {
    const candidate = new Date(candidateMs);
    if (isScheduleWithinTehranWindow(candidate)) {
      return candidate.toISOString();
    }
    candidateMs += 60 * 1000;
  }

  return new Date(candidateMs).toISOString();
};

export const useScheduleTime = (scheduleAt?: string) => {
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  useEffect(() => {
    setShowDateTimePicker(Boolean(scheduleAt));
  }, [scheduleAt]);

  const toggleDateTimePicker = (
    onScheduleChange: (scheduleAt?: string) => void
  ) => {
    const newShow = !showDateTimePicker;
    setShowDateTimePicker(newShow);

    if (newShow) {
      onScheduleChange(getDefaultSchedule());
    } else {
      // Clear schedule when disabling
      onScheduleChange(undefined);
    }
  };

  const setDateTimePicker = (
    show: boolean,
    onScheduleChange: (scheduleAt?: string) => void
  ) => {
    setShowDateTimePicker(show);
    if (show) {
      onScheduleChange(getDefaultSchedule());
    } else {
      onScheduleChange(undefined);
    }
  };

  const validateScheduleTime = (scheduleAt?: string): boolean => {
    if (!scheduleAt) return true;

    const nowMs = Date.now();
    const minMs = nowMs + MIN_SCHEDULE_LEAD_TIME_MS;
    const schedMs = new Date(scheduleAt).getTime();

    return (
      !Number.isNaN(schedMs) &&
      schedMs >= minMs &&
      isScheduleWithinTehranWindow(scheduleAt)
    );
  };

  return {
    showDateTimePicker,
    toggleDateTimePicker,
    validateScheduleTime,
    setDateTimePicker,
  };
};
