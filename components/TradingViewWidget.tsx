"use client";

import { memo } from "react";

import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({
                               title,
                               scriptUrl,
                               config,
                               height = 600,
                               className,
                           }: TradingViewWidgetProps) => {
    const containerRef = useTradingViewWidget(
        scriptUrl,
        config,
        height
    );

    return (
        <section className="w-full min-w-0">
            {title && (
                <h2 className="mb-4 text-xl font-semibold text-gray-100 md:text-2xl">
                    {title}
                </h2>
            )}

            <div
                ref={containerRef}
                style={{
                    minHeight: `${height}px`,
                }}
                className={cn(
                    "tradingview-widget-container w-full overflow-hidden rounded-xl border border-gray-800 bg-[#141414]",
                    className
                )}
            />
        </section>
    );
};

export default memo(TradingViewWidget);