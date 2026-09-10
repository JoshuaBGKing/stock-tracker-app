"use client";
import { useState } from "react";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
export function SaveStockButton({
  symbol,
  company,
  compact = false,
  remove = false,
}: {
  symbol: string;
  company: string;
  compact?: boolean;
  remove?: boolean;
}) {
  const { stocks, toggleStock } = useWorkspace();
  const [pending, setPending] = useState(false);
  const saved = stocks.some((stock) => stock.symbol === symbol);
  return (
    <button
      className={compact ? `icon-button ${saved ? "saved" : ""}` : "button"}
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${symbol} ${saved ? "from" : "to"} watchlist`}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await toggleStock({ symbol, company });
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : remove ? (
        <Trash2 size={15} aria-hidden="true" />
      ) : saved ? (
        <Star size={15} fill="currentColor" aria-hidden="true" />
      ) : compact ? (
        <Star size={15} aria-hidden="true" />
      ) : (
        <Plus size={15} aria-hidden="true" />
      )}
      {!compact &&
        (pending
          ? "Saving…"
          : saved
            ? "Saved to watchlist"
            : "Add to watchlist")}
    </button>
  );
}
