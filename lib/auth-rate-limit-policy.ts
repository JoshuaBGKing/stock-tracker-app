import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export type AuthAction =
  "sign-up" | "sign-in" | "request-reset" | "reset-password";
export type AuthLimitRule = {
  id: string;
  limit: number;
  expiresAt: Date;
};
type RequestHeaders = Pick<Headers, "get">;
type Context = { secret: string; now?: number };

const actionLimits: Record<
  AuthAction,
  { total: number; subject: number; ip: number }
> = {
  "sign-up": { total: 60, subject: 3, ip: 10 },
  "sign-in": { total: 300, subject: 10, ip: 30 },
  "request-reset": { total: 60, subject: 3, ip: 10 },
  "reset-password": { total: 120, subject: 5, ip: 20 },
};

// Never infer trust from x-forwarded-for, Forwarded, or another client header.
// Opt-in is safe only when ingress overwrites this header and direct access is blocked.
export function trustedClientIp(
  headers: RequestHeaders,
  configuredHeader?: string,
) {
  const name = configuredHeader?.trim().toLowerCase();
  if (!name || !/^[a-z0-9-]{1,80}$/.test(name)) return null;
  const value = headers.get(name)?.trim();
  if (!value || value.length > 45 || !isIP(value)) return null;
  return isIP(value) === 6
    ? new URL(`http://[${value}]`).hostname.slice(1, -1)
    : value;
}

function rule(
  context: Context,
  scope: string,
  subject: string,
  limit: number,
  seconds: number,
): AuthLimitRule {
  if (!context.secret || context.secret.length < 32)
    throw new Error("A strong authentication secret is required");
  const now = context.now ?? Date.now();
  if (!Number.isFinite(now)) throw new Error("Invalid rate-limit clock");
  const bucket = Math.floor(now / (seconds * 1000));
  return {
    id: createHmac("sha256", context.secret)
      .update(
        JSON.stringify(["stillmark-auth-v2", scope, subject, seconds, bucket]),
      )
      .digest("hex"),
    limit,
    // Retain beyond the bucket boundary; Mongo TTL deletion is asynchronous.
    expiresAt: new Date((bucket + 2) * seconds * 1000),
  };
}

export function authAttemptRules(
  input: Context & {
    action: AuthAction;
    subject: string;
    headers: RequestHeaders;
    trustedIpHeader?: string;
  },
) {
  const limits = actionLimits[input.action];
  if (
    !limits ||
    typeof input.subject !== "string" ||
    !input.subject ||
    input.subject.length > 512
  )
    throw new Error("Invalid authentication attempt");
  const subject =
    input.action === "reset-password"
      ? input.subject
      : input.subject.trim().toLowerCase();
  const ip = trustedClientIp(input.headers, input.trustedIpHeader);
  return [
    // Global rules come first: rotating subjects cannot create unbounded rows or work.
    rule(input, "all-minute", "site", 120, 60),
    rule(input, "all-hour", "site", 1000, 3600),
    rule(input, `action:${input.action}`, "site", limits.total, 900),
    ...(ip ? [rule(input, `ip:${input.action}`, ip, limits.ip, 900)] : []),
    rule(input, `subject:${input.action}`, subject, limits.subject, 900),
  ];
}

export function authMailRules(
  input: Context & { email: string; kind: "verify" | "reset" },
) {
  if (
    typeof input.email !== "string" ||
    !input.email ||
    input.email.length > 254
  )
    throw new Error("Invalid authentication email");
  const email = input.email.trim().toLowerCase();
  return [
    rule(input, "mail-minute", "site", 30, 60),
    rule(input, "mail-hour", "site", 200, 3600),
    rule(input, "mail-recipient", email, 8, 900),
    rule(input, `mail:${input.kind}`, email, 5, 900),
  ];
}

export async function permitAuthRules(
  rules: AuthLimitRule[],
  consume: (rule: AuthLimitRule) => Promise<boolean>,
) {
  for (const item of rules) if (!(await consume(item))) return false;
  return true;
}
