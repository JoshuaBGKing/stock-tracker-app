import type { PriceAlert, MarketSnapshot } from "./market-types";
export function triggeredAlerts(
  alerts: PriceAlert[],
  snapshot: MarketSnapshot,
  now = Date.now(),
) {
  if (snapshot.mode !== "market") return [];
  return alerts.filter((alert) => {
    if (alert.triggeredAt) return false;
    const quote = snapshot.quotes.find((item) => item.symbol === alert.symbol);
    if (
      !quote ||
      quote.source !== "provider" ||
      quote.currency !== "USD" ||
      quote.price === null ||
      !Number.isFinite(quote.price) ||
      quote.price <= 0 ||
      !quote.timestamp ||
      !Number.isFinite(quote.timestamp)
    )
      return false;
    const age = now - quote.timestamp * 1000;
    if (age < -60000 || age > 300000) return false;
    return alert.direction === "above"
      ? quote.price >= alert.target
      : quote.price <= alert.target;
  });
}
