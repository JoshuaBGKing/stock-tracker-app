import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const appearanceKey = "stillmark.appearance.v1";

function themeOption(page: Page, name: "Light" | "Dark" | "System") {
  return page
    .getByRole("group", { name: "Color theme", exact: true })
    .getByRole("radio", { name, exact: true });
}

test("appearance selection persists across navigation, reloads, and browser tabs", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Appearance", exact: true }),
  ).toBeVisible();
  await expect(themeOption(page, "System")).toBeChecked();
  await themeOption(page, "Dark").check();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), appearanceKey),
  ).toBe("dark");

  await page
    .getByRole("link", { name: "Watchlist", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/watchlist/);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  const otherTab = await context.newPage();
  await otherTab.goto("/settings");
  await expect(themeOption(otherTab, "Dark")).toBeChecked();
  await otherTab.bringToFront();
  await themeOption(otherTab, "Light").check();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await expect(otherTab.locator("html")).toHaveClass(/\blight\b/);
  await otherTab.close();
});

test("theme radios work with the keyboard and System follows device changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/settings");
  await expect(themeOption(page, "System")).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);

  await themeOption(page, "Light").check();
  await themeOption(page, "Light").focus();
  await page.keyboard.press("ArrowRight");
  await expect(themeOption(page, "Dark")).toBeFocused();
  await expect(themeOption(page, "Dark")).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.keyboard.press("ArrowRight");
  await expect(themeOption(page, "System")).toBeFocused();
  await expect(themeOption(page, "System")).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(themeOption(page, "System")).toBeChecked();
  await themeOption(page, "Light").check();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
});

test("blocked appearance storage still changes this tab and reports the limitation", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript((key) => {
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException(
          "Test appearance storage failure",
          "QuotaExceededError",
        );
      return originalSet.call(this, name, value);
    };
  }, appearanceKey);
  await page.goto("/settings");
  await themeOption(page, "Dark").check();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(themeOption(page, "Dark")).toBeChecked();
  await expect(
    page.getByText(
      "Your appearance changed for this tab, but your browser could not save it.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), appearanceKey),
  ).toBeNull();
  await page
    .getByRole("link", { name: "Watchlist", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/watchlist/);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
});

test("consented charts follow theme changes without enabling charts implicitly", async ({
  page,
}) => {
  let requests = 0;
  await page.route("https://s3.tradingview.com/**", (route) => {
    requests++;
    return route.fulfill({
      contentType: "application/javascript",
      body: "/* appearance test: no third-party code executed */",
    });
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/stocks/AAPL");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(
    page.getByRole("button", { name: "Allow TradingView charts" }),
  ).toBeVisible();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  expect(requests).toBe(0);

  await page.getByRole("button", { name: "Allow TradingView charts" }).click();
  const script = page.locator(
    '.tradingview-widget-container script[src*="tradingview.com"]',
  );
  await expect(script).toHaveCount(1);
  await expect
    .poll(async () => JSON.parse((await script.textContent()) || "{}").theme)
    .toBe("light");
  await expect.poll(() => requests).toBeGreaterThan(0);

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect
    .poll(async () => JSON.parse((await script.textContent()) || "{}").theme)
    .toBe("dark");
  const config = JSON.parse((await script.textContent()) || "{}");
  expect(config.colorTheme).toBe("dark");
  expect(config.backgroundColor).not.toBe("#ffffff");
});

for (const path of ["/", "/settings", "/stocks/AAPL", "/sign-in", "/privacy"]) {
  test(`dark mode accessibility and narrow layout ${path}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const external: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (!/^(localhost|127\.0\.0\.1)$/.test(new URL(request.url()).hostname))
        external.push(request.url());
    });
    await page.addInitScript(
      (key) => localStorage.setItem(key, "dark"),
      appearanceKey,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
}
