/**
 * Minimal RFC-4180 CSV builder (framework-free). Fields containing a comma,
 * quote, or newline are wrapped in quotes with embedded quotes doubled.
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    const s = value == null ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
}
