"use client";
import { useEffect, useState } from "react";
import type { MarketSnapshot } from "@/lib/market-types";

export function useWatchlistQuotes(symbols: string[], initial: MarketSnapshot) {
  const key = symbols.join(",");
  const [result, setResult] = useState<{
    key: string;
    snapshot: MarketSnapshot;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let running = false;
    async function refresh() {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      try {
        const response = await fetch(
          `/api/market?symbols=${encodeURIComponent(key)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Quotes unavailable");
        const snapshot: MarketSnapshot = await response.json();
        if (!controller.signal.aborted) setResult({ key, snapshot, error: "" });
      } catch {
        if (!controller.signal.aborted)
          setResult((previous) => ({
            key,
            snapshot: previous?.key === key ? previous.snapshot : initial,
            error:
              "Quote refresh is unavailable. Displayed prices may be out of date; check the stock details before relying on them.",
          }));
      } finally {
        running = false;
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [key, initial]);
  return result?.key === key ? result : { snapshot: initial, error: "" };
}
