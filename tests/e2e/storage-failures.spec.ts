import { test, expect } from "@playwright/test";

test("a failed alert deletion preserves the alert and never reports success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "stillmark.alerts.v1",
      JSON.stringify([
        {
          id: "delete-failure",
          symbol: "AAPL",
          direction: "above",
          target: 250,
        },
      ]),
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "stillmark.alerts.v1")
        throw new DOMException("Test storage failure", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.goto("/alerts");
  await page
    .getByRole("button", { name: "Delete AAPL alert at $250.00" })
    .click();
  await expect(
    page.getByText(/Your browser could not save this change/),
  ).toBeVisible();
  await expect(page.getByText("Alert removed", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "AAPL at or above $250.00" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("stillmark.alerts.v1") || "[]").length,
    ),
  ).toBe(1);
});

test("failed trigger persistence emits no price notification and retries once storage recovers", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem(
      "stillmark.alerts.v1",
      JSON.stringify([
        {
          id: "trigger-failure",
          symbol: "AAPL",
          direction: "above",
          target: 1,
        },
      ]),
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "stillmark.alerts.v1")
        throw new DOMException("Test storage failure", "QuotaExceededError");
      return original.call(this, key, value);
    };
    Reflect.set(window, "restoreAlertStorage", () => {
      Storage.prototype.setItem = original;
    });
  });
  let requests = 0;
  await page.route("**/api/market?symbols=*", async (route) => {
    requests++;
    const timestamp = await page.evaluate(() => Math.floor(Date.now() / 1000));
    await route.fulfill({
      json: {
        mode: "market",
        fetchedAt: new Date(timestamp * 1000).toISOString(),
        message: "Controlled regression-test quote",
        quotes: [
          {
            symbol: "AAPL",
            name: "Apple",
            price: 200,
            timestamp,
            currency: "USD",
            source: "provider",
          },
        ],
      },
    });
  });
  await page.goto("/alerts");
  await expect(
    page.getByText(/Your browser could not save this change/),
  ).toBeVisible();
  await expect(
    page.getByText("AAPL is at or above $1.00", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Waiting for a fresh quote matching your target"),
  ).toBeVisible();
  const beforeRetry = requests;
  await page.clock.runFor(60000);
  await expect.poll(() => requests).toBeGreaterThan(beforeRetry);
  await expect(
    page.getByText("AAPL is at or above $1.00", { exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => Reflect.get(window, "restoreAlertStorage")());
  await page.clock.runFor(60000);
  await expect(
    page.getByText("AAPL is at or above $1.00", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("stillmark.alerts.v1") || "[]")[0]
            ?.triggeredAt,
      ),
    )
    .toBeTruthy();
  const afterPersist = requests;
  await page.clock.runFor(120000);
  expect(requests).toBe(afterPersist);
});

test("failed browser-data clearing stays open and reflects partial removals", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "stillmark.watchlist.v1",
      JSON.stringify([{ symbol: "AAPL", company: "Apple" }]),
    );
    localStorage.setItem(
      "stillmark.alerts.v1",
      JSON.stringify([
        {
          id: "clear-failure",
          symbol: "AAPL",
          direction: "above",
          target: 250,
        },
      ]),
    );
    const original = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
      if (key === "stillmark.alerts.v1")
        throw new DOMException("Test storage failure", "SecurityError");
      return original.call(this, key);
    };
  });
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "Clear browser data", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear browser data", exact: true })
    .click();
  await expect(
    page.getByText("Could not clear browser data.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep my data" }).click();
  await expect(page.getByText("0 saved stocks", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1 browser alerts", { exact: true }),
  ).toBeVisible();
});
