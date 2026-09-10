import type { Instrument, Quote } from "./market-types";

export type RawQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};
export type InstrumentProfile = {
  ticker?: string;
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  currency?: string;
};

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const positive = (value: unknown) => {
  const number = finite(value);
  return number !== null && number > 0 ? number : null;
};

// Country, exchange and ticker suffixes do not establish quote currency.
// A profile for a different listing is not evidence about the requested one.
export function usdInstrumentFromProfile(
  symbol: string,
  profile: InstrumentProfile | null,
): Instrument | null {
  if (
    profile?.currency?.trim().toUpperCase() !== "USD" ||
    profile.ticker?.trim().toUpperCase() !== symbol
  )
    return null;
  return {
    symbol,
    name: profile.name?.trim().slice(0, 160) || symbol,
    exchange: profile.exchange?.trim().slice(0, 120) || "",
    sector: profile.finnhubIndustry?.trim().slice(0, 80) || "Other",
    color: "ink",
  };
}

export function unavailableQuote(instrument: Instrument): Quote {
  return {
    ...instrument,
    currency: null,
    source: "unavailable",
    price: null,
    change: null,
    percent: null,
    high: null,
    low: null,
    open: null,
    previousClose: null,
    timestamp: null,
  };
}

// Only call after validating the instrument's USD denomination.
export function providerQuote(
  instrument: Instrument,
  raw: RawQuote | null,
): Quote {
  const price = positive(raw?.c),
    timestamp = positive(raw?.t);
  if (price === null || timestamp === null) return unavailableQuote(instrument);
  return {
    ...instrument,
    currency: "USD",
    source: "provider",
    price,
    change: finite(raw?.d),
    percent: finite(raw?.dp),
    high: positive(raw?.h),
    low: positive(raw?.l),
    open: positive(raw?.o),
    previousClose: positive(raw?.pc),
    timestamp,
  };
}

export function isProviderQuote(quote: Quote | null | undefined): boolean {
  return Boolean(
    quote?.source === "provider" &&
    quote.currency === "USD" &&
    positive(quote.price) !== null &&
    positive(quote.timestamp) !== null,
  );
}

export function quoteDisclosure(quote: Quote): string {
  if (quote.source === "sample")
    return "The quote summary is illustrative demo data in USD. An enabled TradingView chart uses its own provider data, which may be delayed.";
  if (isProviderQuote(quote))
    return "This USD quote is from Finnhub, cached for up to 60 seconds. Exchange delays may apply; check its provider timestamp. An enabled TradingView chart uses its own provider data.";
  return "A verified USD quote is unavailable for this symbol. Unavailable values are shown as a dash; no sample prices have been substituted.";
}
