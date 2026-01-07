/*
File: dateTimeFormatter.ts
Description: This module provides utility functions for working with date and time.
*/

/*
Function: currentDateTimeToUTC
Description: Converts the given date and time to a UTC formatted string.
Parameters:
  dateTime: A JavaScript Date object representing the date and time to convert.
Returns:
  A string representing the given date and time in UTC format (YYYY-MM-DDTHH:MM:SSZ).
*/
const currentDateTimeToUTC = (dateTime: Date): string => {
  const year = dateTime.getUTCFullYear();
  const month = String(dateTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateTime.getUTCDate()).padStart(2, '0');
  const hours = String(dateTime.getUTCHours()).padStart(2, '0');
  const minutes = String(dateTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(dateTime.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T ${hours}:${minutes}:${seconds}Z`;
};

/*
Function: getCurrentUTCDateTime
Description: Retrieves the current date and time in UTC format.
Returns:
  A string representing the current date and time in UTC format (YYYY-MM-DDTHH:MM:SSZ).
*/
export const getCurrentUTCDateTime = (): string => {
  return currentDateTimeToUTC(new Date());
};
export const getCurrentDateTimeInIST = (): string => {
  const now = new Date();

  // Create a new Date object for IST by adding the IST offset
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(now.getTime() + istOffset);

  // Get year, month, day, hours, minutes, and seconds from the IST date
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based, so we add 1
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
export const getCurrentDateInIST = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(now.getTime() + istOffset);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based, so we add 1
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const subtractDateTimeFromStringDate = (
  dateStr: string,
  days = 0,
  months = 0,
  years = 0
): string => {
  const date = new Date(dateStr);

  // Subtract days, months, and years from the date
  date.setDate(date.getDate() - days);
  date.setMonth(date.getMonth() - months);
  date.setFullYear(date.getFullYear() - years);

  // Format the date into 'YYYY-MM-DD'
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`; // Return new date in YYYY-MM-DD format
};
