"use server";
import { searchStocks } from "./finnhub.actions";
export async function searchMarket(query: string) {
  if (typeof query !== "string" || query.length > 60)
    return {
      stocks: [],
      error: "Use a company name or symbol, up to 60 characters.",
    };
  try {
    return { stocks: await searchStocks(query), error: "" };
  } catch {
    return {
      stocks: [],
      error: "Stock search is temporarily unavailable. Please try again.",
    };
  }
}
