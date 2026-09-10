import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard is branded, interactive, and loads no third-party requests", async ({
  page,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/))
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The market, in perspective." }),
  ).toBeVisible();
  await expect(page.getByText("Demo workspace")).toBeVisible();
  await page
    .getByRole("button", { name: "Show NVIDIA overview", exact: false })
    .click();
  await expect(
    page.getByRole("region", { name: "NVIDIA price overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1M", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "1M", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByText("View chart data").click();
  await expect(
    page.getByRole("cell", { name: "1 of 64", exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("guest watchlist persists and can be removed", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Save AAPL to watchlist", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Remove AAPL from watchlist" }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/watchlist");
  await expect(page.getByRole("link", { name: /AAPL Apple/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /AAPL Apple/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Remove AAPL from watchlist" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little curiosity starts here." }),
  ).toBeVisible();
});

test("keyboard search navigates and dialog closes with Escape", async ({
  page,
}) => {
  await page.goto("/");
  // Keyboard shortcuts have no Playwright actionability wait, unlike clicks.
  await expect(page.locator('[data-workspace-ready="true"]')).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Find a stock" }),
  ).toBeVisible();
  await page.getByRole("combobox").fill("Microsoft");
  await expect(page.getByRole("option", { name: /MSFT/ })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/stocks\/MSFT/);
  await expect(
    page.getByRole("heading", { name: "Microsoft MSFT", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("external charts are blocked, consented, persisted, and revoked", async ({
  page,
}) => {
  let requests = 0;
  await page.route("https://s3.tradingview.com/**", (route) => {
    requests++;
    return route.fulfill({
      contentType: "application/javascript",
      body: "/* consent test: no third-party code executed */",
    });
  });
  await page.goto("/stocks/AAPL");
  await expect(
    page.getByRole("button", { name: "Allow TradingView charts" }),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Allow TradingView charts" }).click();
  await expect.poll(() => requests).toBe(1);
  await page.reload();
  await expect.poll(() => requests).toBe(2);
  await page.goto("/settings");
  await expect(
    page.getByRole("switch", { name: "TradingView charts" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("switch", { name: "TradingView charts" }).click();
  await expect(
    page.getByRole("switch", { name: "TradingView charts" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.goto("/stocks/AAPL");
  await expect(
    page.getByRole("button", { name: "Allow TradingView charts" }),
  ).toBeVisible();
  expect(requests).toBe(2);
});

test("expired consent and invalid storage default safely", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "stillmark.preferences.v1",
      JSON.stringify({ embeds: true, updatedAt: "2020-01-01", version: 1 }),
    );
    localStorage.setItem("stillmark.watchlist.v1", "not json");
    localStorage.setItem("stillmark.alerts.v1", "null");
  });
  await page.goto("/stocks/AAPL");
  await expect(
    page.getByRole("button", { name: "Allow TradingView charts" }),
  ).toBeVisible();
  await page.goto("/watchlist");
  await expect(
    page.getByRole("heading", { name: "A little curiosity starts here." }),
  ).toBeVisible();
});

test("price alerts can be created and deleted without triggering on demo data", async ({
  page,
}) => {
  await page.goto("/alerts");
  await page
    .getByRole("button", { name: "Create price alert", exact: true })
    .click();
  await page.getByLabel("Target price (USD)").fill("250");
  await page.getByRole("button", { name: "Save browser alert" }).click();
  await expect(
    page.getByRole("heading", { name: "AAPL at or above $250.00" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Waiting for a fresh quote matching your target"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete AAPL alert at $250.00" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Know what you’re waiting for." }),
  ).toBeVisible();
});

test("workspace export works and clear-data confirmation can be cancelled", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Save AAPL to watchlist" })
    .first()
    .click();
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export workspace", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("stillmark-workspace.json");
  await page
    .getByRole("button", { name: "Clear browser data", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep my data" }).click();
  await expect(page.getByText("1 saved stocks")).toBeVisible();
  await page
    .getByRole("button", { name: "Clear browser data", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear browser data", exact: true })
    .click();
  await expect(page.getByText("0 saved stocks")).toBeVisible();
});

test("registration is gated and legal pages are public", async ({
  page,
  request,
}) => {
  await page.goto("/sign-up");
  await expect(
    page.getByRole("link", { name: "Explore the guest workspace" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  for (const path of ["/privacy", "/terms", "/cookies", "/accessibility"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("Preview policy — operator details pending."),
    ).toBeVisible();
  }
  expect(
    (
      await request.post("/api/auth/sign-up/email", {
        data: { email: "blocked@example.com" },
      })
    ).status(),
  ).toBe(405);
  expect((await request.post("/api/inngest")).status()).toBe(403);
});

test("mobile navigation, narrow layout and keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The market, in perspective." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Price alerts", exact: true }).click();
  await expect(page).toHaveURL(/alerts/);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
});

for (const path of [
  "/",
  "/stocks/AAPL",
  "/settings",
  "/sign-in",
  "/privacy",
  "/alerts",
]) {
  test("automated accessibility " + path, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nothing on this horizon." }),
    ).toHaveCount(0);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}

test("capture desktop and mobile previews", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1100 });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({
    path: ".artifacts/stillmark-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".artifacts/stillmark-mobile.png",
    fullPage: true,
  });
});
