import "server-only";
import { cache } from "react";
import { instruments, sampleSnapshot } from "./market-catalog";
import type { Instrument, MarketSnapshot, Quote } from "./market-types";
import { normaliseSymbol } from "./market-symbols";
import {
  providerQuote,
  unavailableQuote,
  usdInstrumentFromProfile,
  type InstrumentProfile,
  type RawQuote,
} from "./market-integrity";
export function marketApiKey() {
  return process.env.MARKET_DATA_MODE === "sample"
    ? undefined
    : process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
}
export async function finnhub<T>(
  endpoint: string,
  params: Record<string, string> = {},
  seconds = 60,
): Promise<T> {
  const key = marketApiKey();
  if (!key) throw new Error("Market data is not configured");
  const url = new URL("https://finnhub.io/api/v1" + endpoint);
  Object.entries(params).forEach(([name, value]) =>
    url.searchParams.set(name, value),
  );
  const response = await fetch(url, {
    headers: { "X-Finnhub-Token": key },
    next: { revalidate: seconds },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("Market provider unavailable");
  const data = await response.json();
  if (data?.error) throw new Error("Market provider unavailable");
  return data as T;
}
// The curated catalogue lists verified USD-denominated US listings. For every
// other symbol, validate the exact listing against a cached provider profile.
export const getUsdInstrument = cache(
  async (symbol: string): Promise<Instrument | null> => {
    if (normaliseSymbol(symbol) !== symbol) return null;
    const known = instruments.find(
      (instrument) => instrument.symbol === symbol,
    );
    if (known) return known;
    if (!marketApiKey()) return null;
    try {
      const profile = await finnhub<InstrumentProfile>(
        "/stock/profile2",
        { symbol },
        86400,
      );
      return usdInstrumentFromProfile(symbol, profile);
    } catch {
      return null;
    }
  },
);

const getProviderQuote = cache(async (symbol: string): Promise<Quote> => {
  const instrument = await getUsdInstrument(symbol);
  if (!instrument)
    return unavailableQuote({
      symbol,
      name: symbol,
      sector: "Other",
      color: "ink",
      exchange: "",
    });
  try {
    return providerQuote(
      instrument,
      await finnhub<RawQuote>("/quote", { symbol }),
    );
  } catch {
    return unavailableQuote(instrument);
  }
});

export const getMarketSnapshot = cache(async (): Promise<MarketSnapshot> => {
  if (!marketApiKey()) return sampleSnapshot();
  const quotes = await Promise.all(
    instruments.map((instrument) => getProviderQuote(instrument.symbol)),
  );
  if (quotes.every((quote) => quote.price === null))
    return sampleSnapshot(
      "Market data is unavailable. Showing an illustrative demo; these are not current prices.",
    );
  return {
    mode: "market",
    quotes,
    fetchedAt: new Date().toISOString(),
    message:
      "Quotes via Finnhub, cached for up to 60 seconds. Exchange delays may apply. See each quote’s provider timestamp.",
  };
});
export const getQuote = cache(async (symbol: string): Promise<Quote | null> => {
  if (normaliseSymbol(symbol) !== symbol) return null;
  if (!marketApiKey())
    return (
      sampleSnapshot().quotes.find((quote) => quote.symbol === symbol) || null
    );
  // No overview request: an unrelated outage must not replace or mislabel a
  // successful custom quote. Provider failures here never become sample prices.
  const quote = await getProviderQuote(symbol);
  return quote.source === "provider" ? quote : null;
});

// A selected-symbol request never fetches unrelated overview stocks. Custom
// symbols use their own profile to verify currency before requesting a quote.
// The public route validates and caps each batch before calling this function.
export async function getSelectedQuotes(
  symbols: string[],
): Promise<MarketSnapshot> {
  if (!marketApiKey()) {
    const sample = sampleSnapshot();
    return {
      ...sample,
      quotes: sample.quotes.filter((quote) => symbols.includes(quote.symbol)),
    };
  }
  const quotes = await Promise.all(symbols.map(getProviderQuote));
  return {
    mode: "market",
    quotes,
    fetchedAt: new Date().toISOString(),
    message:
      "USD quotes via Finnhub, cached for up to 60 seconds. Exchange delays may apply. Unsupported currencies, unverified listings and unavailable quotes are shown as a dash.",
  };
}
