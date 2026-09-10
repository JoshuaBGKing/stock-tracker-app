"use client";
import { SaveStockButton } from "./SaveStockButton";
// Compatibility wrapper for existing imports.
export default function WatchlistButton({
  symbol,
  company,
  type = "button",
  showTrashIcon = false,
}: {
  symbol: string;
  company: string;
  isInWatchlist?: boolean;
  type?: "button" | "icon";
  showTrashIcon?: boolean;
  onWatchlistChange?: (symbol: string, added: boolean) => void;
}) {
  return (
    <SaveStockButton
      symbol={symbol}
      company={company}
      compact={type === "icon"}
      remove={showTrashIcon}
    />
  );
}
