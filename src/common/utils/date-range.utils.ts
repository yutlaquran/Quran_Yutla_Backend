import { BadRequestException } from '@nestjs/common';

export enum TimePeriod {
  THIS_DAY = 'this day',
  TOMORROW = 'tomorrow',
  THIS_WEEK = 'this week',
  NEXT_WEEK = 'next week',
  ALL = 'all',
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get date range for a given period
 * @param period - The period to filter by
 * @returns Object with start and end dates
 */
export function getDateRangeForPeriod(period: TimePeriod): DateRange {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case TimePeriod.THIS_DAY:
      // Start of today to end of today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case TimePeriod.TOMORROW:
      // Start of tomorrow to end of tomorrow
      startDate.setDate(now.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case TimePeriod.THIS_WEEK:
      // Start of today to today + 6 days
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case TimePeriod.NEXT_WEEK:
      // Start of today + 7 days to today + 13 days (7 + 6)
      startDate.setDate(now.getDate() + 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() + 13);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      throw new BadRequestException('Invalid period specified');
  }

  return { startDate, endDate };
}

/**
 * Get current week date range (Sunday to Saturday)
 * @returns Object with start and end dates for current week
 */
export function getCurrentWeekRange(): DateRange {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
  endOfWeek.setHours(23, 59, 59, 999);

  return { startDate: startOfWeek, endDate: endOfWeek };
}

/**
 * Get start of today
 * @returns Date object representing start of today
 */
export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
