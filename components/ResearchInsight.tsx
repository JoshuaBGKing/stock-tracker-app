"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requestResearchInsight } from "@/lib/actions/insight.actions";
import { useWorkspace } from "@/components/WorkspaceProvider";
type Result = Extract<
  Awaited<ReturnType<typeof requestResearchInsight>>,
  { success: true }
>["data"];

export function ResearchInsight({
  symbol,
  enabled,
  dataAvailable,
  testMode,
}: {
  symbol: string;
  enabled: boolean;
  dataAvailable: boolean;
  testMode: boolean;
}) {
  const { user } = useWorkspace();
  const [consent, setConsent] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  async function generate() {
    setPending(true);
    setError("");
    setResult(null);
    try {
      const response = await requestResearchInsight(symbol, consent);
      if (response.success) setResult(response.data);
      else setError(response.error);
    } catch {
      setError("Could not generate research. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      className="panel settings-section"
      aria-labelledby="ai-research-title"
    >
      <span className="eyebrow">
        <Sparkles size={14} aria-hidden="true" /> Optional research assistant
      </span>
      <h2 id="ai-research-title">Another perspective on {symbol}.</h2>
      <p>
        Generate a short research note from provider quotes and recent
        headlines. AI can make mistakes and is not a recommendation to trade.
      </p>
      {!enabled ? (
        <p className="data-disclosure">
          AI research has not been enabled by the operator.
        </p>
      ) : !dataAvailable ? (
        <p className="data-disclosure">
          AI research needs a verified USD provider quote for this stock. Sample
          prices and unavailable quotes are not sent to the AI provider.
        </p>
      ) : !user ? (
        <Link href="/sign-in" className="button">
          Sign in to use AI research
        </Link>
      ) : (
        <>
          <label className="check-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                if (!event.target.checked) setResult(null);
              }}
              disabled={pending}
            />
            <span>
              {testMode
                ? "Use the clearly labelled local research fixture. No AI provider is contacted."
                : "Allow this request to Google Gemini using this stock’s public quote and headlines. My account identity and saved watchlist are not sent."}
            </span>
          </label>
          <p className="text-xs text-muted-foreground">
            Output is not saved to your account. Unchecking clears it here; it
            cannot undo a request already sent.{" "}
            <Link href="/privacy" className="text-link">
              Read the privacy policy
            </Link>
            .
          </p>
          <button
            type="button"
            className="button primary mt-4"
            disabled={!consent || pending}
            onClick={generate}
          >
            {pending ? "Preparing research…" : "Generate research note"}
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {result && (
            <div className="research-result" aria-live="polite">
              <span className="status-pill">
                {result.sourceMode === "fixture"
                  ? "Test fixture · not AI output"
                  : "AI-generated · verify independently"}
              </span>
              <p>{result.summary}</p>
              <h3>Observations</h3>
              <ul>
                {result.observations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <h3>Questions worth asking</h3>
              <ul>
                {result.questions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              {result.sources.length > 0 && (
                <>
                  <h3>Input headlines</h3>
                  <ul>
                    {result.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          className="text-link"
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title} (new tab)
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                {result.model} · {new Date(result.generatedAt).toLocaleString()}
                . Headlines are inputs, not independent verification of the
                generated text.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
