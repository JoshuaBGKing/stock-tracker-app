import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Own the Next process tree explicitly: Playwright's shell-managed webServer
// can leave Next children holding stdio open on Windows after tests finish.
const origin = "http://127.0.0.1:3100";
const env = {
  ...process.env,
  STILLMARK_E2E_MANAGED_SERVER: "true",
  MARKET_DATA_MODE: "sample",
  NEXT_TELEMETRY_DISABLED: "1",
  APP_TEST_MODE: "false",
  ENABLE_REGISTRATION: "false",
  ENABLE_INNGEST_DEV: "false",
  ENABLE_AI_INSIGHTS: "false",
  ENABLE_BACKGROUND_EMAIL: "false",
};
let app, runner;
async function terminate(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null)
    return;
  if (process.platform === "win32") {
    const kill = spawn(
      "taskkill.exe",
      ["/PID", String(child.pid), "/T", "/F"],
      {
        windowsHide: true,
        stdio: "ignore",
      },
    );
    await new Promise((done, reject) => {
      kill.once("error", reject);
      kill.once("exit", (code) => {
        if (code === 0 || child.exitCode !== null || child.signalCode !== null)
          done();
        else
          reject(
            new Error(
              `Could not stop owned test process ${child.pid}; process-management permission is required.`,
            ),
          );
      });
    });
  } else child.kill("SIGTERM");
}
async function cleanup() {
  await terminate(runner);
  await terminate(app);
}
process.once("SIGINT", () => void cleanup());
process.once("SIGTERM", () => void cleanup());
try {
  // Never silently reuse or terminate a server belonging to another task.
  const probe = createServer();
  await new Promise((done, reject) => {
    probe.once("error", () =>
      reject(
        new Error(
          "Port 3100 is in use. Stop that test server before running the UI suite.",
        ),
      ),
    );
    probe.listen(3100, "127.0.0.1", done);
  });
  await new Promise((done) => probe.close(done));
  let diagnostic = "";
  app = spawn(
    process.execPath,
    [
      resolve("node_modules/next/dist/bin/next"),
      "dev",
      "--turbopack",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3100",
    ],
    {
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  app.on("error", () => {
    diagnostic = "Could not start the test application.";
  });
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (chunk) => {
      diagnostic = (diagnostic + chunk.toString()).slice(-6000);
    });
  let ready = false;
  // A cold compile after upgrading Next can exceed two minutes on Windows.
  // This affects startup only; browser/assertion timeouts remain unchanged.
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline && app.exitCode === null) {
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(5000),
      });
      await response.body?.cancel();
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the owned server to compile. */
    }
    await delay(250);
  }
  if (!ready)
    throw new Error(`UI test application did not become ready.\n${diagnostic}`);
  runner = spawn(
    process.execPath,
    [
      resolve("node_modules/@playwright/test/cli.js"),
      "test",
      ...process.argv.slice(2),
    ],
    {
      env,
      windowsHide: true,
      stdio: "inherit",
    },
  );
  process.exitCode = await new Promise((done, reject) => {
    runner.once("error", reject);
    runner.once("exit", (code) => done(code ?? 1));
  });
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "UI test runner failed.",
  );
  process.exitCode = 1;
} finally {
  await cleanup();
}
