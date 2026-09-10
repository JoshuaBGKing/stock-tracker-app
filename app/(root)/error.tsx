"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel empty-state">
      <h1>Let’s take another look.</h1>
      <p className="mt-4">
        The workspace could not load. Your saved data has not been changed. If
        you’re signed in, the account service may be temporarily unavailable.
      </p>
      <div className="page-actions justify-center">
        <button className="button primary" onClick={reset}>
          Try again
        </button>
        <Link href="/privacy" className="button">
          Privacy & support
        </Link>
      </div>
    </section>
  );
}
