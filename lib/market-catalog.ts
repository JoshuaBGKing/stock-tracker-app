import type { Instrument, MarketSnapshot } from "./market-types";
export const instruments: Instrument[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    sector: "Technology",
    color: "ink",
    exchange: "NASDAQ",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    sector: "Technology",
    color: "green",
    exchange: "NASDAQ",
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    sector: "Technology",
    color: "blue",
    exchange: "NASDAQ",
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    sector: "Consumer",
    color: "orange",
    exchange: "NASDAQ",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet",
    sector: "Technology",
    color: "blue",
    exchange: "NASDAQ",
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    sector: "Consumer",
    color: "red",
    exchange: "NASDAQ",
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    sector: "Financials",
    color: "ink",
    exchange: "NYSE",
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    color: "red",
    exchange: "NYSE",
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil",
    sector: "Energy",
    color: "orange",
    exchange: "NYSE",
  },
  {
    symbol: "V",
    name: "Visa",
    sector: "Financials",
    color: "blue",
    exchange: "NYSE",
  },
];
// Invented design fixtures, never represented as historical or current prices.
const samplePrices = [
  229.98, 138.85, 428.76, 225.94, 196.0, 394.74, 259.16, 148.1, 109.2, 322.45,
];
const sampleChanges = [
  1.87, 3.12, 0.64, -0.82, 1.24, -2.16, 0.92, -0.48, 1.35, 0.76,
];
export function sampleSnapshot(
  message = "Illustrative prices and charts. This workspace is a demo, not current market data.",
): MarketSnapshot {
  return {
    mode: "sample",
    fetchedAt: "",
    message,
    quotes: instruments.map((stock, i) => {
      const price = samplePrices[i],
        percent = sampleChanges[i];
      const previousClose = price / (1 + percent / 100);
      return {
        ...stock,
        currency: "USD" as const,
        source: "sample" as const,
        price,
        percent,
        change: price - previousClose,
        previousClose,
        open: previousClose * 1.001,
        high: price * 1.012,
        low: previousClose * 0.993,
        timestamp: null,
      };
    }),
  };
}
export function sampleSeries(symbol: string, range = "1D") {
  const seed = [...(symbol + range)].reduce(
    (value, letter) => value + letter.charCodeAt(0),
    0,
  );
  return Array.from(
    { length: 64 },
    // Quantise fixtures so Node and browser trigonometric rounding produces
    // byte-identical SVG coordinates during hydration.
    (_, i) =>
      Number(
        (
          42 +
          i * 0.65 +
          Math.sin(i * 0.85 + seed) * 4 +
          Math.sin(i * 0.29) * 8 +
          Math.cos(i * 1.8) * 2.5
        ).toFixed(4),
      ),
  );
}
export const money = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value);
export const percentage = (value: number | null) =>
  value === null
    ? "Unavailable"
    : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
