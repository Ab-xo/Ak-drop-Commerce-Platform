"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DisplayCurrency } from "@/lib/currency";

type CurrencyState = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
  setHydrated: (hydrated: boolean) => void;
  hydrated: boolean;
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "USD",
      hydrated: false,
      setCurrency: (currency) => set({ currency }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "ak-drop-display-currency",
      version: 2,
      migrate: (persistedState, version) => {
        if (
          version < 2 &&
          typeof persistedState === "object" &&
          persistedState !== null &&
          "currency" in persistedState &&
          persistedState.currency === "ETB"
        ) {
          return { ...persistedState, currency: "USD" };
        }
        return persistedState;
      },
      partialize: (state) => ({ currency: state.currency }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

const subscribeToHydration = () => () => {};
const getHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function useDisplayCurrency(): DisplayCurrency {
  const currency = useCurrencyStore((state) => state.currency);
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  return mounted ? currency : "USD";
}
