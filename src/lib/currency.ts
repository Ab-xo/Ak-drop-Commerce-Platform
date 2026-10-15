export const DISPLAY_CURRENCIES = ["ETB", "USD", "EUR", "GBP", "CAD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const currencyLocales: Record<DisplayCurrency, string> = {
  ETB: "en-ET",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  CAD: "en-CA",
};

// Illustrative portfolio rates only; production rates must come from a trusted FX source.
export const ETB_PER_DISPLAY_UNIT: Record<DisplayCurrency, number> = {
  ETB: 1,
  USD: 155,
  EUR: 170,
  GBP: 200,
  CAD: 112,
};

export function formatEtb(amount: number) {
  return `ETB ${new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 }).format(amount)}`;
}

export function formatDisplayCurrency(amountInEtb: number, currency: DisplayCurrency) {
  const amount = amountInEtb / ETB_PER_DISPLAY_UNIT[currency];
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    currencyDisplay: currency === "ETB" ? "code" : "symbol",
    maximumFractionDigits: 2,
  }).format(amount);
}
