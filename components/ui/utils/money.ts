/**
 * Format an integer amount of minor units (cents) as a localized currency string.
 * Framework-free so it is safe on both server and client.
 */
export function formatMoney(amountCents: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-NP', { 
      style: 'currency', 
      currency: 'NPR',
      maximumFractionDigits: 0 
    }).format(
      amountCents / 100
    );
  } catch {
    // Unknown currency code — fall back to a plain number with the code appended.
    return `Rs. ${Math.round(amountCents / 100)}`;
  }
}
