"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    searchStocks,
    type StockWithWatchlistStatus,
} from "@/lib/actions/finnhub.actions";

interface SearchCommandProps {
    renderAs?: "button" | "text";
    label?: string;
    initialStocks?: StockWithWatchlistStatus[];
}

const SearchCommand = ({
                           renderAs = "button",
                           label = "Add stock",
                           initialStocks = [],
                       }: SearchCommandProps) => {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [stocks, setStocks] =
        useState<StockWithWatchlistStatus[]>(initialStocks);
    const [loading, setLoading] = useState(false);

    const isSearchMode = searchTerm.trim().length > 0;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                setOpen((currentValue) => !currentValue);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        const cleanedSearchTerm = searchTerm.trim();

        if (!cleanedSearchTerm) {
            setStocks(initialStocks);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const timeout = window.setTimeout(async () => {
            setLoading(true);

            try {
                const results =
                    await searchStocks(cleanedSearchTerm);

                if (!cancelled) {
                    setStocks(results);
                }
            } catch (error) {
                console.error(
                    "Stock search failed:",
                    error
                );

                if (!cancelled) {
                    setStocks([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [searchTerm, open, initialStocks]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);

        if (!isOpen) {
            setSearchTerm("");
            setStocks(initialStocks);
            setLoading(false);
        }
    };

    const handleSelectStock = (symbol: string) => {
        handleOpenChange(false);

        router.push(
            `/stocks/${encodeURIComponent(symbol)}`
        );
    };

    const displayStocks = isSearchMode
        ? stocks
        : stocks.slice(0, 10);

    return (
        <>
            {renderAs === "text" ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="transition-colors hover:text-yellow-500"
                >
                    {label}
                </button>
            ) : (
                <Button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="gap-2 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                    <Search className="h-4 w-4" />
                    {label}
                </Button>
            )}

            <CommandDialog
                open={open}
                onOpenChange={handleOpenChange}
            >
                {/*
                  CommandInput must be inside Command.
                  shouldFilter={false} lets Finnhub handle searching.
                */}
                <Command
                    shouldFilter={false}
                    className="bg-gray-950 text-gray-100"
                >
                    <div className="relative">
                        <CommandInput
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            placeholder="Search stocks..."
                        />

                        {loading && (
                            <Loader2 className="absolute right-4 top-3 h-5 w-5 animate-spin text-yellow-500" />
                        )}
                    </div>

                    <CommandList className="max-h-[400px]">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-gray-400">
                                Searching stocks...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>
                                    {isSearchMode
                                        ? "No stocks found."
                                        : "No stocks available."}
                                </CommandEmpty>

                                {displayStocks.length > 0 && (
                                    <CommandGroup
                                        heading={
                                            isSearchMode
                                                ? `Search results (${displayStocks.length})`
                                                : `Popular stocks (${displayStocks.length})`
                                        }
                                    >
                                        {displayStocks.map(
                                            (stock) => (
                                                <CommandItem
                                                    key={`${stock.symbol}-${stock.exchange}`}
                                                    value={`${stock.symbol} ${stock.name}`}
                                                    onSelect={() =>
                                                        handleSelectStock(
                                                            stock.symbol
                                                        )
                                                    }
                                                    className="cursor-pointer py-3 data-[selected=true]:bg-gray-800"
                                                >
                                                    <TrendingUp className="mr-3 h-4 w-4 text-yellow-500" />

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-gray-100">
                                                            {stock.name}
                                                        </p>

                                                        <p className="truncate text-sm text-gray-500">
                                                            {stock.symbol}
                                                            {" | "}
                                                            {stock.exchange}
                                                            {" | "}
                                                            {stock.type}
                                                        </p>
                                                    </div>
                                                </CommandItem>
                                            )
                                        )}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    );
};

export default SearchCommand;