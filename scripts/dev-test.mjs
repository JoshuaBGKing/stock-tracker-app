import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { startLocalServices } from "./local-services.mjs";

let services,
  app,
  stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (app && app.exitCode === null) {
    // Next owns a child process on Windows. Terminate only this launched tree.
    if (process.platform === "win32") {
      const kill = spawn(
        "taskkill.exe",
        ["/PID", String(app.pid), "/T", "/F"],
        { windowsHide: true, stdio: "ignore" },
      );
      await new Promise((done) => kill.once("exit", done));
    } else app.kill("SIGTERM");
  }
  await services?.stop();
  console.log(
    "Test services stopped; disposable accounts and inbox discarded.",
  );
  process.exitCode = code;
}
process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
try {
  console.log(
    "Preparing isolated MongoDB and SMTP inbox (first run may download MongoDB)...",
  );
  services = await startLocalServices();
  app = spawn(
    process.execPath,
    [
      resolve("node_modules/next/dist/bin/next"),
      "dev",
      "--turbopack",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3001",
    ],
    {
      stdio: "inherit",
      windowsHide: true,
      env: { ...process.env, ...services.env },
    },
  );
  app.once("error", () => void stop(1));
  app.once("exit", (code) => {
    if (!stopping) void stop(code || 0);
  });
  console.log("Test app: http://127.0.0.1:3001 — inbox: http://127.0.0.1:8025");
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Could not start isolated services.",
  );
  await stop(1);
}
