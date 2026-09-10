"use client";
import { Download, Star } from "lucide-react";
import { useState } from "react";
import { StockTable } from "./StockTable";
import SearchCommand from "./SearchCommand";
import { useWorkspace } from "./WorkspaceProvider";
import type { MarketSnapshot, Quote } from "@/lib/market-types";
import { QUOTE_BATCH_SIZE } from "@/lib/market-symbols";
import { useWatchlistQuotes } from "@/hooks/useWatchlistQuotes";
export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function WatchlistView({ snapshot }: { snapshot: MarketSnapshot }) {
  const { stocks, user } = useWorkspace();
  const [requestedPage, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(stocks.length / QUOTE_BATCH_SIZE));
  const page = Math.min(requestedPage, pageCount - 1);
  const visibleStocks = stocks.slice(
    page * QUOTE_BATCH_SIZE,
    (page + 1) * QUOTE_BATCH_SIZE,
  );
  const { snapshot: current, error } = useWatchlistQuotes(
    visibleStocks.map((stock) => stock.symbol),
    snapshot,
  );
  const quotes = visibleStocks.map<Quote>((stock) => ({
    symbol: stock.symbol,
    color: "ink",
    sector: "Other",
    exchange: "",
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
    ...current.quotes.find((quote) => quote.symbol === stock.symbol),
    name: stock.company,
  }));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A collection of your own</span>
          <h1>Keep your companies close.</h1>
          <p>
            {user
              ? "Your saved stocks, synced to your account."
              : "Saved on this browser. No account needed."}
          </p>
        </div>
        <div className="page-actions">
          {stocks.length > 0 && (
            <button
              className="button"
              onClick={() =>
                downloadJson("stillmark-watchlist.json", {
                  exportedAt: new Date().toISOString(),
                  stocks,
                })
              }
            >
              <Download size={14} aria-hidden="true" />
              Export watchlist
            </button>
          )}
          <SearchCommand label="Find a stock" />
        </div>
      </div>
      {stocks.length > 0 ? (
        <>
          <StockTable
            snapshot={current}
            quotes={quotes}
            title={`Your watchlist · ${stocks.length} stocks`}
            description="Your saved companies. Sort the stocks on this page by selecting a column heading."
            filters={false}
          />
          {pageCount > 1 && (
            <nav className="page-actions mt-6" aria-label="Watchlist pages">
              <button
                className="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous stocks
              </button>
              <p role="status">
                Page {page + 1} of {pageCount} · {page * QUOTE_BATCH_SIZE + 1}–
                {Math.min((page + 1) * QUOTE_BATCH_SIZE, stocks.length)} of{" "}
                {stocks.length} stocks
              </p>
              <button
                className="button"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Next stocks
              </button>
            </nav>
          )}
          {error && (
            <p className="notice mt-6" role="status">
              {error}
            </p>
          )}
        </>
      ) : (
        <section className="panel empty-state">
          <Star size={32} strokeWidth={1.2} aria-hidden="true" />
          <h2>A little curiosity starts here.</h2>
          <p>
            Find a company you’re interested in, open its details, and add it to
            your watchlist. Your collection will be waiting here.
          </p>
          <SearchCommand label="Find your first stock" />
        </section>
      )}
      <p className="data-disclosure">
        {current.message} The visible page refreshes about once a minute while
        this tab is visible. Open a stock for its provider timestamp. Quotes
        outside the sample catalogue are unavailable in demo mode.
      </p>
    </>
  );
}
