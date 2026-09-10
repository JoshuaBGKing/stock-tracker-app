type Environment = Record<string, string | undefined>;

// A flag alone must never unlock public registration or insecure SMTP.
export function isIsolatedTestEnvironment(env: Environment = process.env) {
  if (env.APP_TEST_MODE !== "true" || env.NODE_ENV !== "development")
    return false;
  try {
    const database = new URL(env.MONGODB_URI || "");
    const app = new URL(env.BETTER_AUTH_URL || "");
    return (
      database.protocol === "mongodb:" &&
      database.hostname === "127.0.0.1" &&
      !database.username &&
      !database.password &&
      /^\/stillmark_test_[a-z0-9_]+$/.test(database.pathname) &&
      app.protocol === "http:" &&
      app.hostname === "127.0.0.1" &&
      env.MAIL_MODE === "smtp" &&
      env.SMTP_HOST === "127.0.0.1" &&
      env.SMTP_PORT === "2525"
    );
  } catch {
    return false;
  }
}

export function assertTestIsolation(env: Environment = process.env) {
  if (env.APP_TEST_MODE === "true" && !isIsolatedTestEnvironment(env))
    throw new Error(
      "Test mode requires an isolated local database, app origin and mail sink. Use npm.cmd run dev:test.",
    );
}
