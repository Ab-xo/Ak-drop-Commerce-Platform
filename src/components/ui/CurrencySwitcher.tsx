"use client";

import { Globe2 } from "lucide-react";
import { DISPLAY_CURRENCIES } from "@/lib/currency";
import { useCurrencyStore, useDisplayCurrency } from "@/store/currencyStore";

export default function CurrencySwitcher() {
  const currency = useDisplayCurrency();
  const setCurrency = useCurrencyStore((state) => state.setCurrency);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe2 aria-hidden="true" size={16} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">Display currency</span>
          <span className="block text-xs text-muted-foreground">Illustrative preview</span>
        </span>
      </div>
      <label className="sr-only" htmlFor="display-currency">Display currency</label>
      <select
        id="display-currency"
        value={currency}
        onChange={(event) => {
          const selected = DISPLAY_CURRENCIES.find((option) => option === event.target.value);
          if (selected) setCurrency(selected);
        }}
        className="min-w-16 cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {DISPLAY_CURRENCIES.map((option) => (
          <option key={option} value={option} className="bg-background text-foreground">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
