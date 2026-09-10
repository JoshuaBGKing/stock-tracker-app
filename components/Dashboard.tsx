"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Info,
  Leaf,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
} from "lucide-react";
import { MarketChart, Change, MiniChart } from "./MarketChart";
import { StockTable } from "./StockTable";
import { useWorkspace } from "./WorkspaceProvider";
import type { MarketSnapshot } from "@/lib/market-types";
import type { MarketNewsArticle } from "@/lib/actions/finnhub.actions";
import { money } from "@/lib/market-catalog";

export function NewsPreview({ articles }: { articles: MarketNewsArticle[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>The reading room</h2>
        <Link className="text-link" href="/news">
          Explore <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </div>
      {articles.length ? (
        articles.slice(0, 3).map((article) => (
          <a
            className="news-item"
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="news-meta">
              {article.source} <span>·</span>{" "}
              {new Date(article.datetime * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
            </span>
            <h3>{article.headline}</h3>
            <span className="external-label">
              Read at source ↗ (opens new tab)
            </span>
          </a>
        ))
      ) : (
        <>
          <div className="editorial-art" aria-hidden="true">
            <span />
          </div>
          <Link className="news-item" href="/learn">
            <span className="news-meta">STILLMARK FIELD GUIDE · 01</span>
            <h3>
              A stock price is a starting point.
              <br />
              Here’s what to look at next.
            </h3>
            <span className="external-label">Explore the basics →</span>
          </Link>
          <p className="chart-note">
            News feed unavailable. Explore our educational guide instead.
          </p>
        </>
      )}
    </section>
  );
}
export function Dashboard({
  snapshot,
  articles,
}: {
  snapshot: MarketSnapshot;
  articles: MarketNewsArticle[];
}) {
  const { stocks } = useWorkspace();
  const [selected, setSelected] = useState(snapshot.quotes[0].symbol);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const quote =
    snapshot.quotes.find((item) => item.symbol === selected) ||
    snapshot.quotes[0];
  const sample = snapshot.mode === "sample";
  const valid = snapshot.quotes.filter((item) => item.percent !== null);
  const rising = valid.filter((item) => item.percent! > 0).length;
  const leader = valid.toSorted((a, b) => b.percent! - a.percent!)[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="status-dot" />
            Your daily perspective
          </span>
          <h1>The market, in perspective.</h1>
          <p>A quieter place to follow what matters. Make yourself at home.</p>
        </div>
        <button
          className="button"
          onClick={() => startTransition(() => router.refresh())}
          disabled={pending}
        >
          <RefreshCw
            size={13}
            className={pending ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {pending ? "Refreshing…" : "Refresh overview"}
        </button>
      </div>
      <div className="segment-row">
        <nav className="page-tabs" aria-label="Market views">
          <Link href="/" className="active" aria-current="page">
            Market overview
          </Link>
          <Link href="/watchlist">My watchlist</Link>
          <Link href="/news">Latest news</Link>
        </nav>
        <span className="status-pill">
          <span className="status-dot" />
          {sample ? "Demo workspace" : "Provider quotes"}
        </span>
      </div>
      <div className="quote-grid">
        {snapshot.quotes.slice(0, 4).map((stock) => (
          <button
            key={stock.symbol}
            className="quote-card text-left"
            onClick={() => setSelected(stock.symbol)}
            aria-pressed={selected === stock.symbol}
            aria-label={`Show ${stock.name} overview, ${money(stock.price)}`}
          >
            <div className="quote-top">
              <span className={`stock-icon ${stock.color}`}>
                {stock.symbol.slice(0, 1)}
              </span>
              <span>{stock.name}</span>
              <small>{stock.symbol}</small>
            </div>
            <div className="quote-value">{money(stock.price)}</div>
            <div className="quote-bottom">
              <span>
                <Change value={stock.percent} />
                <small>{sample ? "sample" : "session"}</small>
              </span>
              {sample && (
                <MiniChart
                  symbol={stock.symbol}
                  down={(stock.percent || 0) < 0}
                />
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        <MarketChart key={quote.symbol} quote={quote} sample={sample} />
        <div className="right-stack">
          <section className="panel insight-panel">
            <div className="insight-top">
              <span className="flex items-center gap-2">
                <Leaf size={14} strokeWidth={1.6} aria-hidden="true" />
                The bigger picture
              </span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </div>
            <h2 className="insight-title">
              {rising > valid.length / 2
                ? "A little green.\nA wider perspective."
                : "Find clarity\nbeyond the noise."}
            </h2>
            <p>
              {sample
                ? "In this illustrative snapshot, "
                : "Among the available quotes, "}
              {rising} of {valid.length} stocks are up against their previous
              close.
              {leader
                ? ` ${leader.name} has the highest percentage price change in this selection, measured against the previous close.`
                : " Quotes are currently unavailable."}
            </p>
            <Link className="text-link" href="/learn">
              Put the numbers in context{" "}
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <div className="insight-rule">
              <ShieldCheck size={12} aria-hidden="true" />
              {sample
                ? "Sample observations · not investment advice"
                : "Calculated from quotes · not investment advice"}
            </div>
          </section>
          <section className="panel watch-compact">
            <div className="panel-heading">
              <h2>
                Your watchlist{" "}
                <span className="text-muted-foreground font-normal text-[10px] ml-1">
                  {stocks.length}
                </span>
              </h2>
              <Link
                className="text-link"
                href="/watchlist"
                aria-label="Open your watchlist"
              >
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {stocks.length ? (
              stocks.slice(0, 3).map((stock) => {
                const item = snapshot.quotes.find(
                  (q) => q.symbol === stock.symbol,
                );
                return (
                  <Link
                    className="compact-stock"
                    key={stock.symbol}
                    href={"/stocks/" + stock.symbol}
                  >
                    <span className={`stock-icon ${item?.color || "ink"}`}>
                      {stock.symbol.slice(0, 1)}
                    </span>
                    <span className="stock-name">
                      <strong>{stock.symbol}</strong>
                      <small>{stock.company}</small>
                    </span>
                    <span className="compact-price">
                      <strong>{money(item?.price ?? null)}</strong>
                      <small>
                        <Change value={item?.percent ?? null} />
                      </small>
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="watchlist-empty-small">
                <p>
                  Keep your companies close. Tap the star next to any stock to
                  save it here.
                </p>
                <Link className="text-link" href="/watchlist">
                  <Star size={12} aria-hidden="true" />
                  Build your watchlist <Plus size={12} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
      <div className="lower-grid">
        <StockTable
          snapshot={snapshot}
          quotes={snapshot.quotes.slice(0, 6)}
          filters={false}
        />
        <NewsPreview articles={articles} />
      </div>
      <p className="data-disclosure">
        <Info size={13} aria-hidden="true" />
        <span>
          {snapshot.message} Stillmark is a research workspace, not a broker or
          investment adviser.{" "}
          <Link href={sample ? "/" : "/?mode=sample"} className="underline">
            {sample ? "Check provider data" : "Explore sample workspace"}
          </Link>
        </span>
      </p>
    </>
  );
}
