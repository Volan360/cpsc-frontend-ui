/**
 * Returns today's date for use as default date picker values
 */
export function getDefaultDate(): Date {
  return new Date();
}

/**
 * Returns today's date for use as max date constraint (prevents future dates)
 */
export function getMaxDate(): Date {
  return new Date();
}

/**
 * Converts a Date object to a UNIX timestamp (seconds since epoch)
 */
export function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Formats a UNIX timestamp as a localized date string (without time)
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Formats a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
