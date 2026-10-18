"use client";

import { Globe2 } from "lucide-react";
import { DISPLAY_CURRENCIES } from "@/lib/currency";
import { useCurrencyStore, useDisplayCurrency } from "@/store/currencyStore";

type Props = { appearance?: "default" | "dark" };

export default function CurrencySwitcher({ appearance = "default" }: Props) {
  const currency = useDisplayCurrency();
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const isDark = appearance === "dark";

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-border bg-background/60"}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex size-8 items-center justify-center rounded-lg ${isDark ? "bg-purple-400/10 text-purple-300" : "bg-primary/10 text-primary"}`}>
          <Globe2 aria-hidden="true" size={16} />
        </span>
        <span>
          <span className={`block text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>Display currency</span>
          <span className={`block text-xs ${isDark ? "text-white/50" : "text-muted-foreground"}`}>Illustrative preview</span>
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
        className={`min-w-16 cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${isDark ? "border-white/10 bg-[#17131e] text-white" : "border-border bg-card text-foreground"}`}
      >
        {DISPLAY_CURRENCIES.map((option) => (
          <option key={option} value={option} className={isDark ? "bg-[#17131e] text-white" : "bg-background text-foreground"}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
