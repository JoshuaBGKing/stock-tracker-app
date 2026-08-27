'use client';

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

function TradingViewWidget({
                               title,
                               scriptUrl,
                               config,
                               height = 600,
                               className,
                           }: TradingViewWidgetProps) {
    const containerRef = useTradingViewWidget(
        scriptUrl,
        config,
        height
    );

    return (
        <section className="w-full">
            {title && (
                <h3 className="mb-5 text-2xl font-semibold text-gray-100">
                    {title}
                </h3>
            )}

            <div
                ref={containerRef}
                className={cn(
                    "tradingview-widget-container w-full",
                    className
                )}
                style={{ minHeight: `${height}px` }}
            />
        </section>
    );
}

export default memo(TradingViewWidget);