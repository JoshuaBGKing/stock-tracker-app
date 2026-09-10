import type { Metadata } from "next";
import { AlertsView } from "@/components/AlertsView";
export const metadata: Metadata = { title: "Price alerts" };
export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const { symbol } = await searchParams;
  return (
    <AlertsView
      key={typeof symbol === "string" ? symbol : "default"}
      initialSymbol={symbol}
    />
  );
}
