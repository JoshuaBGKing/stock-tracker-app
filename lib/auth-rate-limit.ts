import "server-only";
import { connectToDatabase } from "@/database/mongoose";
import {
  authAttemptRules,
  authMailRules,
  permitAuthRules,
  type AuthAction,
  type AuthLimitRule,
} from "./auth-rate-limit-policy";
import {
  consumeAuthLimit,
  type AuthLimitCounter,
} from "./auth-rate-limit-store";

async function permit(rules: AuthLimitRule[]) {
  const db = (await connectToDatabase()).connection.db!;
  const attempts = db.collection<AuthLimitCounter>("authActionLimits");
  await attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return permitAuthRules(rules, (item) => consumeAuthLimit(attempts, item));
}

export async function permitAuthAttempt(
  action: AuthAction,
  subject: string,
  requestHeaders: Pick<Headers, "get">,
) {
  return permit(
    authAttemptRules({
      action,
      subject,
      headers: requestHeaders,
      trustedIpHeader: process.env.AUTH_TRUSTED_IP_HEADER,
      secret: process.env.BETTER_AUTH_SECRET || "",
    }),
  );
}

export async function permitAuthMail(email: string, kind: "verify" | "reset") {
  return permit(
    authMailRules({
      email,
      kind,
      secret: process.env.BETTER_AUTH_SECRET || "",
    }),
  );
}
