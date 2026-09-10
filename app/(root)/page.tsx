import { Dashboard } from "@/components/Dashboard";
import { getMarketSnapshot } from "@/lib/market";
import { getNews } from "@/lib/actions/finnhub.actions";
import { sampleSnapshot } from "@/lib/market-catalog";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const [snapshot, articles] = await Promise.all([
    mode === "sample" ? sampleSnapshot() : getMarketSnapshot(),
    mode === "sample" ? [] : getNews(),
  ]);
  return <Dashboard snapshot={snapshot} articles={articles} />;
}
