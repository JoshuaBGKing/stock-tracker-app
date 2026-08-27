'use client';

import { useEffect, useRef } from "react";

const useTradingViewWidget = (
    scriptUrl: string,
    config: Record<string, unknown>,
    height = 600
) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const configJson = JSON.stringify(config);

    useEffect(() => {
        const container = containerRef.current;

        if (!container || container.dataset.loaded) return;

        container.dataset.loaded = "true";

        container.innerHTML = `
      <div
        class="tradingview-widget-container__widget"
        style="width: 100%; height: ${height}px;"
      ></div>
    `;

        const script = document.createElement("script");

        script.src = scriptUrl;
        script.type = "text/javascript";
        script.async = true;
        script.textContent = configJson;

        container.appendChild(script);

        return () => {
            container.innerHTML = "";
            delete container.dataset.loaded;
        };
    }, [scriptUrl, configJson, height]);

    return containerRef;
};

export default useTradingViewWidget;