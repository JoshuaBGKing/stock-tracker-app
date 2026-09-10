export const QUOTE_BATCH_SIZE = 10;
export function normaliseSymbol(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const symbol = value.trim().toUpperCase();
  return /^[A-Z0-9.:-]{1,25}$/.test(symbol) ? symbol : null;
}
export function parseQuoteSymbols(value: string): string[] | null {
  if (!value || value.length > QUOTE_BATCH_SIZE * 26) return null;
  const parts = value.split(",");
  if (parts.length > QUOTE_BATCH_SIZE) return null;
  const symbols = parts.map(normaliseSymbol);
  if (symbols.some((symbol) => symbol === null)) return null;
  return [...new Set(symbols as string[])];
}
