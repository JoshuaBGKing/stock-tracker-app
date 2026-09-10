const required = [
  "LEGAL_OPERATOR_NAME",
  "LEGAL_COUNTRY",
  "LEGAL_POSTAL_ADDRESS",
  "PRIVACY_CONTACT_EMAIL",
  "MONGODB_URI",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "FINNHUB_API_KEY",
  ...(process.env.MAIL_MODE === "smtp"
    ? [
        "SMTP_HOST",
        "SMTP_PORT",
        "MAIL_FROM",
        ...(process.env.SMTP_USER ? ["SMTP_PASSWORD"] : []),
      ]
    : ["NODEMAILER_EMAIL", "NODEMAILER_PASSWORD"]),
  ...(process.env.ENABLE_BACKGROUND_EMAIL === "true"
    ? ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"]
    : []),
  ...(process.env.ENABLE_AI_INSIGHTS === "true"
    ? ["GEMINI_API_KEY", "GEMINI_MODEL"]
    : []),
];
const missing = required.filter((name) => !process.env[name]?.trim());
for (const name of missing) console.log("MISSING " + name);
if (process.env.NEXT_PUBLIC_FINNHUB_API_KEY)
  console.log(
    "ACTION Rename NEXT_PUBLIC_FINNHUB_API_KEY to FINNHUB_API_KEY; rotate it if previously exposed.",
  );
if (
  process.env.BETTER_AUTH_URL &&
  !process.env.BETTER_AUTH_URL.startsWith("https://")
)
  console.log("ACTION Configure an HTTPS production BETTER_AUTH_URL.");
if (process.env.ENABLE_REGISTRATION !== "true")
  console.log("INFO Registration is disabled.");
if (process.env.MARKET_DATA_MODE === "sample")
  console.log("INFO Sample market data is enabled.");
if (process.env.ENABLE_AI_INSIGHTS === "true")
  console.log(
    "MANUAL Confirm Gemini service tier, regions, age restrictions, data terms, model availability and quota before public use.",
  );
if (process.env.ENABLE_BACKGROUND_EMAIL === "true")
  console.log(
    "MANUAL Sync /api/workflows with Inngest Cloud; verify signed invocations, delivery, consent and unsubscribe in staging.",
  );
if (process.env.APP_TEST_MODE === "true")
  console.log("BLOCK Test mode must never be deployed publicly.");
console.log(
  "MANUAL Review deployment providers/regions, retention, legal pages, data licensing, trademark clearance, security, accessibility and email delivery before launch.",
);
process.exitCode =
  missing.length || process.env.APP_TEST_MODE === "true" ? 1 : 0;
