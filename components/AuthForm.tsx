"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";
import {
  signInWithEmail,
  signUpWithEmail,
  requestPasswordReset,
  resetPassword,
} from "@/lib/actions/auth.actions";
export function AuthForm({
  mode,
  token,
}: {
  mode: "sign-in" | "sign-up" | "forgot" | "reset";
  token?: string;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [complete, setComplete] = useState(false),
    [visible, setVisible] = useState(false);
  const router = useRouter();
  const hydrated = useHydrated();
  const signup = mode === "sign-up",
    forgot = mode === "forgot",
    reset = mode === "reset";
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || ""),
      password = String(data.get("password") || "");
    try {
      const result = forgot
        ? await requestPasswordReset(email)
        : reset
          ? await resetPassword({ token: token || "", password })
          : signup
            ? await signUpWithEmail({
                email,
                password,
                fullName: String(data.get("fullName") || ""),
                acceptTerms: data.get("terms") === "on",
              })
            : await signInWithEmail({ email, password });
      if (!result.success) {
        setError(result.error || "Please try again.");
        return;
      }
      if (mode === "sign-in") {
        router.push("/");
        router.refresh();
      } else setComplete(true);
    } catch {
      setError(
        "The account service is temporarily unavailable. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  if (complete)
    return (
      <>
        <span className="eyebrow">One more step</span>
        <h1>{reset ? "A fresh start." : "Check your inbox."}</h1>
        <p>
          {reset
            ? "Your password has been updated. You can now sign in."
            : signup
              ? "If your signup was accepted, a verification link has been sent to your email. Open it to activate your account."
              : "If that email belongs to an account, we’ve sent a password reset link. Check your spam folder too."}
        </p>
        <Link className="button primary" href="/sign-in">
          Back to sign in <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </>
    );
  return (
    <>
      <span className="eyebrow">
        {signup
          ? "Make a space of your own"
          : forgot || reset
            ? "Account recovery"
            : "Your workspace is waiting"}
      </span>
      <h1>
        {signup
          ? "A clearer view starts here."
          : forgot
            ? "Forgot your password?"
            : reset
              ? "Choose a new password."
              : "Welcome back."}
      </h1>
      <p>
        {signup
          ? "Save your watchlist across devices. An email, a password, and a little curiosity."
          : forgot
            ? "Enter your account email and we’ll send a reset link."
            : reset
              ? "Use a unique password of at least 12 characters."
              : "Sign in and pick up where your curiosity left off."}
      </p>
      <form onSubmit={submit} aria-busy={pending}>
        {signup && (
          <div className="field">
            <label htmlFor="fullName">
              Display name{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="nickname"
              maxLength={80}
              placeholder="What should we call you?"
            />
          </div>
        )}
        {!reset && (
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@example.com"
            />
          </div>
        )}
        {!forgot && (
          <div className="field">
            <label htmlFor="password">
              {reset ? "New password" : "Password"}
            </label>
            <div className="relative">
              <input
                id="password"
                className="pr-12!"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={
                  signup || reset ? "new-password" : "current-password"
                }
                required
                minLength={signup || reset ? 12 : 1}
                maxLength={128}
                aria-describedby={signup || reset ? "password-hint" : undefined}
              />
              <button
                className="absolute right-1 top-1 flex items-center justify-center w-9 h-9 text-muted-foreground"
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((value) => !value)}
              >
                {visible ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Eye size={17} aria-hidden="true" />
                )}
              </button>
            </div>
            {(signup || reset) && (
              <small id="password-hint">
                12–128 characters. A password manager or passphrase works well.
              </small>
            )}
          </div>
        )}
        {signup && (
          <>
            <label className="check-row">
              <input type="checkbox" name="terms" required />
              <span>
                I accept the <Link href="/terms">Terms & conditions</Link>. The{" "}
                <Link href="/privacy">Privacy policy</Link> explains how my
                account data is used.
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground mb-5">
              No marketing subscription is included. Verification and password
              reset emails are sent only to provide account services.
            </p>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="button primary full"
          disabled={pending || !hydrated}
        >
          {pending
            ? "Please wait…"
            : signup
              ? "Create account"
              : forgot
                ? "Send reset link"
                : reset
                  ? "Update password"
                  : "Sign in"}
          {!pending && <ArrowRight size={15} aria-hidden="true" />}
        </button>
        {mode === "sign-in" && (
          <div className="flex justify-between gap-5 mt-5 text-xs">
            <Link href="/forgot-password" className="text-link">
              Forgot password?
            </Link>
            <Link href="/sign-up" className="text-link">
              Create an account
            </Link>
          </div>
        )}
        {signup && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-link">
              Sign in
            </Link>
          </p>
        )}
      </form>
    </>
  );
}
