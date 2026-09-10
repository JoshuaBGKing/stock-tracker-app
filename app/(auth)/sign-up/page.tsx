import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { registrationOpen } from "@/lib/legal";
export const metadata: Metadata = { title: "Create your account" };
export default function SignUpPage() {
  return registrationOpen ? (
    <AuthForm mode="sign-up" />
  ) : (
    <>
      <span className="eyebrow">Your curiosity is welcome</span>
      <h1>Explore at your own pace.</h1>
      <p>
        New accounts aren’t open yet. You can still explore the market, save a
        watchlist on this browser, and create browser alerts without sharing an
        email address.
      </p>
      <Link className="button primary full" href="/">
        Explore the guest workspace
      </Link>
      <p className="text-xs text-muted-foreground mt-6!">
        Already have an account?{" "}
        <Link className="text-link" href="/sign-in">
          Sign in
        </Link>
      </p>
    </>
  );
}
