"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import type { MarketSnapshot, Quote } from "@/lib/market-types";
import { money } from "@/lib/market-catalog";
import { SaveStockButton } from "./SaveStockButton";
import { Change, MiniChart } from "./MarketChart";
export function StockTable({
  snapshot,
  quotes = snapshot.quotes,
  title = "On the radar",
  description = "A curated selection of US-listed companies",
  filters = true,
}: {
  snapshot: MarketSnapshot;
  quotes?: Quote[];
  title?: string;
  description?: string;
  filters?: boolean;
}) {
  const [sector, setSector] = useState("All stocks");
  const [sort, setSort] = useState<"symbol" | "price" | "percent">("symbol");
  const [descending, setDescending] = useState(false);
  const list = quotes
    .filter((quote) => sector === "All stocks" || quote.sector === sector)
    .toSorted((a, b) => {
      if (sort === "symbol")
        return a.symbol.localeCompare(b.symbol) * (descending ? -1 : 1);
      if (a[sort] === null) return 1;
      if (b[sort] === null) return -1;
      return ((a[sort] || 0) - (b[sort] || 0)) * (descending ? -1 : 1);
    });
  function sortBy(key: typeof sort) {
    if (key === sort) setDescending((value) => !value);
    else {
      setSort(key);
      setDescending(key !== "symbol");
    }
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="status-pill">
          {snapshot.mode === "sample" ? "Sample data" : "USD"}
        </span>
      </div>
      {filters && (
        <div className="filter-chips" aria-label="Filter by sector">
          {["All stocks", ...new Set(quotes.map((quote) => quote.sector))].map(
            (item) => (
              <button
                key={item}
                aria-pressed={sector === item}
                onClick={() => setSector(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>
      )}
      <div className="table-scroll">
        <table className="stock-table">
          <caption className="sr-only">
            {snapshot.mode === "sample"
              ? "Illustrative stock prices, not market data."
              : "Finnhub stock quotes; exchange delays may apply. Open a stock for its timestamp."}{" "}
            Select a column heading to sort.
          </caption>
          <thead>
            <tr>
              {(
                [
                  ["symbol", "Company"],
                  ["price", "Price"],
                  ["percent", "Change"],
                ] as const
              ).map(([key, label]) => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={
                    sort === key
                      ? descending
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                >
                  <button onClick={() => sortBy(key)}>
                    {label}
                    <ArrowDownUp size={10} aria-hidden="true" />
                  </button>
                </th>
              ))}
              {snapshot.mode === "sample" && <th scope="col">Sample trend</th>}
              <th scope="col">
                <span className="sr-only">Watchlist</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((quote) => (
              <tr key={quote.symbol}>
                <td>
                  <Link
                    href={"/stocks/" + quote.symbol}
                    className="table-stock"
                  >
                    <span className={`stock-icon ${quote.color}`}>
                      {quote.symbol.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{quote.symbol}</strong>
                      <small>{quote.name}</small>
                    </span>
                  </Link>
                </td>
                <td>{money(quote.price)}</td>
                <td>
                  <Change value={quote.percent} />
                </td>
                {snapshot.mode === "sample" && (
                  <td>
                    {quote.price !== null ? (
                      <MiniChart
                        symbol={quote.symbol}
                        down={(quote.percent || 0) < 0}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td>
                  <SaveStockButton
                    symbol={quote.symbol}
                    company={quote.name}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && (
        <div className="empty-state">
          <p>No stocks in this selection.</p>
        </div>
      )}
    </section>
  );
}
