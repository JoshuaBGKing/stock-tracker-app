import { chromium, expect as baseExpect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";

// Account actions navigate through lazily compiled development routes. Allow
// that work to finish; keep assertions on actual account state and page content.
const expect = baseExpect.configure({ timeout: 30000 });

const origin = "http://127.0.0.1:3001";
const password = "Stillmark-test-passphrase-2026!";
const newPassword = "Stillmark-fresh-passphrase-2026!";
const suffix = Date.now();
const email = `reader-${suffix}@example.test`;
const otherEmail = `other-${suffix}@example.test`;
let browser;
async function inbox() {
  const response = await fetch("http://127.0.0.1:8025/api/messages", {
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  assert.equal(response.status, 200);
  return response.json();
}
async function messageFor(to, subject) {
  let mail;
  await expect
    .poll(
      async () => {
        mail = (await inbox()).findLast(
          (item) => item.to.includes(to) && item.subject.includes(subject),
        );
        return Boolean(mail);
      },
      { timeout: 30000 },
    )
    .toBe(true);
  return mail;
}
async function register(page, to) {
  await page.goto(`${origin}/sign-up`);
  await expect(page.getByText(/Isolated test workspace/)).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill(to);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible({ timeout: 30000 });
}
async function verify(page, to) {
  const mail = await messageFor(to, "Verify your Stillmark email");
  const link = mail.text.match(
    /http:\/\/127\.0\.0\.1:3001\/api\/auth\/verify-email[^\s]+/,
  )?.[0];
  assert.ok(link, "Verification message must contain a local callback");
  await page.goto(link, { waitUntil: "domcontentloaded", timeout: 45000 });
}
async function login(page, to, secret = password) {
  await page.goto(`${origin}/sign-in`);
  await page.getByLabel("Email address", { exact: true }).fill(to);
  await page.getByLabel("Password", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function accountExport(page) {
  await page.goto(`${origin}/settings`);
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export account", exact: true })
    .click();
  const download = await downloading;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const data = JSON.parse(Buffer.concat(chunks).toString());
  assert.ok(!JSON.stringify(data).includes(password));
  return data;
}
try {
  await expect
    .poll(
      async () => {
        try {
          return (
            await fetch(`${origin}/api/workflows`, {
              method: "PUT",
              signal: AbortSignal.timeout(10000),
            })
          ).status;
        } catch {
          return 0;
        }
      },
      {
        timeout: 45000,
        message:
          "Start npm.cmd run dev:test and npm.cmd run inngest:dev first.",
      },
    )
    .toBe(200);
  browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext();
  const other = await browser.newContext();
  for (const ctx of [context, other])
    await ctx.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return ["127.0.0.1", "localhost"].includes(url.hostname)
        ? route.continue()
        : route.abort();
    });
  const page = await context.newPage(),
    otherPage = await other.newPage();
  page.setDefaultTimeout(15000);
  otherPage.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(45000);
  otherPage.setDefaultNavigationTimeout(45000);

  await register(page, email);
  await login(page, email);
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Unable to sign in",
  );
  await verify(page, email);
  await login(page, email);
  await expect(page).toHaveURL(`${origin}/`);
  console.log(
    "PASS: signup, local SMTP verification, unverified-login rejection and sign-in.",
  );

  await expect(page.locator('[data-workspace-ready="true"]')).toBeVisible();
  // Hold the first response while the user saves another stock and clicks a
  // duplicate button. This reproduces the former stale-state closure race.
  let releaseFirstSave;
  const firstSaveHeld = new Promise((resolve) => {
    releaseFirstSave = resolve;
  });
  let appleMutationRequests = 0;
  const holdFirstSave = async (route) => {
    const request = route.request();
    if (
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      request.postData()?.includes("AAPL")
    ) {
      appleMutationRequests++;
      if (appleMutationRequests === 1) {
        const response = await route.fetch();
        await firstSaveHeld;
        await route.fulfill({ response });
        return;
      }
    }
    await route.fallback();
  };
  await page.route(`${origin}/**`, holdFirstSave);
  try {
    const appleButtons = page.getByRole("button", {
      name: "Save AAPL to watchlist",
      exact: true,
    });
    assert.ok(
      (await appleButtons.count()) >= 2,
      "Dashboard exposes duplicated AAPL controls",
    );
    await appleButtons.first().click();
    await expect.poll(() => appleMutationRequests).toBe(1);
    await appleButtons.last().click();
    await page
      .getByRole("button", { name: "Save NVDA to watchlist", exact: true })
      .first()
      .click();
  } finally {
    releaseFirstSave();
  }
  await expect(
    page.getByRole("button", { name: "Remove AAPL from watchlist" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove NVDA from watchlist" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove AAPL from watchlist" }).first(),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Remove NVDA from watchlist" }).first(),
  ).toBeEnabled();
  assert.equal(
    appleMutationRequests,
    1,
    "Duplicate buttons share one pending save",
  );
  await page.unroute(`${origin}/**`, holdFirstSave);
  const raceExport = await accountExport(page);
  assert.deepEqual(raceExport.watchlist.map((item) => item.symbol).sort(), [
    "AAPL",
    "NVDA",
  ]);
  await page.goto(`${origin}/watchlist`);
  await Promise.all([
    page
      .getByRole("button", { name: "Remove AAPL from watchlist", exact: true })
      .click(),
    page
      .getByRole("button", { name: "Remove NVDA from watchlist", exact: true })
      .click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "A little curiosity starts here." }),
  ).toBeVisible();
  await page.goto(`${origin}/`);
  await page
    .getByRole("button", { name: "Save AAPL to watchlist", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Remove AAPL from watchlist" }).first(),
  ).toBeVisible();
  console.log(
    "PASS: overlapping saves/removals preserve all changes and duplicate stock controls share one pending mutation.",
  );
  await register(otherPage, otherEmail);
  await verify(otherPage, otherEmail);
  await login(otherPage, otherEmail);
  await expect(otherPage).toHaveURL(`${origin}/`);
  await otherPage.goto(`${origin}/watchlist`);
  await expect(
    otherPage.getByRole("heading", { name: "A little curiosity starts here." }),
  ).toBeVisible();
  const exported = await accountExport(page);
  assert.equal(exported.profile.email, email);
  assert.deepEqual(
    exported.watchlist.map((item) => item.symbol),
    ["AAPL"],
  );
  assert.equal((await accountExport(otherPage)).watchlist.length, 0);
  console.log(
    "PASS: account-scoped watchlists and exports remain isolated between two users.",
  );

  await page.goto(`${origin}/stocks/AAPL`);
  const generate = page.getByRole("button", { name: "Generate research note" });
  await expect(generate).toBeDisabled();
  await page.getByRole("checkbox", { name: /local research fixture/ }).check();
  await generate.click();
  await expect(page.getByText("Test fixture · not AI output")).toBeVisible();
  await page
    .getByRole("checkbox", { name: /local research fixture/ })
    .uncheck();
  await expect(page.getByText("Test fixture · not AI output")).toHaveCount(0);
  console.log(
    "PASS: research consent gate, authenticated action, labelled fixture and clearing.",
  );

  await page.goto(`${origin}/settings`);
  await expect(
    page.getByRole("button", { name: "Subscribe to news briefs", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /I want Stillmark market news briefs/ })
    .check();
  await page
    .getByRole("button", { name: "Subscribe to news briefs", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send my news brief" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send my news brief" }).click();
  const brief = await messageFor(email, "Your Stillmark news brief");
  assert.match(brief.text, /LOCAL TEST FIXTURE/);
  await page.getByRole("button", { name: "Send my news brief" }).click();
  await expect(page.getByText(/already been sent/)).toBeVisible();
  assert.equal(
    (await inbox()).filter(
      (item) => item.to.includes(email) && item.subject.includes("news brief"),
    ).length,
    1,
  );
  const unsubscribe = brief.text.match(
    /http:\/\/127\.0\.0\.1:3001\/unsubscribe\?token=[^\s]+/,
  )?.[0];
  assert.ok(unsubscribe);
  // GET never changes preferences; email scanners must not unsubscribe users.
  await otherPage.goto(unsubscribe);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Send my news brief" }),
  ).toBeVisible();
  await otherPage
    .getByRole("button", { name: "Unsubscribe from news briefs" })
    .click();
  await expect(
    otherPage.getByRole("status").filter({ hasText: "unsubscribe request" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Subscribe to news briefs", exact: true }),
  ).toBeVisible();
  console.log(
    "PASS: separate opt-in, actual Inngest-to-SMTP delivery, daily duplicate guard and signed unsubscribe.",
  );

  await otherPage.goto(`${origin}/settings`);
  async function subscribeOther() {
    await otherPage
      .getByRole("checkbox", { name: /I want Stillmark market news briefs/ })
      .check();
    await otherPage
      .getByRole("button", { name: "Subscribe to news briefs", exact: true })
      .click();
    await expect(
      otherPage.getByRole("button", { name: "Send my news brief" }),
    ).toBeVisible();
  }
  await subscribeOther();
  await otherPage.getByRole("button", { name: "Send my news brief" }).click();
  const otherBrief = await messageFor(otherEmail, "Your Stillmark news brief");
  const otherUnsubscribe = otherBrief.text.match(
    /http:\/\/127\.0\.0\.1:3001\/unsubscribe\?token=[^\s]+/,
  )?.[0];
  assert.ok(otherUnsubscribe);
  const token = new URL(otherUnsubscribe).searchParams.get("token");
  assert.ok(token);
  async function oneClick(value, body = "List-Unsubscribe=One-Click") {
    return fetch(
      `${origin}/api/unsubscribe?token=${encodeURIComponent(value)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      },
    );
  }
  const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
  assert.equal((await oneClick(tampered)).status, 200);
  await otherPage.reload();
  await expect(
    otherPage.getByRole("button", { name: "Send my news brief" }),
  ).toBeVisible();
  assert.equal((await oneClick(token)).status, 200);
  await otherPage.reload();
  await subscribeOther();
  // A link from an older consent version cannot cancel a later subscription.
  assert.equal((await oneClick(token)).status, 200);
  assert.equal((await oneClick(token, "x".repeat(1025))).status, 413);
  await otherPage.reload();
  await expect(
    otherPage.getByRole("button", { name: "Send my news brief" }),
  ).toBeVisible();
  await otherPage
    .getByRole("button", { name: "Unsubscribe from news briefs", exact: true })
    .click();
  await expect(
    otherPage.getByRole("button", {
      name: "Subscribe to news briefs",
      exact: true,
    }),
  ).toBeVisible();
  console.log(
    "PASS: one-click unsubscribe, tampered signature rejection, old-link replay protection and request-size limit.",
  );

  const violations = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    violations.violations.map((item) => item.id),
    [],
  );
  await page.goto(`${origin}/forgot-password`);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible();
  const reset = await messageFor(email, "Reset your Stillmark password");
  const resetUrl = reset.text.match(/http:\/\/127\.0\.0\.1:3001\/[^\s]+/)?.[0];
  assert.ok(resetUrl);
  await otherPage.goto(resetUrl);
  await otherPage.getByLabel("New password", { exact: true }).fill(newPassword);
  await otherPage.getByRole("button", { name: "Update password" }).click();
  await expect(
    otherPage.getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
  await page.goto(`${origin}/settings`);
  await expect(
    page.getByRole("link", { name: "Sign in to an existing account" }),
  ).toBeVisible();
  await login(page, email);
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Unable to sign in",
  );
  await login(page, email, newPassword);
  await expect(page).toHaveURL(`${origin}/`);
  console.log(
    "PASS: password-reset SMTP delivery, password change and old-session revocation.",
  );

  await page.goto(`${origin}/settings`);
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click();
  for (const cancel of ["button", "escape", "close", "outside"]) {
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill(newPassword);
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    if (cancel === "button")
      await page.getByRole("button", { name: "Keep my data" }).click();
    else if (cancel === "escape") await page.keyboard.press("Escape");
    else if (cancel === "close")
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Close", exact: true })
        .click();
    else await page.mouse.click(10, 100);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Delete account", exact: true })
      .click();
    await expect(
      page.getByLabel("Confirm your password", { exact: true }),
    ).toHaveValue("");
    await expect(page.getByLabel("Type DELETE to confirm")).toHaveValue("");
  }
  console.log(
    "PASS: deletion cancellation by button, Escape, close control and outside click clears both sensitive fields.",
  );
  await page
    .getByLabel("Confirm your password", { exact: true })
    .fill("wrong-password-value");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page
    .getByRole("button", { name: "Permanently delete account" })
    .click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Could not delete",
  );
  await page
    .getByLabel("Confirm your password", { exact: true })
    .fill(newPassword);
  await page
    .getByRole("button", { name: "Permanently delete account" })
    .click();
  await expect(page).toHaveURL(`${origin}/`);
  await login(page, email, newPassword);
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Unable to sign in",
  );
  console.log(
    "PASS: password-confirmed deletion, wrong-password rejection and removed-account login rejection.",
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message.replace(/token=[^\s&"']+/g, "token=[redacted]")
      : "Account integration failed.",
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
}
