"use client";

import { useState } from "react";
import {
    Loader2,
    Star,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    addToWatchlist,
    removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";

interface WatchlistButtonProps {
    symbol: string;
    company: string;
    isInWatchlist: boolean;
    showTrashIcon?: boolean;
    type?: "button" | "icon";
    onWatchlistChange?: (
        symbol: string,
        isAdded: boolean
    ) => void;
}

const WatchlistButton = ({
                             symbol,
                             company,
                             isInWatchlist,
                             showTrashIcon = false,
                             type = "button",
                             onWatchlistChange,
                         }: WatchlistButtonProps) => {
    const router = useRouter();

    const [added, setAdded] =
        useState(isInWatchlist);

    const [loading, setLoading] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const handleClick = async () => {
        if (loading) return;

        setLoading(true);
        setErrorMessage("");

        const previousValue = added;
        const nextValue = !added;

        /*
         * Change the button immediately.
         * Reverse it if the database update fails.
         */
        setAdded(nextValue);

        try {
            const result = nextValue
                ? await addToWatchlist({
                    symbol,
                    company,
                })
                : await removeFromWatchlist(
                    symbol
                );

            if (!result.success) {
                setAdded(previousValue);

                const message =
                    "error" in result &&
                    typeof result.error === "string"
                        ? result.error
                        : "Watchlist update failed.";

                setErrorMessage(message);
                return;
            }

            onWatchlistChange?.(
                symbol,
                nextValue
            );

            /*
             * Refresh the server page so it reads
             * the latest watchlist value from MongoDB.
             */
            router.refresh();
        } catch (error) {
            console.error(
                "Watchlist update failed:",
                error
            );

            setAdded(previousValue);
            setErrorMessage(
                "Watchlist update failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (type === "icon") {
        return (
            <div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={loading}
                    onClick={handleClick}
                    aria-label={
                        added
                            ? `Remove ${company} from watchlist`
                            : `Add ${company} to watchlist`
                    }
                    className="hover:bg-gray-800"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                    ) : showTrashIcon && added ? (
                        <Trash2 className="h-5 w-5 text-red-500" />
                    ) : (
                        <Star
                            className={cn(
                                "h-5 w-5",
                                added
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-400"
                            )}
                        />
                    )}
                </Button>

                {errorMessage && (
                    <p className="mt-1 text-xs text-red-500">
                        {errorMessage}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div>
            <Button
                type="button"
                disabled={loading}
                onClick={handleClick}
                className={cn(
                    "h-11 gap-2 border font-medium",
                    added
                        ? "border-yellow-400 bg-yellow-400 text-black hover:bg-yellow-500"
                        : "border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800"
                )}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Star
                        className={cn(
                            "h-4 w-4",
                            added &&
                            "fill-current"
                        )}
                    />
                )}

                {loading
                    ? "Updating..."
                    : added
                        ? "In Watchlist"
                        : "Add to Watchlist"}
            </Button>

            {errorMessage && (
                <p className="mt-2 max-w-64 text-sm text-red-500">
                    {errorMessage}
                </p>
            )}
        </div>
    );
};

export default WatchlistButton;