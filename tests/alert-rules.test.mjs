import { test } from "node:test";
import assert from "node:assert/strict";
import { triggeredAlerts } from "../lib/alert-rules.ts";
import { sampleSnapshot } from "../lib/market-catalog.ts";
const now = 1800000000000;
const alert = { id: "test", symbol: "AAPL", direction: "above", target: 200 };
function snapshot(price = 201, timestamp = now / 1000) {
  return {
    mode: "market",
    quotes: [
      { symbol: "AAPL", price, timestamp, currency: "USD", source: "provider" },
    ],
    fetchedAt: "",
    message: "",
  };
}
test("sample data can never trigger a real price alert", () =>
  assert.deepEqual(triggeredAlerts([alert], sampleSnapshot(), now), []));
test("fresh quotes trigger above and inclusive equality targets", () => {
  assert.equal(triggeredAlerts([alert], snapshot(201), now).length, 1);
  assert.equal(triggeredAlerts([alert], snapshot(200), now).length, 1);
  assert.equal(triggeredAlerts([alert], snapshot(199), now).length, 0);
});
test("below targets use inclusive comparison", () => {
  assert.equal(
    triggeredAlerts([{ ...alert, direction: "below" }], snapshot(199), now)
      .length,
    1,
  );
  assert.equal(
    triggeredAlerts([{ ...alert, direction: "below" }], snapshot(201), now)
      .length,
    0,
  );
});
test("stale, future, missing and null quotes do not trigger", () => {
  for (const data of [
    snapshot(201, now / 1000 - 301),
    snapshot(201, now / 1000 + 61),
    snapshot(null),
    { ...snapshot(), quotes: [] },
  ])
    assert.deepEqual(triggeredAlerts([alert], data, now), []);
});
test("a fired alert does not fire twice", () =>
  assert.deepEqual(
    triggeredAlerts([{ ...alert, triggeredAt: "already" }], snapshot(), now),
    [],
  ));

test("selected-symbol quotes trigger an alert outside the overview catalogue", () => {
  const custom = { ...alert, symbol: "IBM" };
  const data = {
    ...snapshot(),
    quotes: [
      {
        symbol: "IBM",
        price: 201,
        timestamp: now / 1000,
        currency: "USD",
        source: "provider",
      },
    ],
  };
  assert.deepEqual(triggeredAlerts([custom], data, now), [custom]);
  assert.deepEqual(
    triggeredAlerts([custom], { ...data, mode: "sample" }, now),
    [],
  );
});
