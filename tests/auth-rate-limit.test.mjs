import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authAttemptRules,
  authMailRules,
  permitAuthRules,
  trustedClientIp,
} from "../lib/auth-rate-limit-policy.ts";
import { consumeAuthLimit } from "../lib/auth-rate-limit-store.ts";

const context = {
  secret: "synthetic-test-secret-at-least-32-characters",
  now: 1800000000000,
};
const headers = new Headers();
function rules(
  action = "sign-in",
  subject = "reader@example.test",
  extra = {},
) {
  return authAttemptRules({ ...context, action, subject, headers, ...extra });
}
function memoryCounter() {
  const counts = new Map();
  return async ({ id, limit }) => {
    const count = counts.get(id) || 0;
    if (count >= limit) return false;
    counts.set(id, count + 1);
    return true;
  };
}

test("rotating emails cannot evade global auth limits", async () => {
  const consume = memoryCounter();
  let allowed = 0;
  for (let index = 0; index < 200; index++)
    allowed += Number(
      await permitAuthRules(
        rules("sign-in", `reader${index}@example.test`),
        consume,
      ),
    );
  assert.equal(allowed, 120);
});

test("signup has its own aggregate cap across different email addresses", async () => {
  const consume = memoryCounter();
  let allowed = 0;
  for (let index = 0; index < 80; index++)
    allowed += Number(
      await permitAuthRules(
        rules("sign-up", `reader${index}@example.test`),
        consume,
      ),
    );
  assert.equal(allowed, 60);
});

test("an explicitly trusted IP limits rotating subjects without changing the global cap", async () => {
  const consume = memoryCounter();
  let allowed = 0;
  for (let index = 0; index < 50; index++)
    allowed += Number(
      await permitAuthRules(
        rules("sign-in", `reader${index}@example.test`, {
          headers: new Headers({ "x-ingress-client-ip": "203.0.113.7" }),
          trustedIpHeader: "x-ingress-client-ip",
        }),
        consume,
      ),
    );
  assert.equal(allowed, 30);
});

test("spoofed forwarding headers are ignored unless a single-IP ingress header is configured", () => {
  const spoof = new Headers({
    "x-forwarded-for": "203.0.113.8",
    "x-real-ip": "203.0.113.9",
    forwarded: "for=203.0.113.10",
  });
  assert.equal(trustedClientIp(spoof), null);
  assert.deepEqual(
    rules("sign-in", "reader@example.test", { headers: spoof }),
    rules(),
  );
  assert.equal(trustedClientIp(spoof, "x-real-ip"), "203.0.113.9");
  assert.equal(
    trustedClientIp(
      new Headers({ "x-real-ip": "203.0.113.1, 203.0.113.2" }),
      "x-real-ip",
    ),
    null,
  );
  assert.equal(
    trustedClientIp(
      new Headers({ "x-real-ip": "203.0.113.1:8080" }),
      "x-real-ip",
    ),
    null,
  );
  assert.equal(
    trustedClientIp(new Headers({ "x-real-ip": "not-an-ip" }), "x-real-ip"),
    null,
  );
  assert.equal(
    trustedClientIp(
      new Headers({ "x-real-ip": "2001:0db8:0000:0000:0000:0000:0000:0001" }),
      "x-real-ip",
    ),
    "2001:db8::1",
  );
});

test("recipient buckets are normalized and separated by auth action", async () => {
  assert.deepEqual(rules("sign-in", " READER@example.test "), rules());
  const consume = memoryCounter();
  for (let index = 0; index < 10; index++)
    assert.equal(await permitAuthRules(rules(), consume), true);
  assert.equal(await permitAuthRules(rules(), consume), false);
  assert.equal(await permitAuthRules(rules("request-reset"), consume), true);
  assert.notEqual(rules().at(-1).id, rules("request-reset").at(-1).id);
});

test("reset-token attempts are limited and keyed without disclosing raw subjects", async () => {
  const consume = memoryCounter();
  const tokenRules = rules("reset-password", "synthetic-reset-token");
  for (let index = 0; index < 5; index++)
    assert.equal(await permitAuthRules(tokenRules, consume), true);
  assert.equal(await permitAuthRules(tokenRules, consume), false);
  assert.ok(!JSON.stringify(tokenRules).includes("synthetic-reset-token"));
  for (const item of rules("sign-in", "reader@example.test", {
    headers: new Headers({ "x-real-ip": "203.0.113.9" }),
    trustedIpHeader: "x-real-ip",
  })) {
    assert.match(item.id, /^[0-9a-f]{64}$/);
    assert.ok(item.expiresAt.getTime() > context.now);
    assert.ok(item.expiresAt.getTime() <= context.now + 7200000);
  }
});

test("verification and recovery delivery share a mail budget across recipients", async () => {
  const consume = memoryCounter();
  let allowed = 0;
  for (let index = 0; index < 50; index++)
    allowed += Number(
      await permitAuthRules(
        authMailRules({
          ...context,
          email: `reader${index}@example.test`,
          kind: index % 2 ? "verify" : "reset",
        }),
        consume,
      ),
    );
  assert.equal(allowed, 30);
});

test("the hourly mail budget also caps requests spread across minute buckets", async () => {
  const consume = memoryCounter();
  const start = Math.floor(context.now / 3600000) * 3600000;
  let allowed = 0;
  for (let index = 0; index < 250; index++)
    allowed += Number(
      await permitAuthRules(
        authMailRules({
          ...context,
          now: start + Math.floor(index / 25) * 60000,
          email: `reader${index}@example.test`,
          kind: "verify",
        }),
        consume,
      ),
    );
  assert.equal(allowed, 200);
});

test("limiter fails closed on missing secret, unavailable storage and capped atomic updates", async () => {
  assert.throws(() => rules("sign-in", "reader@example.test", { secret: "" }));
  assert.throws(() => rules("reset-password", ""));
  assert.throws(() => rules("reset-password", "x".repeat(513)));
  await assert.rejects(
    permitAuthRules(rules(), async () => {
      throw new Error("Unavailable");
    }),
  );
  assert.equal(
    await consumeAuthLimit(
      {
        findOneAndUpdate: async () => {
          throw Object.assign(new Error("Capped"), { code: 11000 });
        },
      },
      rules()[0],
    ),
    false,
  );
  await assert.rejects(
    consumeAuthLimit(
      {
        findOneAndUpdate: async () => {
          throw new Error("Unavailable");
        },
      },
      rules()[0],
    ),
  );
});

test("the database counter atomically constrains increments and uses insertion-only expiry", async () => {
  const item = rules()[0];
  let called = false;
  assert.equal(
    await consumeAuthLimit(
      {
        findOneAndUpdate: async (filter, update, options) => {
          called = true;
          assert.deepEqual(filter, {
            _id: item.id,
            count: { $lt: item.limit },
          });
          assert.deepEqual(update, {
            $inc: { count: 1 },
            $setOnInsert: { expiresAt: item.expiresAt },
          });
          assert.deepEqual(options, { upsert: true, returnDocument: "after" });
          return { _id: item.id, count: item.limit, expiresAt: item.expiresAt };
        },
      },
      item,
    ),
    true,
  );
  assert.equal(called, true);
  assert.equal(
    await consumeAuthLimit({ findOneAndUpdate: async () => null }, item),
    false,
  );
});
