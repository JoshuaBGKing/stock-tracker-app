import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
export const metadata: Metadata = { title: "Sign in" };
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      {params.error && (
        <p role="alert" className="form-error">
          That verification link could not be used. It may have expired. Try
          signing in to request a fresh verification email.
        </p>
      )}
      {params.verified && !params.error && (
        <p className="notice">
          Email verification completed. You can now sign in.
        </p>
      )}
      <AuthForm mode="sign-in" />
    </>
  );
}
