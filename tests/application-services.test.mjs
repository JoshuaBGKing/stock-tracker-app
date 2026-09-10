import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isIsolatedTestEnvironment,
  assertTestIsolation,
} from "../lib/test-mode.ts";
import { parseResearchInsight } from "../lib/insight-schema.ts";
import { normaliseSymbol, parseQuoteSymbols } from "../lib/market-symbols.ts";

test("quote batches normalise symbols and reject invalid or oversized requests", () => {
  assert.equal(normaliseSymbol(["AAPL", "MSFT"]), null);
  assert.equal(normaliseSymbol(" brk.b "), "BRK.B");
  assert.deepEqual(parseQuoteSymbols("aapl,MSFT,AAPL"), ["AAPL", "MSFT"]);
  assert.equal(parseQuoteSymbols("AAPL,,MSFT"), null);
  assert.equal(parseQuoteSymbols("https://example.test"), null);
  assert.equal(parseQuoteSymbols("AAPL,<script>"), null);
  assert.equal(parseQuoteSymbols(Array(11).fill("AAPL").join(",")), null);
  assert.equal(parseQuoteSymbols("x".repeat(261)), null);
});

const isolated = {
  APP_TEST_MODE: "true",
  NODE_ENV: "development",
  MONGODB_URI: "mongodb://127.0.0.1:40000/stillmark_test_workspace",
  BETTER_AUTH_URL: "http://127.0.0.1:3001",
  MAIL_MODE: "smtp",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "2525",
};
test("test registration requires an isolated database, app and mail sink", () => {
  assert.equal(isIsolatedTestEnvironment(isolated), true);
  for (const replacement of [
    { NODE_ENV: "production" },
    { APP_TEST_MODE: "false" },
    { MONGODB_URI: "mongodb://127.0.0.1:40000/production" },
    {
      MONGODB_URI: "mongodb+srv://remote.example.test/stillmark_test_workspace",
    },
    { BETTER_AUTH_URL: "https://public.example.test" },
    { SMTP_HOST: "smtp.example.test" },
    { MAIL_MODE: "gmail" },
  ])
    assert.equal(
      isIsolatedTestEnvironment({ ...isolated, ...replacement }),
      false,
    );
});
test("unsafe test configuration fails closed rather than using real providers", () => {
  assert.throws(() =>
    assertTestIsolation({ ...isolated, SMTP_HOST: "smtp.example.test" }),
  );
  assert.throws(() =>
    assertTestIsolation({ ...isolated, NODE_ENV: "production" }),
  );
  assert.doesNotThrow(() => assertTestIsolation(isolated));
  assert.doesNotThrow(() => assertTestIsolation({}));
});
test("AI output schema rejects empty, oversized, nontext and HTML values", () => {
  const valid = {
    summary: "A neutral research note.",
    observations: ["A sourced observation."],
    questions: ["What should be checked?"],
  };
  assert.deepEqual(parseResearchInsight(valid), valid);
  for (const value of [
    null,
    {},
    { ...valid, summary: "" },
    { ...valid, summary: "x".repeat(1201) },
    { ...valid, observations: [] },
    { ...valid, observations: Array(5).fill("test") },
    { ...valid, questions: ["<script>alert(1)</script>"] },
    { ...valid, questions: [32] },
  ])
    assert.throws(() => parseResearchInsight(value));
});
