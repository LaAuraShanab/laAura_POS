// Israeli New Shekel. The ₪ glyph is present in the app's Inter/Cairo fonts.
export const CURRENCY_SYMBOL = "₪";

export function formatCurrency(value: number): string {
  return `${CURRENCY_SYMBOL}${value.toFixed(2)}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
