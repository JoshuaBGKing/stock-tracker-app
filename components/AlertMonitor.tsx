"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWorkspace } from "./WorkspaceProvider";
import { triggeredAlerts } from "@/lib/alert-rules";
import type { MarketSnapshot } from "@/lib/market-types";
import { QUOTE_BATCH_SIZE } from "@/lib/market-symbols";
export function AlertMonitor() {
  const { alerts, markTriggered } = useWorkspace();
  const latest = useRef({ alerts, markTriggered });
  useEffect(() => {
    latest.current = { alerts, markTriggered };
  }, [alerts, markTriggered]);
  const hasActive = alerts.some((alert) => !alert.triggeredAt);
  useEffect(() => {
    if (!hasActive) return;
    let stopped = false,
      running = false;
    const controller = new AbortController();
    async function check() {
      if (document.visibilityState !== "visible" || running) return;
      running = true;
      try {
        const symbols = [
          ...new Set(
            latest.current.alerts
              .filter((alert) => !alert.triggeredAt)
              .map((alert) => alert.symbol),
          ),
        ];
        const snapshot: MarketSnapshot = {
          mode: "market",
          quotes: [],
          fetchedAt: "",
          message: "",
        };
        for (let index = 0; index < symbols.length; index += QUOTE_BATCH_SIZE) {
          const batch = symbols
            .slice(index, index + QUOTE_BATCH_SIZE)
            .join(",");
          const response = await fetch(
            `/api/market?symbols=${encodeURIComponent(batch)}`,
            { signal: controller.signal },
          );
          if (!response.ok) continue;
          const data: MarketSnapshot = await response.json();
          if (data.mode === "market") snapshot.quotes.push(...data.quotes);
        }
        if (stopped) return;
        const matches = triggeredAlerts(latest.current.alerts, snapshot);
        if (matches.length) {
          const commit = () => {
            if (stopped) return;
            const result = latest.current.markTriggered(
              matches.map((item) => item.id),
            );
            // Never announce a trigger until its one-shot marker is saved.
            // Failed writes keep alerts active and retry on the next check.
            if (!result.success) return;
            result.triggered.forEach((alert) =>
              toast.info(
                `${alert.symbol} is at or ${alert.direction} $${alert.target.toFixed(2)}`,
                {
                  id: `price-alert-${alert.id}`,
                  description:
                    "Based on the latest available quote. Verify the price with your provider.",
                  duration: 10000,
                },
              ),
            );
          };
          // Coordinate visible tabs where Web Locks are supported. The commit
          // re-reads storage so another tab's saved marker is respected.
          if (navigator.locks)
            await navigator.locks.request("stillmark-alert-triggers", commit);
          else commit();
        }
      } catch {
        /* Retry at the next interval; never trigger from unavailable data. */
      } finally {
        running = false;
      }
    }
    void check();
    const timer = window.setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [hasActive]);
  return null;
}
