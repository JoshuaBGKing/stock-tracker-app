import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
export const metadata: Metadata = { title: "Choose a new password" };
export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return token && !error ? (
    <AuthForm mode="reset" token={token} />
  ) : (
    <>
      <h1>Let’s get a fresh link.</h1>
      <p>This reset link is missing or has expired.</p>
      <Link href="/forgot-password" className="button primary">
        Request a reset link
      </Link>
    </>
  );
}
