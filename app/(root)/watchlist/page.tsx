import type { Metadata } from "next";
import { WatchlistView } from "@/components/WatchlistView";
import { getMarketSnapshot } from "@/lib/market";
export const metadata: Metadata = { title: "Your watchlist" };
export default async function WatchlistPage() {
  return <WatchlistView snapshot={await getMarketSnapshot()} />;
}
