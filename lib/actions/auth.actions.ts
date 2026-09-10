"use server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { registrationOpen } from "@/lib/legal";
import { policyVersion } from "@/lib/brand";
import { ObjectId } from "mongodb";
import { isIsolatedTestEnvironment } from "@/lib/test-mode";
import { permitAuthAttempt } from "@/lib/auth-rate-limit";
import { permitUserAction } from "@/lib/rate-limit";

type Credentials = { email: string; password: string };
function validEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    (!isIsolatedTestEnvironment() ||
      /^[a-z0-9._+-]+@example\.test$/i.test(email))
  );
}
export async function signUpWithEmail(
  input: Credentials & { fullName?: string; acceptTerms: boolean },
) {
  if (!registrationOpen)
    return {
      success: false,
      error:
        "New accounts are not open yet. You can explore the guest workspace without registering.",
    };
  if (
    !input ||
    !validEmail(input.email) ||
    typeof input.password !== "string" ||
    input.password.length < 12 ||
    input.password.length > 128 ||
    input.acceptTerms !== true
  )
    return {
      success: false,
      error:
        "Enter a valid email, a password of 12–128 characters, and accept the terms.",
    };
  if (
    input.fullName !== undefined &&
    (typeof input.fullName !== "string" || input.fullName.length > 80)
  )
    return {
      success: false,
      error: "Display names must be 80 characters or fewer.",
    };
  try {
    if (!(await permitAuthAttempt("sign-up", input.email, await headers())))
      return {
        success: false,
        error: "Too many attempts. Please try again later.",
      };
    const auth = await getAuth();
    const result = await auth.api.signUpEmail({
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        name: input.fullName?.trim() || "Stillmark reader",
        callbackURL: "/sign-in?verified=1",
      },
      headers: await headers(),
    });
    if (!result?.user)
      return {
        success: false,
        error:
          "Unable to create an account. Try signing in if you already have one.",
      };
    return { success: true, verificationRequired: true };
  } catch {
    return {
      success: false,
      error:
        "Unable to complete signup. If you already registered, check your verification email or try signing in.",
    };
  }
}
export async function signInWithEmail(input: Credentials) {
  if (
    !input ||
    !validEmail(input.email) ||
    typeof input.password !== "string" ||
    !input.password ||
    input.password.length > 128
  )
    return { success: false, error: "Enter your email and password." };
  try {
    if (!(await permitAuthAttempt("sign-in", input.email, await headers())))
      return {
        success: false,
        error: "Too many attempts. Please try again later.",
      };
    const auth = await getAuth();
    await auth.api.signInEmail({
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        callbackURL: "/sign-in?verified=1",
      },
      headers: await headers(),
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error:
        "Unable to sign in. Check your credentials. If your email is unverified, check your inbox for a fresh verification link or try again later.",
    };
  }
}
export async function signOut() {
  try {
    const auth = await getAuth();
    await auth.api.signOut({ headers: await headers() });
    return { success: true };
  } catch {
    return { success: false, error: "Could not sign out. Please try again." };
  }
}
export async function requestPasswordReset(email: string) {
  if (!validEmail(email))
    return { success: false, error: "Enter a valid email address." };
  try {
    if (!(await permitAuthAttempt("request-reset", email, await headers())))
      return {
        success: false,
        error: "Too many attempts. Please try again later.",
      };
    const auth = await getAuth();
    await auth.api.requestPasswordReset({
      body: {
        email: email.trim().toLowerCase(),
        redirectTo: "/reset-password",
      },
      headers: await headers(),
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "The email service is unavailable. Please try again later.",
    };
  }
}
export async function resetPassword(input: {
  token: string;
  password: string;
}) {
  if (
    !input ||
    typeof input.token !== "string" ||
    !input.token ||
    input.token.length > 512 ||
    typeof input.password !== "string" ||
    input.password.length < 12 ||
    input.password.length > 128
  )
    return {
      success: false,
      error: "Use a valid reset link and a password of 12–128 characters.",
    };
  try {
    if (
      !(await permitAuthAttempt("reset-password", input.token, await headers()))
    )
      return {
        success: false,
        error: "Too many attempts. Please try again later.",
      };
    const auth = await getAuth();
    await auth.api.resetPassword({
      body: { token: input.token, newPassword: input.password },
      headers: await headers(),
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "This reset link is invalid or expired. Request a new one.",
    };
  }
}
export async function exportAccount() {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return {
        success: false as const,
        error: "Sign in to export your account.",
      };
    const connection = await connectToDatabase();
    const db = connection.connection.db!;
    const watchlist = await db
      .collection("watchlists")
      .find(
        { userId: session.user.id },
        { projection: { _id: 0, symbol: 1, company: 1, createdAt: 1 } },
      )
      .toArray();
    const userFilter = ObjectId.isValid(session.user.id)
      ? { _id: new ObjectId(session.user.id) }
      : { id: session.user.id };
    const profile = await db.collection("user").findOne(userFilter, {
      projection: {
        _id: 0,
        name: 1,
        email: 1,
        emailVerified: 1,
        createdAt: 1,
        updatedAt: 1,
        termsVersion: 1,
        termsAcceptedAt: 1,
      },
    });
    return {
      success: true as const,
      data: JSON.parse(
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          profile,
          watchlist,
          newsSubscription: await db.collection("newsSubscriptions").findOne(
            { userId: session.user.id },
            {
              projection: {
                _id: 0,
                active: 1,
                consentedAt: 1,
                consentVersion: 1,
                unsubscribedAt: 1,
              },
            },
          ),
          emailJobs: await db
            .collection("briefJobs")
            .find(
              { userId: session.user.id },
              {
                projection: {
                  _id: 0,
                  status: 1,
                  createdAt: 1,
                  sentAt: 1,
                  expiresAt: 1,
                },
              },
            )
            .toArray(),
          policyVersion,
        }),
      ),
    };
  } catch {
    return {
      success: false as const,
      error: "Could not export account data. Please try again.",
    };
  }
}
export async function deleteAccount(password: string) {
  if (typeof password !== "string" || !password || password.length > 128)
    return {
      success: false,
      error: "Enter your password to confirm deletion.",
    };
  try {
    const auth = await getAuth(),
      requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user.emailVerified)
      return { success: false, error: "Sign in to delete your account." };
    if (!(await permitUserAction(session.user.id, "delete-account", 10, 900)))
      return {
        success: false,
        error: "Too many attempts. Please try again in 15 minutes.",
      };
    await auth.api.deleteUser({ body: { password }, headers: requestHeaders });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not delete the account. Check your password and try again.",
    };
  }
}
