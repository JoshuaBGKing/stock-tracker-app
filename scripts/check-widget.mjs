import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const origin = process.env.WIDGET_CHECK_ORIGIN || "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge" });
const checks = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      colorScheme: theme,
      viewport: { width: 1440, height: 1100 },
    });
    try {
      const page = await context.newPage();
      const requests = [];
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (new URL(request.url()).hostname.includes("tradingview"))
          requests.push(new URL(request.url()).hostname);
      });
      const response = await page.goto(`${origin}/stocks/AAPL`);
      assert.equal(response.status(), 200);
      const allow = page.getByRole("button", {
        name: "Allow TradingView charts",
      });
      await allow.waitFor();
      assert.equal(
        requests.length,
        0,
        "Provider requests before chart consent",
      );
      await allow.click();
      const widget = page.locator(".widget-frame");
      const iframe = widget.locator("iframe");
      await iframe.waitFor({ timeout: 30000 });
      const element = await iframe.elementHandle();
      const content = await element.contentFrame();
      assert.ok(content, "TradingView iframe must have a document");
      await content.locator("canvas").first().waitFor({
        state: "visible",
        timeout: 30000,
      });
      // A mounted iframe/canvas alone can still contain empty price placeholders.
      await content.waitForFunction(
        () => {
          const text = document.body.innerText;
          return (
            /AAPL|Apple Inc/.test(text) &&
            /\d+\.\d{2}/.test(text) &&
            !text.includes("∅")
          );
        },
        undefined,
        { timeout: 60000 },
      );
      for (const viewport of [
        { width: 1440, height: 1100 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await iframe.scrollIntoViewIfNeeded();
        const outer = await widget.boundingBox();
        const inner = await iframe.boundingBox();
        assert.ok(outer && inner, "Widget and iframe must be visible");
        assert.equal(
          outer.height,
          500,
          "Chart panel must retain its configured height",
        );
        assert.ok(
          Math.abs(inner.height - (outer.height - 2)) <= 1,
          "Chart must fill the panel height inside its borders",
        );
        assert.ok(
          Math.abs(inner.width - (outer.width - 2)) <= 1,
          "Chart must fit the responsive panel width",
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Chart must not cause horizontal page overflow",
        );
        checks.push({
          theme,
          viewport: viewport.width,
          panelHeight: outer.height,
          chartHeight: inner.height,
        });
      }
      assert.deepEqual(errors, [], "Unexpected browser exceptions");
      console.log(
        JSON.stringify({
          theme,
          chartDataVisible: true,
          requestsBeforeConsent: 0,
          providerHosts: [...new Set(requests)],
        }),
      );
    } finally {
      await context.close();
    }
  }
  console.log(JSON.stringify({ sizingChecks: checks }));
} catch (error) {
  console.log(
    JSON.stringify({
      passed: false,
      completedSizingChecks: checks,
      error: error.message.slice(0, 400),
    }),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
