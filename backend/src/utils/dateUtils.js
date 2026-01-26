import { startOfDay, endOfDay, addHours, subHours } from 'date-fns';

/**
 * Utility to handle Indonesia/Jakarta (UTC+7) timezone logic.
 * This is crucial for accounting reports to align with local business days.
 */

const JAKARTA_OFFSET = 7;

/**
 * Converts a date input (string or Date) to a Date object representing
 * the START of that day in Jakarta (00:00:00.000 WIB).
 * @param {string|Date} dateInput 
 * @returns {Date} UTC Date object
 */
export const getJakartaStartOfDay = (dateInput) => {
  const date = new Date(dateInput);
  // If we just do new Date("2026-01-26"), it's 2026-01-26 00:00 UTC.
  // In Jakarta this is 07:00 WIB.
  // We want it to be 2026-01-26 00:00 WIB, which is 2026-01-25 17:00 UTC.
  
  // Set to local midnight (system timezone)
  const local = startOfDay(date);
  
  // If the input was a string like "2026-01-26" and we are on a UTC server:
  // We need to shift it to 17:00 UTC of the previous day.
  // But usually, dateInput comes from frontend as ISO string.
  
  // Robust way: Treat the date portion as Jakarta date.
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  
  // Create a date that is y-m-d 00:00:00 in Jakarta
  // 00:00 WIB = 17:00 UTC of the previous day
  const jakartaStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  return subHours(jakartaStart, JAKARTA_OFFSET);
};

/**
 * Converts a date input (string or Date) to a Date object representing
 * the END of that day in Jakarta (23:59:59.999 WIB).
 * @param {string|Date} dateInput 
 * @returns {Date} UTC Date object
 */
export const getJakartaEndOfDay = (dateInput) => {
  const start = getJakartaStartOfDay(dateInput);
  return endOfDay(addHours(start, JAKARTA_OFFSET));
};

/**
 * Normalizes a Date object to the start of its day in Jakarta.
 * Useful for grouping transactions by day.
 * @param {Date} date 
 * @returns {Date}
 */
export const normalizeToJakartaStartOfDay = (date) => {
  // If it's already a Date object from a transaction:
  // e.g. 2026-01-26 02:27 WIB = 2026-01-25 19:27 UTC
  // We want to return 2026-01-26 00:00 WIB = 2026-01-25 17:00 UTC
  
  const shifted = addHours(date, JAKARTA_OFFSET);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  
  return subHours(new Date(Date.UTC(y, m, d, 0, 0, 0, 0)), JAKARTA_OFFSET);
};

export const getJakartaNow = () => {
  return new Date(); // Standard UTC now is fine for storage as transactionDate
};
