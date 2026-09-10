import "server-only";
import nodemailer from "nodemailer";
import {
  assertTestIsolation,
  isIsolatedTestEnvironment,
} from "@/lib/test-mode";

function transport() {
  assertTestIsolation();
  if (process.env.MAIL_MODE === "smtp") {
    const local = isIsolatedTestEnvironment();
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error("SMTP is not configured");
    if (process.env.SMTP_USER && !process.env.SMTP_PASSWORD)
      throw new Error("SMTP password is missing");
    return nodemailer.createTransport({
      host,
      port,
      secure: !local && port === 465,
      requireTLS: !local,
      ignoreTLS: local,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD)
    throw new Error("Account email is not configured");
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function sendServiceEmail(input: {
  to: string;
  subject: string;
  text: string;
  messageId?: string;
  unsubscribeUrl?: string;
}) {
  assertTestIsolation();
  const from = process.env.MAIL_FROM || process.env.NODEMAILER_EMAIL || "";
  const emailPattern = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;
  if (!emailPattern.test(from) || !emailPattern.test(input.to))
    throw new Error("Email addresses are not configured correctly");
  if (
    isIsolatedTestEnvironment() &&
    !/^[a-z0-9._+-]+@example\.test$/i.test(input.to)
  )
    throw new Error(
      "Only @example.test recipients are allowed in the test workspace",
    );
  const oneClick = input.unsubscribeUrl ? new URL(input.unsubscribeUrl) : null;
  if (oneClick) oneClick.pathname = "/api/unsubscribe";
  const result = await transport().sendMail({
    from: { name: "Stillmark", address: from },
    to: input.to,
    subject: input.subject,
    text: input.text,
    messageId: input.messageId,
    disableFileAccess: true,
    disableUrlAccess: true,
    ...(input.unsubscribeUrl
      ? {
          headers: {
            "List-Unsubscribe": `<${oneClick}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }
      : {}),
  });
  if (!result.accepted?.length)
    throw new Error("Mail server did not accept the message");
}
export async function sendAccountEmail(
  email: string,
  url: string,
  kind: "verify" | "reset",
) {
  const base = process.env.BETTER_AUTH_URL;
  if (!base || new URL(url).origin !== new URL(base).origin)
    throw new Error("Unexpected email link");
  const title =
    kind === "verify"
      ? "Verify your Stillmark email"
      : "Reset your Stillmark password";
  const description =
    kind === "verify"
      ? "Confirm your email address to finish creating your account."
      : "Use this link to choose a new password. If you did not request a reset, you can ignore this email.";
  await sendServiceEmail({
    to: email,
    subject: title,
    text: `${title}\n\n${description}\n\n${url}\n\nThis is an account service email, not a marketing subscription.`,
  });
}
