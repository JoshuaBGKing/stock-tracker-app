"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { instruments } from "@/lib/market-catalog";
import { searchMarket } from "@/lib/actions/search.actions";
import type { StockWithWatchlistStatus } from "@/lib/actions/finnhub.actions";
type Props = {
  renderAs?: "button" | "text";
  label?: string;
  initialStocks?: StockWithWatchlistStatus[];
  shortcut?: boolean;
};
const catalog = instruments.map((stock) => ({
  ...stock,
  type: "Stock",
  isInWatchlist: false,
}));
export default function SearchCommand({
  label = "Search stocks",
  initialStocks = catalog,
  shortcut = false,
  renderAs = "button",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    query: string;
    stocks: StockWithWatchlistStatus[];
    error: string;
  }>({ query: "", stocks: [], error: "" });
  const cleaned = query.trim();
  const loading = !!cleaned && result.query !== cleaned;
  useEffect(() => {
    if (!shortcut) return;
    function key(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [shortcut]);
  useEffect(() => {
    if (!open || !cleaned) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await searchMarket(cleaned);
        if (!cancelled) setResult({ query: cleaned, ...response });
      } catch {
        if (!cancelled)
          setResult({
            query: cleaned,
            stocks: [],
            error: "Search is unavailable. Please try again.",
          });
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cleaned, open]);
  function onOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setQuery("");
      setResult({ query: "", stocks: [], error: "" });
    }
  }
  return (
    <>
      <button
        type="button"
        className={
          shortcut
            ? "search-trigger"
            : renderAs === "text"
              ? "text-link"
              : "button"
        }
        onClick={() => onOpenChange(true)}
        aria-label={shortcut ? "Search stocks" : label}
      >
        <Search size={15} aria-hidden="true" />
        <span>{label}</span>
        {shortcut && <kbd>⌘ K</kbd>}
      </button>
      <CommandDialog
        title="Find a stock"
        description="Search USD-listed stocks by company or ticker. Use arrow keys to navigate and Enter to open stock details."
        open={open}
        onOpenChange={onOpenChange}
        showCloseButton
      >
        <Command shouldFilter={false}>
          <div className="px-3 pt-4 pb-2 pr-12">
            <CommandInput
              aria-label="Company name or stock symbol"
              value={query}
              onValueChange={setQuery}
              placeholder="Company name or symbol"
              maxLength={60}
            />
          </div>
          <CommandList className="max-h-[380px] p-2" aria-busy={loading}>
            {loading ? (
              <div
                className="flex items-center gap-2 p-6 text-sm text-muted-foreground"
                role="status"
              >
                <Loader2
                  className="animate-spin"
                  size={16}
                  aria-hidden="true"
                />
                Searching stocks…
              </div>
            ) : result.error && cleaned ? (
              <p role="alert" className="p-5 text-sm text-destructive">
                {result.error}
              </p>
            ) : (
              <>
                <CommandEmpty>
                  No matching stocks. Try another name or symbol.
                </CommandEmpty>
                <CommandGroup
                  heading={cleaned ? "Search results" : "Start exploring"}
                >
                  {(cleaned ? result.stocks : initialStocks).map((stock) => (
                    <CommandItem
                      key={stock.symbol}
                      value={stock.symbol}
                      className="cursor-pointer p-3"
                      onSelect={() => {
                        onOpenChange(false);
                        router.push(
                          "/stocks/" + encodeURIComponent(stock.symbol),
                        );
                      }}
                    >
                      <span className="stock-icon">
                        {stock.symbol.slice(0, 1)}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">
                          {stock.symbol}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stock.name}
                        </span>
                      </span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="border-t px-5 py-3 text-[10px] text-muted-foreground">
            ↑ ↓ navigate · Enter to open · Esc to close
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
