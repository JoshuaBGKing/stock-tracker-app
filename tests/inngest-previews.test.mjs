import { test } from "node:test";
import assert from "node:assert/strict";
import { localWorkflowsEnabled } from "../lib/inngest/local-mode.ts";
import {
  readPreviewSymbols,
  welcomeEmailPreview,
  dailyNewsPreview,
} from "../lib/inngest/previews.ts";
import { sampleSnapshot } from "../lib/market-catalog.ts";

test("workflow handler is enabled only in development and can be disabled", () => {
  assert.equal(localWorkflowsEnabled({ NODE_ENV: "development" }), true);
  assert.equal(
    localWorkflowsEnabled({
      NODE_ENV: "development",
      ENABLE_INNGEST_DEV: "false",
    }),
    false,
  );
  for (const NODE_ENV of [undefined, "test", "production"])
    assert.equal(
      localWorkflowsEnabled({ NODE_ENV, ENABLE_INNGEST_DEV: "true" }),
      false,
    );
});

test("test events use default or unique bounded symbols", () => {
  assert.deepEqual(readPreviewSymbols({}), ["AAPL", "MSFT", "NVDA"]);
  assert.deepEqual(readPreviewSymbols({ symbols: ["MSFT", "MSFT"] }), ["MSFT"]);
  for (const data of [
    "bad",
    [],
    { symbols: [] },
    { symbols: ["<script>"] },
    { symbols: Array(11).fill("AAPL") },
  ])
    assert.throws(() => readPreviewSymbols(data));
});

test("personal fields and arbitrary recipient overrides are rejected", () => {
  for (const data of [
    { email: "reader@example.test" },
    { userId: "test-user" },
    { to: "reader@example.test" },
    { riskProfile: "high" },
  ])
    assert.throws(() => readPreviewSymbols(data), /personal data/);
});

test("welcome workflow renders an explicitly unsent reserved-address preview", () => {
  const preview = welcomeEmailPreview();
  assert.equal(preview.delivered, false);
  assert.equal(preview.mode, "local-preview");
  assert.equal(preview.message.to, "reader@example.test");
  assert.match(preview.message.subject, /LOCAL PREVIEW/);
  assert.match(preview.message.text, /No email was sent/);
});

test("news workflow uses only selected sample instruments and labels fixtures", () => {
  const preview = dailyNewsPreview(sampleSnapshot(), ["AAPL", "NVDA"]);
  assert.equal(preview.delivered, false);
  assert.equal(preview.dataSource, "illustrative-fixtures");
  assert.match(preview.message.text, /AAPL/);
  assert.match(preview.message.text, /NVDA/);
  assert.doesNotMatch(preview.message.text, /MSFT/);
  assert.match(preview.message.text, /not current prices or real news/);
  assert.match(preview.message.text, /not AI-generated/);
});

test("news previews reject real market snapshots and unsupported symbols", () => {
  assert.throws(() =>
    dailyNewsPreview({ ...sampleSnapshot(), mode: "market" }, ["AAPL"]),
  );
  assert.throws(
    () => dailyNewsPreview(sampleSnapshot(), ["XXXXX"]),
    /No local sample/,
  );
});
