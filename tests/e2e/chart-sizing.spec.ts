import { test, expect, type Page } from "@playwright/test";

const providerScript =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
const chartTitle = "Interactive stock chart provided by TradingView";

// Model the live provider's autosizing DOM mutations, not its market data or
// availability: it overwrites its container height with 100% and replaces the
// placeholder. A separate, definite-height wrapper must survive those changes;
// otherwise the iframe falls back to its intrinsic 150px height.
const autosizingProvider = `(() => {
  const script = document.currentScript;
  const config = JSON.parse(script.textContent);
  script.parentElement.style.height = '100%';
  script.parentElement.style.width = '100%';
  const placeholder = script.parentElement.querySelector(
    '.tradingview-widget-container__widget'
  );
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:100%;border:0;display:block';
  iframe.dataset.chartTheme = config.theme;
  iframe.srcdoc = '<!doctype html><html><body>Chart sizing fixture</body></html>';
  placeholder.replaceWith(iframe);
})();`;

async function expectFullChart(page: Page, theme: "light" | "dark") {
  const container = page.locator(".widget-frame");
  const iframe = container.locator("iframe");
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute("title", chartTitle);
  await expect(iframe).toHaveAttribute("data-chart-theme", theme);
  await expect(iframe).toBeVisible();
  await expect
    .poll(async () => {
      const outer = await container.boundingBox();
      const inner = await iframe.boundingBox();
      if (!outer || !inner) return false;
      return (
        Math.abs(outer.height - 500) <= 1 &&
        // Account for the container's 1px border on each side.
        Math.abs(inner.height - (outer.height - 2)) <= 1 &&
        Math.abs(inner.width - (outer.width - 2)) <= 1 &&
        Math.abs(inner.x - (outer.x + 1)) <= 1 &&
        Math.abs(inner.y - (outer.y + 1)) <= 1
      );
    })
    .toBe(true);
  await expect(container.getByRole("status")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  return (await iframe.boundingBox())!;
}

for (const theme of ["light", "dark"] as const) {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1100 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`TradingView fills its panel in ${theme} mode on ${viewport.name}, after resizing and theme changes`, async ({
      page,
    }) => {
      let providerRequests = 0;
      await page.route(providerScript, (route) => {
        providerRequests++;
        return route.fulfill({
          contentType: "application/javascript",
          body: autosizingProvider,
        });
      });
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/stocks/AAPL");
      await expect(
        page.getByRole("button", { name: "Allow TradingView charts" }),
      ).toBeVisible();
      expect(providerRequests).toBe(0);
      await expect(page.locator(".widget-frame iframe")).toHaveCount(0);

      await page
        .getByRole("button", { name: "Allow TradingView charts" })
        .click();
      const initial = await expectFullChart(page, theme);
      expect(providerRequests).toBeGreaterThan(0);

      await page.setViewportSize(
        viewport.name === "desktop"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1100 },
      );
      const resized = await expectFullChart(page, theme);
      expect(Math.abs(resized.width - initial.width)).toBeGreaterThan(100);

      const nextTheme = theme === "light" ? "dark" : "light";
      const requestsBeforeThemeChange = providerRequests;
      await page.emulateMedia({ colorScheme: nextTheme });
      await expect(page.locator("html")).toHaveClass(new RegExp(nextTheme));
      await expectFullChart(page, nextTheme);
      expect(providerRequests).toBeGreaterThan(requestsBeforeThemeChange);
    });
  }
}

test("a blocked TradingView script leaves its fallback readable inside the fixed-height panel", async ({
  page,
}) => {
  await page.route(providerScript, (route) => route.abort("failed"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stocks/AAPL");
  await page.getByRole("button", { name: "Allow TradingView charts" }).click();

  const container = page.locator(".widget-frame");
  const status = container.getByRole("status");
  await expect(status).toHaveText(
    "TradingView is unavailable. You can still use the quote summary above.",
  );
  await expect(status).toBeVisible();
  await status.scrollIntoViewIfNeeded();
  await expect(container.locator("iframe")).toHaveCount(0);

  // Visibility alone allows an element clipped by an overflow:hidden parent.
  // Assert both the status box and its rendered text fit within that parent.
  const bounds = await status.evaluate((element) => {
    const panel = element.closest(".widget-frame")!.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const text = range.getBoundingClientRect();
    const fits = (rect: DOMRect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= panel.top &&
      rect.bottom <= panel.bottom &&
      rect.left >= panel.left &&
      rect.right <= panel.right;
    return {
      panelHeight: panel.height,
      boxFits: fits(box),
      textFits: fits(text),
    };
  });
  expect(bounds.panelHeight).toBe(500);
  expect(bounds.boxFits).toBe(true);
  expect(bounds.textFits).toBe(true);
});
