import "server-only";
import { finnhub, getUsdInstrument, marketApiKey } from "@/lib/market";
import { instruments } from "@/lib/market-catalog";
export interface MarketNewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
  related: string;
  image?: string;
}
export interface StockWithWatchlistStatus {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  isInWatchlist: boolean;
}
export async function getNews(
  symbols?: string[],
): Promise<MarketNewsArticle[]> {
  if (!marketApiKey()) return [];
  try {
    const symbol = symbols?.[0]?.trim().toUpperCase();
    const articles = await finnhub<MarketNewsArticle[]>(
      symbol && /^[A-Z0-9.:-]{1,25}$/.test(symbol) ? "/company-news" : "/news",
      symbol
        ? {
            symbol,
            from: new Date(Date.now() - 5 * 86400000)
              .toISOString()
              .slice(0, 10),
            to: new Date().toISOString().slice(0, 10),
          }
        : { category: "general" },
      300,
    );
    const seen = new Set<string>();
    return articles
      .filter((article) => {
        if (
          !article.headline ||
          !article.datetime ||
          !/^https:\/\//.test(article.url) ||
          seen.has(article.url)
        )
          return false;
        seen.add(article.url);
        return true;
      })
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 12)
      .map((article) => ({ ...article, image: undefined }));
  } catch {
    return [];
  }
}
export async function searchStocks(
  query = "",
): Promise<StockWithWatchlistStatus[]> {
  const cleaned = query.trim().slice(0, 60);
  const local = instruments
    .filter((stock) =>
      (stock.symbol + " " + stock.name)
        .toLowerCase()
        .includes(cleaned.toLowerCase()),
    )
    .map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      type: "Stock",
      isInWatchlist: false,
    }));
  if (!cleaned || !marketApiKey()) return local;
  try {
    const result = await finnhub<{
      result: { symbol: string; description: string; type: string }[];
    }>("/search", { q: cleaned }, 1800);
    // Search itself does not establish currency. Bound profile lookups to eight
    // unique candidates, reuse the 24-hour profile cache, and keep local matches.
    const seen = new Set(local.map((stock) => stock.symbol));
    const candidates = (result.result || [])
      .filter((stock) => {
        if (!/^[A-Z0-9.:-]{1,25}$/.test(stock.symbol) || seen.has(stock.symbol))
          return false;
        seen.add(stock.symbol);
        return true;
      })
      .slice(0, 8);
    const verified = await Promise.all(
      candidates.map(async (stock) => {
        const instrument = await getUsdInstrument(stock.symbol);
        return instrument
          ? {
              symbol: instrument.symbol,
              name: instrument.name,
              exchange: instrument.exchange,
              type: stock.type || "Stock",
              isInWatchlist: false,
            }
          : null;
      }),
    );
    return [...local, ...verified.filter((stock) => stock !== null)].slice(
      0,
      15,
    );
  } catch {
    return local;
  }
}
