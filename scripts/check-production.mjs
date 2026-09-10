import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({
  viewport: { width: 1512, height: 1100 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const response = await page.goto("http://localhost:3000/?mode=sample");
await page
  .getByRole("heading", { name: "The market, in perspective." })
  .waitFor();
const result = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
  .analyze();
await page.screenshot({
  path: ".artifacts/stillmark-production-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Open navigation" }).click();
await page.getByRole("link", { name: "Price alerts", exact: true }).click();
await page
  .getByRole("heading", { name: "Set your point of interest." })
  .waitFor();
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
const headers = response.headers();
console.log(
  JSON.stringify(
    {
      httpStatus: response.status(),
      title: await page.title(),
      accessibilityViolations: result.violations.map((item) => item.id),
      browserErrors: errors,
      mobileOverflow: overflow,
      securityHeaders: {
        contentType: headers["x-content-type-options"],
        referrer: headers["referrer-policy"],
        frameOptions: headers["x-frame-options"],
      },
    },
    null,
    2,
  ),
);
await browser.close();
process.exitCode =
  errors.length || result.violations.length || overflow ? 1 : 0;
