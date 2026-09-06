
import { notFound } from "next/navigation";

import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import { isStockInWatchlist } from "@/lib/actions/watchlist.actions";
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";

interface StockDetailsPageProps {
    params: Promise<{
        symbol: string;
    }>;
}

const TRADING_VIEW_SCRIPT_URL =
    "https://s3.tradingview.com/external-embedding/embed-widget-";

const StockDetails = async ({
                                params,
                            }: StockDetailsPageProps) => {
    const { symbol: symbolParameter } =
        await params;

    const symbol = symbolParameter
        .trim()
        .toUpperCase();

    if (!/^[A-Z0-9.:-]{1,25}$/.test(symbol)) {
        notFound();
    }

    /*
     * This reads the actual value from MongoDB.
     */
    const isInWatchlist =
        await isStockInWatchlist(symbol);

    return (
        <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-1 text-sm text-gray-500">
                            Stock details
                        </p>

                        <h1 className="text-3xl font-semibold text-gray-100">
                            {symbol}
                        </h1>
                    </div>

                    <WatchlistButton
                        symbol={symbol}
                        company={symbol}
                        isInWatchlist={
                            isInWatchlist
                        }
                    />
                </div>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
                    <div className="flex min-w-0 flex-col gap-6">
                        <TradingViewWidget
                            scriptUrl={`${TRADING_VIEW_SCRIPT_URL}symbol-info.js`}
                            config={SYMBOL_INFO_WIDGET_CONFIG(
                                symbol
                            )}
                            height={170}
                        />

                        <TradingViewWidget
                            title="Price Chart"
                            scriptUrl={`${TRADING_VIEW_SCRIPT_URL}advanced-chart.js`}
                            config={CANDLE_CHART_WIDGET_CONFIG(
                                symbol
                            )}
                            height={600}
                        />

                        <TradingViewWidget
                            title="Performance"
                            scriptUrl={`${TRADING_VIEW_SCRIPT_URL}advanced-chart.js`}
                            config={BASELINE_WIDGET_CONFIG(
                                symbol
                            )}
                            height={600}
                        />
                    </div>

                    <div className="flex min-w-0 flex-col gap-6">
                        <TradingViewWidget
                            title="Technical Analysis"
                            scriptUrl={`${TRADING_VIEW_SCRIPT_URL}technical-analysis.js`}
                            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(
                                symbol
                            )}
                            height={400}
                        />

                        <TradingViewWidget
                            title="Company Profile"
                            scriptUrl={`${TRADING_VIEW_SCRIPT_URL}company-profile.js`}
                            config={COMPANY_PROFILE_WIDGET_CONFIG(
                                symbol
                            )}
                            height={440}
                        />

                        <TradingViewWidget
                            title="Company Financials"
                            scriptUrl={`${TRADING_VIEW_SCRIPT_URL}financials.js`}
                            config={COMPANY_FINANCIALS_WIDGET_CONFIG(
                                symbol
                            )}
                            height={464}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
};

export default StockDetails;