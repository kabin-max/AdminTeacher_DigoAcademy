/**
 * Format an integer amount of minor units (cents) as a localized currency string.
 * Framework-free so it is safe on both server and client.
 */
export function formatMoney(amountCents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      amountCents / 100
    );
  } catch {
    // Unknown currency code — fall back to a plain number with the code appended.
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}
