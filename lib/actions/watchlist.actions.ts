"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { getAuth } from "@/lib/better-auth/auth";
async function currentUserId() {
  const auth = await getAuth();
  return (await auth.api.getSession({ headers: await headers() }))?.user.id;
}
function cleanSymbol(value: unknown) {
  return typeof value === "string" &&
    /^[A-Z0-9.:-]{1,25}$/.test(value.trim().toUpperCase())
    ? value.trim().toUpperCase()
    : null;
}
function refreshStock(symbol: string) {
  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath("/stocks/" + symbol);
}
export async function addToWatchlist(input: {
  symbol: string;
  company: string;
}) {
  const symbol = cleanSymbol(input?.symbol);
  if (
    !symbol ||
    typeof input?.company !== "string" ||
    input.company.length > 120
  )
    return { success: false, error: "Enter a valid company and stock symbol." };
  try {
    const userId = await currentUserId();
    if (!userId)
      return { success: false, error: "Sign in to save to an account." };
    await connectToDatabase();
    if (
      (await Watchlist.countDocuments({ userId })) >= 100 &&
      !(await Watchlist.exists({ userId, symbol }))
    )
      return {
        success: false,
        error: "Your watchlist can hold up to 100 stocks.",
      };
    await Watchlist.findOneAndUpdate(
      { userId, symbol },
      {
        $setOnInsert: {
          userId,
          symbol,
          company: input.company.trim() || symbol,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    refreshStock(symbol);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not save this stock. Please try again.",
    };
  }
}
export async function removeFromWatchlist(value: string) {
  const symbol = cleanSymbol(value);
  if (!symbol) return { success: false, error: "Invalid stock symbol." };
  try {
    const userId = await currentUserId();
    if (!userId)
      return {
        success: false,
        error: "Sign in to update your account watchlist.",
      };
    await connectToDatabase();
    await Watchlist.deleteOne({ userId, symbol });
    refreshStock(symbol);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not remove this stock. Please try again.",
    };
  }
}
export async function isStockInWatchlist(value: string) {
  const symbol = cleanSymbol(value);
  if (!symbol) return false;
  const userId = await currentUserId();
  return userId ? Boolean(await Watchlist.exists({ userId, symbol })) : false;
}
export async function getCurrentUserWatchlist() {
  const userId = await currentUserId();
  if (!userId) return [];
  await connectToDatabase();
  const items = await Watchlist.find({ userId }).sort({ createdAt: -1 }).lean();
  return items.map((item) => ({
    id: String(item._id),
    symbol: item.symbol,
    company: item.company,
    createdAt: item.createdAt.toISOString(),
  }));
}
