"use client";

import { useEffect, useMemo, useRef } from "react";

const useTradingViewWidget = (
    scriptUrl: string,
    config: Record<string, unknown>,
    height = 600
) => {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    /*
     * Converting the configuration to a string
     * prevents the effect from running repeatedly
     * when an equivalent object is received.
     */
    const serializedConfig = useMemo(
        () => JSON.stringify(config),
        [config]
    );

    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        container.replaceChildren();

        const widgetContainer =
            document.createElement("div");

        widgetContainer.className =
            "tradingview-widget-container__widget";

        widgetContainer.style.width = "100%";
        widgetContainer.style.height = `${height}px`;

        const script =
            document.createElement("script");

        script.src = scriptUrl;
        script.type = "text/javascript";
        script.async = true;
        script.text = serializedConfig;

        container.appendChild(widgetContainer);
        container.appendChild(script);

        return () => {
            container.replaceChildren();
        };
    }, [scriptUrl, serializedConfig, height]);

    return containerRef;
};

export default useTradingViewWidget;