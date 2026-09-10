import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Bell, Info } from "lucide-react";
import { getQuote } from "@/lib/market";
import { isProviderQuote, quoteDisclosure } from "@/lib/market-integrity";
import { getNews } from "@/lib/actions/finnhub.actions";
import { MarketChart } from "@/components/MarketChart";
import { SaveStockButton } from "@/components/SaveStockButton";
import TradingViewWidget from "@/components/TradingViewWidget";
import { NewsPreview } from "@/components/Dashboard";
import { ResearchInsight } from "@/components/ResearchInsight";
import { insightsAvailable } from "@/lib/insights";
import { isIsolatedTestEnvironment } from "@/lib/test-mode";
type Props = { params: Promise<{ symbol: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} overview` };
}
export default async function StockPage({ params }: Props) {
  const symbol = (await params).symbol.trim().toUpperCase();
  if (!/^[A-Z0-9.:-]{1,25}$/.test(symbol)) notFound();
  const [quote, articles] = await Promise.all([
    getQuote(symbol),
    getNews([symbol]),
  ]);
  if (!quote)
    return (
      <section className="panel empty-state">
        <h1>{symbol}</h1>
        <p className="mt-5">
          A verified USD quote is not available for this symbol right now.
          Stillmark supports USD-denominated listings only. The listing may use
          another currency or be temporarily unavailable from the provider.
        </p>
        <Link href="/" className="button">
          Back to market overview
        </Link>
      </section>
    );
  const sample = quote.source === "sample";
  const testMode = isIsolatedTestEnvironment();
  return (
    <>
      <Link href="/" className="text-link mb-6">
        <ArrowLeft size={13} aria-hidden="true" />
        Market overview
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {quote.exchange} · {quote.sector}
          </span>
          <h1>
            {quote.name}{" "}
            <span className="text-muted-foreground font-normal text-lg ml-3">
              {symbol}
            </span>
          </h1>
          <p>A closer look at the company on your radar.</p>
        </div>
        <div className="page-actions">
          <SaveStockButton symbol={symbol} company={quote.name} />
          <Link className="button primary" href={"/alerts?symbol=" + symbol}>
            <Bell size={14} aria-hidden="true" />
            Create price alert
          </Link>
        </div>
      </div>
      <div className="stock-detail-grid">
        <div className="detail-stack">
          <MarketChart quote={quote} sample={sample} />
          <ResearchInsight
            symbol={symbol}
            enabled={insightsAvailable()}
            dataAvailable={testMode || isProviderQuote(quote)}
            testMode={testMode}
          />
          <section className="panel settings-section">
            <TradingViewWidget
              title="Interactive chart"
              scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
              height={500}
              config={{
                autosize: true,
                symbol,
                interval: "D",
                timezone: "America/New_York",
                style: "2",
                locale: "en",
                allow_symbol_change: false,
                calendar: false,
                support_host: "https://www.tradingview.com",
              }}
            />
          </section>
        </div>
        <div className="detail-stack">
          <section className="panel insight-panel">
            <span className="insight-top">Before the next move</span>
            <h2 className="insight-title">
              A price is only part of the story.
            </h2>
            <p>
              Read company filings, understand the business, and consider your
              own circumstances. A watchlist is a research tool, not a
              recommendation.
            </p>
            <a
              className="text-link"
              href="https://www.sec.gov/edgar/search/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore SEC filings (new tab)
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </section>
          <NewsPreview articles={articles} />
        </div>
      </div>
      <p className="data-disclosure">
        <Info size={13} aria-hidden="true" />
        {quoteDisclosure(quote)} No orders can be placed through Stillmark.
      </p>
    </>
  );
}
