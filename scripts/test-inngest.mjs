// Sends synthetic events exclusively to the local dev server. No .env or keys
// are loaded, and redirects are rejected to avoid accidentally sending remotely.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

async function localJson(path, options = {}) {
  const response = await fetch(`http://127.0.0.1:8288${path}`, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Local Inngest returned HTTP ${response.status}.`);
  return response.json();
}

try {
  const infoResponse = await fetch("http://127.0.0.1:3000/api/inngest", {
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
  const info = await infoResponse.json();
  assert.equal(
    info.mode,
    "dev",
    "Start the app with npm.cmd run dev (not npm.cmd start).",
  );
  assert.equal(
    info.function_count,
    2,
    "Expected both local preview workflows.",
  );

  // Explicitly sync before sending, so events aren't lost to discovery timing.
  const sync = await fetch("http://127.0.0.1:3000/api/inngest", {
    method: "PUT",
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
  if (!sync.ok)
    throw new Error(
      "Could not sync the local app. Start npm.cmd run inngest:dev first.",
    );

  for (const name of ["app/user.created", "app/send.daily.news"]) {
    const event = await localJson("/e/stillmark-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `stillmark-test-${randomUUID()}`,
        name,
        data:
          name === "app/send.daily.news"
            ? { symbols: ["AAPL", "MSFT", "NVDA"] }
            : {},
      }),
    });
    assert.ok(event.ids?.[0], "Inngest did not accept the test event.");
    const deadline = Date.now() + 45000;
    let completed = false;
    while (Date.now() < deadline) {
      const result = await localJson(`/v1/events/${event.ids[0]}/runs`);
      const runs = result.data ?? [];
      const run =
        runs.find((item) => item.function_id?.startsWith("stillmark-local-")) ??
        runs[0];
      if (run?.status === "Completed") {
        const output =
          typeof run.output === "string" ? JSON.parse(run.output) : run.output;
        assert.equal(output?.mode, "local-preview");
        assert.equal(output?.delivered, false);
        assert.match(output?.message?.subject ?? "", /LOCAL PREVIEW/);
        console.log(`${name}: completed — preview rendered; no email sent.`);
        completed = true;
        break;
      }
      if (run?.status === "Failed" || run?.status === "Cancelled")
        throw new Error(
          `${name}: ${run.status}. Inspect the run at http://localhost:8288.`,
        );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!completed)
      throw new Error(`${name}: timed out. Check http://localhost:8288/runs.`);
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Local workflow test failed.",
  );
  console.error(
    "Keep npm.cmd run dev and npm.cmd run inngest:dev running in separate terminals.",
  );
  process.exitCode = 1;
}
