"use client";
import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { usePreferences } from "./PreferencesProvider";
import { useTheme } from "next-themes";
type Props = {
  title?: string;
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
};
function LoadedWidget({ scriptUrl, config, height = 480 }: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const ref = useTradingViewWidget(
    scriptUrl,
    {
      ...config,
      colorTheme: dark ? "dark" : "light",
      theme: dark ? "dark" : "light",
      backgroundColor: dark ? "#18221d" : "#ffffff",
    },
    height,
  );
  return (
    <div
      className="widget-frame"
      // Keep the definite height outside the container TradingView rewrites.
      style={{ height }}
    >
      <div
        ref={ref}
        className="tradingview-widget-container"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
export default function TradingViewWidget(props: Props) {
  const { embeds, setEmbeds } = usePreferences();
  return (
    <section aria-label={props.title || "TradingView chart"}>
      {props.title && <h2 className="mb-4">{props.title}</h2>}
      {embeds ? (
        <>
          <LoadedWidget {...props} />
          <div className="widget-attribution">
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chart by TradingView ↗
            </a>{" "}
            ·{" "}
            <Link href="/settings" className="underline">
              Manage external content
            </Link>
          </div>
        </>
      ) : (
        <div className="embeds-placeholder">
          <ChartNoAxesCombined size={30} strokeWidth={1.2} aria-hidden="true" />
          <h3>A deeper view, when you choose.</h3>
          <p>
            Interactive charts are provided by TradingView. Allowing them shares
            your IP address, browser information and the stock you view with
            TradingView, which may use cookies and similar storage. Your choice
            lasts up to 180 days.{" "}
            <a
              href="https://www.tradingview.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TradingView privacy policy (new tab)
            </a>
            .
          </p>
          <div className="page-actions">
            <button className="button primary" onClick={() => setEmbeds(true)}>
              Allow TradingView charts
            </button>
            <Link href="/settings" className="button">
              Keep external charts off
            </Link>
          </div>
          <p className="mt-4! mb-0! text-[10px]!">
            You can withdraw consent in{" "}
            <Link href="/settings">Settings & privacy</Link> at any time.
          </p>
        </div>
      )}
    </section>
  );
}
