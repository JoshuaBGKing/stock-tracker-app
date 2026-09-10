import { test, expect, type Page } from "@playwright/test";

async function failingPermissionStorage(
  page: Page,
  failure: "write" | "write-and-remove" | "all",
) {
  await page.addInitScript((failure) => {
    const key = "stillmark.preferences.v1";
    if (!sessionStorage.getItem("consent-regression-seeded")) {
      localStorage.setItem(
        key,
        JSON.stringify({
          embeds: true,
          updatedAt: new Date().toISOString(),
          version: 1,
        }),
      );
      sessionStorage.setItem("consent-regression-seeded", "1");
    }
    const set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException("Test write failure", "QuotaExceededError");
      return set.call(this, name, value);
    };
    Storage.prototype.removeItem = function (name) {
      if (name === key && failure !== "write")
        throw new DOMException("Test removal failure", "SecurityError");
      return remove.call(this, name);
    };
    if (failure === "all") {
      Object.defineProperty(document, "cookie", {
        configurable: true,
        get: () => "",
        set: () => {
          throw new DOMException("Test cookie failure", "SecurityError");
        },
      });
    }
    Reflect.set(window, "restorePermissionStorage", () => {
      Storage.prototype.setItem = set;
      Storage.prototype.removeItem = remove;
      if (failure === "all") Reflect.deleteProperty(document, "cookie");
    });
  }, failure);
}

for (const failure of ["write", "write-and-remove", "all"] as const) {
  test(`chart withdrawal remains off when ${failure} storage fails`, async ({
    page,
    context,
  }) => {
    await failingPermissionStorage(page, failure);
    let charts = 0;
    await page.route("https://s3.tradingview.com/**", (route) => {
      charts++;
      return route.fulfill({
        contentType: "application/javascript",
        body: "/* no vendor code */",
      });
    });
    await page.goto("/settings");
    const toggle = page.getByRole("switch", { name: "TradingView charts" });
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    if (failure === "write") {
      expect(
        await page.evaluate(() =>
          localStorage.getItem("stillmark.preferences.v1"),
        ),
      ).toBeNull();
    } else if (failure === "write-and-remove") {
      expect(
        (await context.cookies()).some(
          (cookie) =>
            cookie.name === "stillmark.charts-off" && cookie.value === "1",
        ),
      ).toBe(true);
    } else {
      await expect(page).toHaveURL(/charts=off/);
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: "Charts are off in this tab" }),
      ).toBeVisible();
    }
    // Use client navigation to check that a temporary refusal survives route changes.
    await page
      .getByRole("link", { name: "Watchlist", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/watchlist/);
    if (failure === "all") await expect(page).toHaveURL(/charts=off/);
    const suffix = failure === "all" ? "?charts=off" : "";
    await page.goto(`/stocks/AAPL${suffix}`);
    await expect(
      page.getByRole("button", { name: "Allow TradingView charts" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Allow TradingView charts" }),
    ).toBeVisible();
    expect(charts).toBe(0);
    // Failed opt-in must not resurrect the previous grant.
    await page
      .getByRole("button", { name: "Allow TradingView charts" })
      .click();
    await expect(
      page.getByText(
        "Your browser could not save this preference. External charts remain off.",
      ),
    ).toBeVisible();
    expect(charts).toBe(0);
    // A new explicit, successfully saved choice can clear every refusal fallback.
    await page.evaluate(() =>
      Reflect.get(window, "restorePermissionStorage")(),
    );
    await page
      .getByRole("button", { name: "Allow TradingView charts" })
      .click();
    await expect.poll(() => charts).toBe(1);
    expect(new URL(page.url()).searchParams.has("charts")).toBe(false);
    expect(
      (await context.cookies()).some(
        (cookie) => cookie.name === "stillmark.charts-off",
      ),
    ).toBe(false);
  });
}
