import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as catalog from "../lib/market-catalog.ts";
import * as integrity from "../lib/market-integrity.ts";
import * as symbols from "../lib/market-symbols.ts";
import * as insightSchema from "../lib/insight-schema.ts";
import { triggeredAlerts } from "../lib/alert-rules.ts";

// Execute the real server module with provider I/O replaced at the boundary.
// No Next server, credentials, database or external network is needed.
function loadServerModule(path, dependencies, overrides = {}) {
  const compiled = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exports = {};
  vm.runInNewContext(
    compiled,
    {
      exports,
      require(name) {
        if (name === "server-only") return {};
        if (!Object.hasOwn(dependencies, name))
          throw new Error(`Unexpected import: ${name}`);
        return dependencies[name];
      },
      URL,
      AbortSignal,
      Date,
      process: { env: { FINNHUB_API_KEY: "synthetic-test-key" } },
      ...overrides,
    },
    { filename: path },
  );
  return exports;
}

const now = 1800000000000;
const rawQuote = {
  c: 201,
  d: 1,
  dp: 0.5,
  h: 202,
  l: 198,
  o: 199,
  pc: 200,
  t: now / 1000,
};

function marketWithProvider(provider) {
  const calls = [];
  const market = loadServerModule(
    "../lib/market.ts",
    {
      react: { cache: (fn) => fn },
      "./market-catalog": catalog,
      "./market-integrity": integrity,
      "./market-symbols": symbols,
    },
    {
      async fetch(url, options) {
        assert.equal(url.origin, "https://finnhub.io");
        const call = {
          endpoint: url.pathname.replace("/api/v1", ""),
          symbol: url.searchParams.get("symbol"),
          options,
        };
        calls.push(call);
        const data = await provider(call);
        return { ok: true, json: async () => data };
      },
    },
  );
  return { market, calls };
}

test("custom listings require matching provider ticker and explicit USD currency", () => {
  const profile = {
    ticker: "CUSTOM",
    currency: "USD",
    country: "GB",
    name: "Custom company",
  };
  assert.equal(
    integrity.usdInstrumentFromProfile("CUSTOM", profile).name,
    "Custom company",
  );
  // Neither an issuer's country nor a ticker's appearance proves currency.
  for (const replacement of [
    { currency: "GBP", country: "US" },
    { currency: "GBp" },
    { currency: "EUR" },
    { currency: "" },
    { currency: undefined },
    { ticker: "CUSTOM.L" },
    { ticker: undefined },
  ])
    assert.equal(
      integrity.usdInstrumentFromProfile("CUSTOM", {
        ...profile,
        ...replacement,
      }),
      null,
    );
});

test("selected custom GBP or unverified quotes stay empty and never request a price", async () => {
  const { market, calls } = marketWithProvider(({ endpoint, symbol }) => {
    assert.equal(endpoint, "/stock/profile2");
    return {
      ticker: symbol,
      currency: symbol === "FOREIGN" ? "GBP" : undefined,
    };
  });
  const snapshot = await market.getSelectedQuotes(["FOREIGN", "UNKNOWN"]);
  assert.equal(snapshot.mode, "market");
  for (const quote of snapshot.quotes) {
    assert.equal(quote.price, null);
    assert.equal(quote.currency, null);
    assert.equal(quote.source, "unavailable");
  }
  assert.equal(calls.length, 2);
  assert.equal(await market.getQuote("FOREIGN"), null);
});

test("custom USD quote succeeds independently of a complete overview outage", async () => {
  const { market, calls } = marketWithProvider(
    ({ endpoint, symbol, options }) => {
      if (endpoint === "/stock/profile2") {
        assert.equal(symbol, "COST");
        assert.equal(options.next.revalidate, 86400);
        return {
          ticker: "COST",
          currency: "USD",
          name: "Costco",
          exchange: "NASDAQ",
        };
      }
      if (symbol === "COST") return rawQuote;
      throw new Error("Unrelated overview provider outage");
    },
  );
  assert.equal((await market.getMarketSnapshot()).mode, "sample");
  calls.length = 0;
  const quote = await market.getQuote("COST");
  assert.equal(quote.price, 201);
  assert.equal(quote.currency, "USD");
  assert.equal(quote.source, "provider");
  assert.equal(integrity.isProviderQuote(quote), true);
  assert.match(integrity.quoteDisclosure(quote), /USD quote is from Finnhub/);
  assert.doesNotMatch(integrity.quoteDisclosure(quote), /illustrative|demo/);
  assert.deepEqual(
    calls.map(({ symbol, endpoint }) => [symbol, endpoint]),
    [
      ["COST", "/stock/profile2"],
      ["COST", "/quote"],
    ],
  );
});

test("malformed or failed provider prices never become sample selected quotes", async () => {
  for (const raw of [
    null,
    {},
    { ...rawQuote, c: -1 },
    { ...rawQuote, c: Infinity },
    { ...rawQuote, t: 0 },
    { ...rawQuote, t: NaN },
  ]) {
    const quote = integrity.providerQuote(catalog.instruments[0], raw);
    assert.equal(quote.price, null);
    assert.equal(quote.source, "unavailable");
  }
  const { market } = marketWithProvider(() => {
    throw new Error("Outage");
  });
  assert.equal(await market.getQuote("AAPL"), null);
  const selected = await market.getSelectedQuotes(["AAPL"]);
  assert.equal(selected.mode, "market");
  assert.equal(selected.quotes[0].source, "unavailable");
});

test("alerts reject sample, unverified currency and malformed quotes even in a market snapshot", () => {
  const alert = { id: "test", symbol: "AAPL", direction: "above", target: 200 };
  const quote = integrity.providerQuote(catalog.instruments[0], rawQuote);
  for (const replacement of [
    { source: "sample" },
    { source: undefined },
    { currency: "GBP" },
    { currency: null },
    { price: Infinity },
    { timestamp: NaN },
  ]) {
    assert.deepEqual(
      triggeredAlerts(
        [alert],
        { mode: "market", quotes: [{ ...quote, ...replacement }] },
        now,
      ),
      [],
    );
  }
  const sample = catalog.sampleSnapshot().quotes[0];
  assert.equal(sample.currency, "USD");
  assert.equal(sample.source, "sample");
  assert.match(integrity.quoteDisclosure(sample), /illustrative demo/);
});

test("search validates a bounded set of profiles and excludes non-USD listings", async () => {
  const { market, calls } = marketWithProvider(({ endpoint, symbol }) => {
    if (endpoint === "/search")
      return {
        result: [
          { symbol: "FOREIGN", description: "Foreign", type: "Stock" },
          { symbol: "COST", description: "Costco", type: "Stock" },
          ...Array.from({ length: 20 }, (_, index) => ({
            symbol: `CUSTOM${index}`,
            type: "Stock",
          })),
        ],
      };
    assert.equal(endpoint, "/stock/profile2");
    return {
      ticker: symbol,
      currency: symbol === "FOREIGN" ? "GBP" : "USD",
      name: symbol,
    };
  });
  const search = loadServerModule("../lib/actions/finnhub.actions.ts", {
    "@/lib/market": market,
    "@/lib/market-catalog": catalog,
  });
  const results = await search.searchStocks("custom");
  assert.equal(
    results.some(({ symbol }) => symbol === "FOREIGN"),
    false,
  );
  assert.equal(
    results.some(({ symbol }) => symbol === "COST"),
    true,
  );
  assert.equal(
    calls.filter(({ endpoint }) => endpoint === "/stock/profile2").length,
    8,
  );
  assert.equal(
    calls.some(({ endpoint }) => endpoint === "/quote"),
    false,
  );
});

test("AI uses selected USD provider data without asking for the overview", async () => {
  const quote = integrity.providerQuote(
    { ...catalog.instruments[0], symbol: "COST" },
    rawQuote,
  );
  let sentInput;
  const ai = loadServerModule(
    "../lib/insights.ts",
    {
      "@/lib/market": {
        getQuote: async () => quote,
        getMarketSnapshot: async () => {
          throw new Error("An unrelated overview must not be fetched");
        },
      },
      "@/lib/actions/finnhub.actions": { getNews: async () => [] },
      "./market-integrity": integrity,
      "./insight-schema": insightSchema,
      "./test-mode": { isIsolatedTestEnvironment: () => false },
    },
    {
      process: {
        env: {
          ENABLE_AI_INSIGHTS: "true",
          GEMINI_API_KEY: "synthetic-test-key",
        },
      },
      fetch: async (_url, options) => {
        sentInput = JSON.parse(
          JSON.parse(options.body).contents[0].parts[0].text,
        );
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: "A neutral test note.",
                        observations: ["A verified price is supplied."],
                        questions: ["What do filings show?"],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      },
    },
  );
  assert.equal(
    (await ai.generateResearchInsight("COST")).sourceMode,
    "provider",
  );
  assert.equal(sentInput.currency, "USD");
  assert.equal(sentInput.price, 201);
  for (const replacement of [
    { currency: "GBP" },
    { currency: null },
    { source: "sample" },
    { source: "unavailable" },
  ]) {
    const original = { ...quote };
    Object.assign(quote, replacement);
    sentInput = null;
    await assert.rejects(
      ai.generateResearchInsight("COST"),
      /verified USD provider quote is unavailable/,
    );
    assert.equal(sentInput, null);
    Object.assign(quote, original);
  }
});
