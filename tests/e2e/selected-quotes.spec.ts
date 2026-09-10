import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function quote(symbol: string, price = 123.45) {
  return {
    symbol,
    currency: "USD",
    source: "provider",
    name: symbol,
    color: "ink",
    exchange: "",
    sector: "Other",
    price,
    change: 1,
    percent: 1,
    high: price,
    low: price,
    open: price,
    previousClose: price - 1,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

test("custom stock alert retains the selected ticker and requests its quote", async ({
  page,
}) => {
  const batches: string[][] = [];
  await page.route("**/api/market?*", (route) => {
    const symbols = new URL(route.request().url()).searchParams
      .get("symbols")!
      .split(",");
    batches.push(symbols);
    return route.fulfill({
      json: {
        mode: "market",
        quotes: symbols.map((symbol) => quote(symbol, 201)),
        fetchedAt: new Date().toISOString(),
        message: "Intercepted test quote.",
      },
    });
  });
  await page.goto("/alerts?symbol=IBM");
  await expect(
    page.getByRole("dialog", { name: "Create a price alert" }),
  ).toBeVisible();
  await expect(page.getByLabel("Company", { exact: true })).toHaveValue("IBM");
  await page.getByLabel("Target price (USD)").fill("200");
  await page.getByRole("button", { name: "Save browser alert" }).click();
  await expect(
    page.getByRole("heading", { name: "IBM at or above $200.00" }),
  ).toBeVisible();
  await expect(page.locator(".alert-row .status-pill")).toHaveText("Triggered");
  expect(batches).toEqual([["IBM"]]);
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".alert-row .status-pill")).toHaveText("Triggered");
  expect(batches).toHaveLength(1);
});

test("custom watchlist quotes load in bounded pages and preserve company names", async ({
  page,
}) => {
  const symbols = [
    "IBM",
    "COST",
    "DIS",
    "BA",
    "KO",
    "PEP",
    "NKE",
    "ORCL",
    "INTC",
    "CSCO",
    "V",
  ];
  await page.addInitScript(
    (items) =>
      localStorage.setItem(
        "stillmark.watchlist.v1",
        JSON.stringify(
          items.map((symbol) => ({ symbol, company: `Company ${symbol}` })),
        ),
      ),
    symbols,
  );
  const batches: string[][] = [];
  await page.route("**/api/market?*", (route) => {
    const requested = new URL(route.request().url()).searchParams
      .get("symbols")!
      .split(",");
    batches.push(requested);
    return route.fulfill({
      json: {
        mode: "market",
        quotes: requested.map((symbol) => quote(symbol)),
        fetchedAt: new Date().toISOString(),
        message: "Intercepted test quotes.",
      },
    });
  });
  await page.goto("/watchlist");
  await expect(
    page.getByRole("cell", { name: "$123.45", exact: true }),
  ).toHaveCount(10);
  await expect(
    page.getByRole("link", { name: /IBM Company IBM/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous stocks" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next stocks" }).click();
  await expect(
    page.getByRole("cell", { name: "$123.45", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("link", { name: /V Company V/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next stocks" }),
  ).toBeDisabled();
  expect(batches).toEqual([symbols.slice(0, 10), ["V"]]);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("quote API validates batch bounds and returns only requested demo symbols", async ({
  request,
}) => {
  for (const value of [
    "",
    "AAPL,,IBM",
    "https://example.test",
    Array(11).fill("AAPL").join(","),
  ]) {
    expect(
      (
        await request.get(`/api/market?symbols=${encodeURIComponent(value)}`)
      ).status(),
    ).toBe(400);
  }
  const response = await request.get("/api/market?symbols=msft,AAPL,MSFT");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.mode).toBe("sample");
  expect(
    data.quotes.map((item: { symbol: string }) => item.symbol).sort(),
  ).toEqual(["AAPL", "MSFT"]);
});
