"use client";
import { useState } from "react";
import Link from "next/link";
import {
  requestNewsBrief,
  setNewsSubscription,
} from "@/lib/actions/mail.actions";

export function NewsEmailSettings({
  signedIn,
  enabled,
  subscribed,
  scheduled,
  testMode,
}: {
  signedIn: boolean;
  enabled: boolean;
  subscribed: boolean;
  scheduled: boolean;
  testMode: boolean;
}) {
  const [active, setActive] = useState(subscribed),
    [consent, setConsent] = useState(false),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  async function update(next: boolean) {
    setPending(true);
    setMessage("");
    try {
      const result = await setNewsSubscription(next);
      if (result.success) {
        setActive(next);
        setConsent(false);
        setMessage(
          next ? "Subscribed to news briefs." : "News briefs are now off.",
        );
      } else setMessage(result.error || "Could not save your preference.");
    } catch {
      setMessage("Could not save your preference. Please try again.");
    } finally {
      setPending(false);
    }
  }
  async function send() {
    setPending(true);
    setMessage("");
    try {
      const result = await requestNewsBrief();
      setMessage(
        result.success
          ? result.message || "Brief queued."
          : result.error || "Could not queue your brief.",
      );
    } catch {
      setMessage("Could not queue your brief. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      className="panel settings-section mt-6"
      aria-labelledby="email-preferences-title"
    >
      <h2 id="email-preferences-title">A reading list for your inbox.</h2>
      <p>
        Optional market headlines with links to their publishers. No tracking
        pixels, full articles, AI profiling, or uploaded watchlist.
      </p>
      <p>
        {scheduled
          ? "Scheduled for weekdays at 22:00 UTC, subject to provider availability."
          : "On demand only. Automatic daily delivery is not enabled."}{" "}
        Limited to one brief per UTC day. Unsubscribe here or through any brief.
      </p>
      {testMode && (
        <p className="data-disclosure">
          Test mode: delivery goes to the local inbox, using labelled sample
          content.
        </p>
      )}
      {!signedIn ? (
        <Link className="button" href="/sign-in">
          Sign in to manage news emails
        </Link>
      ) : (
        <>
          <span className="status-pill">
            {active ? "Subscribed" : "Not subscribed"}
          </span>
          {active ? (
            <div className="page-actions mt-5">
              <button
                className="button primary"
                onClick={send}
                disabled={pending || !enabled}
              >
                Send my news brief
              </button>
              <button
                className="button"
                onClick={() => update(false)}
                disabled={pending}
              >
                Unsubscribe from news briefs
              </button>
            </div>
          ) : enabled ? (
            <>
              <label className="check-row mt-5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  disabled={pending}
                />
                <span>
                  I want Stillmark market news briefs sent to my verified
                  account email. I can unsubscribe at any time.
                </span>
              </label>
              <button
                className="button primary"
                disabled={!consent || pending}
                onClick={() => update(true)}
              >
                Subscribe to news briefs
              </button>
            </>
          ) : (
            <p>News delivery has not been enabled by the operator.</p>
          )}
          <p role="status" aria-live="polite" className="mt-4 text-sm">
            {pending ? "Saving your request…" : message}
          </p>
        </>
      )}
    </section>
  );
}
