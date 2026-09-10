import fs from "node:fs";
import path from "node:path";
const keys = [
  "BETTER_AUTH_SECRET",
  "MONGODB_URI",
  "FINNHUB_API_KEY",
  "NEXT_PUBLIC_FINNHUB_API_KEY",
  "NODEMAILER_PASSWORD",
  "SMTP_PASSWORD",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "GEMINI_API_KEY",
];
if (!fs.existsSync(".next/static")) {
  console.error("Build the application before checking client bundles.");
  process.exit(1);
}
const files = fs
  .readdirSync(".next/static", { recursive: true })
  .filter((file) => file.endsWith(".js"));
const exposedSecretNames = [];
for (const key of keys) {
  const value = process.env[key];
  if (
    value &&
    value.length > 8 &&
    files.some((file) =>
      fs.readFileSync(path.join(".next/static", file), "utf8").includes(value),
    )
  )
    exposedSecretNames.push(key);
}
console.log(
  JSON.stringify({ clientBundlesChecked: files.length, exposedSecretNames }),
);
process.exitCode = exposedSecretNames.length ? 1 : 0;
