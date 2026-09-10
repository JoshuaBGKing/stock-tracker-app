"use client";
import { useId, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { money, percentage, sampleSeries } from "@/lib/market-catalog";
import type { Quote } from "@/lib/market-types";
import { SaveStockButton } from "@/components/SaveStockButton";
export function Change({ value }: { value: number | null }) {
  return (
    <span className={`change ${value !== null && value < 0 ? "down" : ""}`}>
      {value !== null &&
        (value < 0 ? (
          <ArrowDownRight size={12} aria-hidden="true" />
        ) : (
          <ArrowUpRight size={12} aria-hidden="true" />
        ))}
      {percentage(value)}
    </span>
  );
}
export function MiniChart({
  symbol,
  down = false,
}: {
  symbol: string;
  down?: boolean;
}) {
  const points = sampleSeries(symbol)
    .map(
      (value, i) =>
        `${i * 1.3},${down ? (value - 20) / 3 : 33 - (value - 20) / 3}`,
    )
    .join(" ");
  return (
    <svg
      className="mini-chart"
      viewBox="0 0 83 34"
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        stroke={down ? "var(--negative)" : "var(--chart-line)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function MarketChart({
  quote,
  sample,
}: {
  quote: Quote;
  sample: boolean;
}) {
  const [range, setRange] = useState("1D");
  const [active, setActive] = useState<number | null>(null);
  const gradient = useId().replace(/:/g, "");
  const values = sampleSeries(quote.symbol, range).map(
    (value) => (quote.price || 100) * (0.96 + value / 1700),
  );
  const min = Math.min(...values) * 0.998,
    max = Math.max(...values) * 1.002;
  const point = (value: number, i: number) => [
    (i / (values.length - 1)) * 640,
    180 - ((value - min) / (max - min)) * 160,
  ];
  const points = values.map((value, i) => point(value, i).join(",")).join(" ");
  const line = values
    .map((value, i) => `${i ? "L" : "M"}${point(value, i).join(" ")}`)
    .join(" ");
  const data = [0, 9, 18, 27, 36, 45, 54, 63];
  return (
    <section
      className="panel chart-panel"
      aria-label={quote.name + " price overview"}
    >
      <div className="panel-heading">
        <div className="chart-symbol">
          <span className={`stock-icon ${quote.color}`}>
            {quote.symbol.slice(0, 1)}
          </span>
          <div>
            <h2>{quote.name}</h2>
            <p>
              {quote.symbol} <span aria-hidden="true">·</span> {quote.exchange}
            </p>
          </div>
        </div>
        <SaveStockButton symbol={quote.symbol} company={quote.name} compact />
      </div>
      <div className="chart-quote">
        <div>
          <div className="large-value">
            {active !== null && sample
              ? money(values[active])
              : money(quote.price)}
          </div>
          <Change value={quote.percent} />
          <span className="text-[9px] text-muted-foreground ml-2">
            {sample ? "Sample session" : "vs. previous close"}
          </span>
        </div>
        {sample && (
          <div className="range-buttons" aria-label="Illustrative chart range">
            {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((item) => (
              <button
                key={item}
                aria-pressed={range === item}
                onClick={() => {
                  setRange(item);
                  setActive(null);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
      {sample ? (
        <>
          <div className="chart-wrap" onMouseLeave={() => setActive(null)}>
            <svg
              className="price-chart"
              viewBox="0 0 695 210"
              role="img"
              aria-label={`Illustrative ${quote.name} ${range} price chart. Invented sample values; data is available in the table below.`}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setActive(
                  Math.max(
                    0,
                    Math.min(
                      63,
                      Math.round(
                        ((event.clientX - rect.left) / rect.width) * 68,
                      ),
                    ),
                  ),
                );
              }}
            >
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-fill-start)"
                    stopOpacity=".38"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-fill-end)"
                    stopOpacity=".06"
                  />
                </linearGradient>
              </defs>
              {[30, 75, 120, 165].map((y, i) => (
                <g key={y}>
                  <line
                    x1="0"
                    x2="643"
                    y1={y}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 5"
                  />
                  <text x="658" y={y + 4} fill="var(--chart-axis)" fontSize="9">
                    {(max - ((max - min) * i) / 3).toFixed(0)}
                  </text>
                </g>
              ))}
              <path
                d={line + " L640 200 L0 200 Z"}
                fill={`url(#${gradient})`}
              />
              <polyline
                points={points}
                fill="none"
                stroke="var(--chart-line)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {active !== null && (
                <g>
                  <line
                    x1={point(values[active], active)[0]}
                    x2={point(values[active], active)[0]}
                    y1="15"
                    y2="200"
                    stroke="var(--chart-range)"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={point(values[active], active)[0]}
                    cy={point(values[active], active)[1]}
                    r="4"
                    fill="var(--chart-point)"
                    stroke="var(--surface)"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
            <div className="chart-labels">
              {(range === "1D"
                ? ["9:30 AM", "11:00 AM", "12:30 PM", "2:00 PM", "4:00 PM"]
                : ["Start", "25%", "50%", "75%", "End"]
              ).map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
          <p className="chart-note">
            Illustrative {range} chart · USD · invented prices for demonstration
          </p>
          <details className="chart-data">
            <summary>
              <ChevronDown size={12} aria-hidden="true" />
              View chart data
            </summary>
            <table className="stock-table">
              <caption>
                Eight sample points from the illustrative {range} chart. Not
                historical prices.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Sample point</th>
                  <th scope="col">Price (USD)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((i) => (
                  <tr key={i}>
                    <td>{i + 1} of 64</td>
                    <td>{money(values[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : (
        <div className="quote-range">
          <p>
            {quote.low !== null && quote.high !== null
              ? "Position within the provider’s session range"
              : "Session range is unavailable"}
          </p>
          {quote.low !== null &&
            quote.high !== null &&
            quote.price !== null && (
              <>
                <div className="range-track">
                  <span
                    className="range-pin"
                    style={{
                      left: `${Math.max(0, Math.min(98, ((quote.price - quote.low) / (quote.high - quote.low || 1)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="range-extents">
                  <span>Low {money(quote.low)}</span>
                  <span>High {money(quote.high)}</span>
                </div>
                <p className="quote-timestamp">
                  As of{" "}
                  {quote.timestamp
                    ? new Date(quote.timestamp * 1000).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })
                    : "unavailable"}{" "}
                  · Finnhub
                </p>
              </>
            )}
        </div>
      )}
      <dl className="metrics-row">
        {[
          ["Open", quote.open],
          ["Session high", quote.high],
          ["Session low", quote.low],
          ["Previous close", quote.previousClose],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd>{money(value as number | null)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
