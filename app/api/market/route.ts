import { getMarketSnapshot, getSelectedQuotes } from "@/lib/market";
import { parseQuoteSymbols } from "@/lib/market-symbols";
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols");
  const symbols = raw === null ? null : parseQuoteSymbols(raw);
  if (raw !== null && !symbols)
    return Response.json(
      { error: "Request between 1 and 10 valid stock symbols." },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  return Response.json(
    symbols ? await getSelectedQuotes(symbols) : await getMarketSnapshot(),
    {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
    },
  );
}
