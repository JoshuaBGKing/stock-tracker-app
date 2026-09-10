import type { MarketSnapshot } from "../market-types";

export function readPreviewSymbols(data: unknown): string[] {
  if (data === undefined || data === null) return ["AAPL", "MSFT", "NVDA"];
  if (typeof data !== "object" || Array.isArray(data))
    throw new Error("Preview event data must be an object.");
  const input = data as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== "symbols"))
    throw new Error(
      "Use only symbols in test events; do not include personal data.",
    );
  if (input.symbols === undefined) return ["AAPL", "MSFT", "NVDA"];
  if (
    !Array.isArray(input.symbols) ||
    input.symbols.length === 0 ||
    input.symbols.length > 10 ||
    input.symbols.some(
      (symbol) => typeof symbol !== "string" || !/^[A-Z]{1,5}$/.test(symbol),
    )
  )
    throw new Error("Use 1–10 uppercase stock symbols, for example AAPL.");
  return [...new Set(input.symbols as string[])];
}

function emailPreview(subject: string, text: string) {
  // A preview value, not a mail transport. Never import a live mailer here.
  return {
    mode: "local-preview" as const,
    delivered: false,
    message: {
      from: "Stillmark <stillmark@example.test>",
      to: "reader@example.test",
      subject: `[LOCAL PREVIEW] ${subject}`,
      text: `${text}\n\nLocal test only. No email was sent. No account was created.`,
    },
  };
}

export function welcomeEmailPreview() {
  return emailPreview(
    "Welcome to Stillmark",
    "Welcome to your research workspace.\n\nSave companies to a watchlist, explore market data, and create browser alerts. Browser alerts require the app to stay open and visible.\n\nStillmark is a research tool, not a brokerage or investment adviser.",
  );
}

export function dailyNewsPreview(snapshot: MarketSnapshot, symbols: string[]) {
  if (snapshot.mode !== "sample")
    throw new Error(
      "Local workflow previews require illustrative sample data.",
    );
  const quotes = symbols.map((symbol) => {
    const quote = snapshot.quotes.find((item) => item.symbol === symbol);
    if (!quote) throw new Error(`No local sample is available for ${symbol}.`);
    return quote;
  });
  const lines = quotes.map(
    (quote) =>
      `${quote.symbol} · ${quote.name}: $${quote.price?.toFixed(2) ?? "unavailable"} (${quote.percent !== null && quote.percent >= 0 ? "+" : ""}${quote.percent?.toFixed(2) ?? "unavailable"}%)`,
  );
  return {
    ...emailPreview(
      "Your daily research brief",
      `ILLUSTRATIVE FIXTURES — not current prices or real news.\n\nSample watchlist\n${lines.join("\n")}\n\nExample research prompts\n• Read the company's latest published earnings report.\n• Compare revenue, margins and cash flow over multiple periods.\n• Check the source and date before acting on a headline.\n\nThis preview is template-generated, not AI-generated or personalised advice.`,
    ),
    dataSource: "illustrative-fixtures" as const,
    symbols,
  };
}
