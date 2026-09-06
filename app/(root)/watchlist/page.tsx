import Link from "next/link";
import {
    ArrowUpRight,
    Star,
} from "lucide-react";

import SearchCommand from "@/components/SearchCommand";
import WatchlistButton from "@/components/WatchlistButton";
import { Button } from "@/components/ui/button";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getCurrentUserWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistPage = async () => {
    const [
        watchlist,
        initialStocks,
    ] = await Promise.all([
        getCurrentUserWatchlist(),
        searchStocks(),
    ]);

    return (
        <main className="min-h-screen bg-black px-4 py-8 text-white md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-100">
                            My Watchlist
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Follow stocks and quickly
                            access their market details.
                        </p>
                    </div>

                    <SearchCommand
                        label="Add stock"
                        initialStocks={initialStocks}
                    />
                </div>

                {watchlist.length === 0 ? (
                    <section className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-950 px-6 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10">
                            <Star className="h-8 w-8 text-yellow-400" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-100">
                            Your watchlist is empty
                        </h2>

                        <p className="mt-2 max-w-md text-gray-500">
                            Search for a stock and select
                            “Add to Watchlist” to save it
                            here.
                        </p>

                        <div className="mt-6">
                            <SearchCommand
                                label="Search stocks"
                                initialStocks={
                                    initialStocks
                                }
                            />
                        </div>
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
                        <div className="border-b border-gray-800 px-5 py-4">
                            <p className="text-sm text-gray-400">
                                {watchlist.length}{" "}
                                {watchlist.length === 1
                                    ? "stock"
                                    : "stocks"}{" "}
                                saved
                            </p>
                        </div>

                        <div className="divide-y divide-gray-800">
                            {watchlist.map((stock) => (
                                <article
                                    key={stock.id}
                                    className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <Link
                                        href={`/stocks/${encodeURIComponent(
                                            stock.symbol
                                        )}`}
                                        className="group min-w-0 flex-1"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400/10 text-sm font-bold text-yellow-400">
                                                {stock.symbol
                                                    .slice(
                                                        0,
                                                        2
                                                    )
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h2 className="truncate text-lg font-semibold text-gray-100 group-hover:text-yellow-400">
                                                        {
                                                            stock.company
                                                        }
                                                    </h2>

                                                    <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-yellow-400" />
                                                </div>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    {
                                                        stock.symbol
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex items-center justify-end gap-3">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-white"
                                        >
                                            <Link
                                                href={`/stocks/${encodeURIComponent(
                                                    stock.symbol
                                                )}`}
                                            >
                                                View details
                                            </Link>
                                        </Button>

                                        <WatchlistButton
                                            symbol={
                                                stock.symbol
                                            }
                                            company={
                                                stock.company
                                            }
                                            isInWatchlist={
                                                true
                                            }
                                            showTrashIcon
                                            type="icon"
                                        />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
};

export default WatchlistPage;