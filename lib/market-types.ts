export type Instrument = {
  symbol: string;
  name: string;
  sector: string;
  color: string;
  exchange: string;
};
export type Quote = Instrument & {
  // USD is the only supported quote denomination. Never infer it from a ticker.
  currency: "USD" | null;
  source: "provider" | "sample" | "unavailable";
  price: number | null;
  change: number | null;
  percent: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  previousClose: number | null;
  timestamp: number | null;
};
export type MarketSnapshot = {
  mode: "sample" | "market";
  quotes: Quote[];
  fetchedAt: string;
  message: string;
};
export type SavedStock = { symbol: string; company: string };
export type PriceAlert = {
  id: string;
  symbol: string;
  direction: "above" | "below";
  target: number;
  triggeredAt?: string;
};
export type ReaderUser = { id: string; name: string; email: string };
