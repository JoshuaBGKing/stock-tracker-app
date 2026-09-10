"use client";
import { useEffect, useRef } from "react";
const allowedScripts = new Set([
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
]);
export default function useTradingViewWidget(
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 480,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const serialized = JSON.stringify(config);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !allowedScripts.has(scriptUrl)) return;
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.text = serialized;
    const message = document.createElement("p");
    message.className = "widget-attribution widget-status";
    message.textContent = "Loading TradingView chart…";
    message.setAttribute("role", "status");
    const timer = window.setTimeout(() => {
      if (!container.querySelector("iframe"))
        message.textContent =
          "The chart could not load. Your browser or connection may be blocking TradingView. You can still use the quote summary above.";
    }, 15000);
    const observer = new MutationObserver(() => {
      const iframe = container.querySelector("iframe");
      if (iframe) {
        iframe.title = "Interactive stock chart provided by TradingView";
        message.remove();
        window.clearTimeout(timer);
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    script.onerror = () => {
      message.textContent =
        "TradingView is unavailable. You can still use the quote summary above.";
    };
    container.append(widget, message, script);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      container.replaceChildren();
    };
  }, [scriptUrl, serialized, height]);
  return containerRef;
}
