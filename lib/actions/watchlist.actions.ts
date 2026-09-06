"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { auth } from "@/lib/better-auth/auth";

interface AddToWatchlistParameters {
    symbol: string;
    company: string;
}

interface DatabaseUser {
    _id?: {
        toString(): string;
    };
    id?: string;
    email?: string;
}

const normalizeSymbol = (symbol: string) => {
    return symbol.trim().toUpperCase();
};

const validateSymbol = (symbol: string) => {
    return /^[A-Z0-9.:-]{1,25}$/.test(symbol);
};

const getCurrentUserId = async (): Promise<
    string | null
> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return session?.user?.id ?? null;
};

export const addToWatchlist = async ({
                                         symbol,
                                         company,
                                     }: AddToWatchlistParameters) => {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return {
                success: false,
                error: "You must be signed in.",
            };
        }

        const cleanedSymbol =
            normalizeSymbol(symbol);

        const cleanedCompany =
            company.trim() || cleanedSymbol;

        if (!validateSymbol(cleanedSymbol)) {
            return {
                success: false,
                error: "Invalid stock symbol.",
            };
        }

        await connectToDatabase();

        /*
         * Upsert prevents duplicate stocks
         * from being added for the same user.
         */
        await Watchlist.findOneAndUpdate(
            {
                userId,
                symbol: cleanedSymbol,
            },
            {
                $setOnInsert: {
                    userId,
                    symbol: cleanedSymbol,
                    company: cleanedCompany,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        );

        revalidatePath("/");
        revalidatePath(
            `/stocks/${cleanedSymbol}`
        );

        return {
            success: true,
            message: `${cleanedSymbol} added to your watchlist.`,
        };
    } catch (error) {
        console.error(
            "Add to watchlist failed:",
            error
        );

        return {
            success: false,
            error: "Unable to add this stock to your watchlist.",
        };
    }
};

export const removeFromWatchlist = async (
    symbol: string
) => {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return {
                success: false,
                error: "You must be signed in.",
            };
        }

        const cleanedSymbol =
            normalizeSymbol(symbol);

        if (!validateSymbol(cleanedSymbol)) {
            return {
                success: false,
                error: "Invalid stock symbol.",
            };
        }

        await connectToDatabase();

        await Watchlist.deleteOne({
            userId,
            symbol: cleanedSymbol,
        });

        revalidatePath("/");
        revalidatePath(
            `/stocks/${cleanedSymbol}`
        );

        return {
            success: true,
            message: `${cleanedSymbol} removed from your watchlist.`,
        };
    } catch (error) {
        console.error(
            "Remove from watchlist failed:",
            error
        );

        return {
            success: false,
            error: "Unable to remove this stock from your watchlist.",
        };
    }
};

export const isStockInWatchlist = async (
    symbol: string
): Promise<boolean> => {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return false;
        }

        const cleanedSymbol =
            normalizeSymbol(symbol);

        if (!validateSymbol(cleanedSymbol)) {
            return false;
        }

        await connectToDatabase();

        const item = await Watchlist.exists({
            userId,
            symbol: cleanedSymbol,
        });

        return Boolean(item);
    } catch (error) {
        console.error(
            "Watchlist status check failed:",
            error
        );

        return false;
    }
};

export const getCurrentUserWatchlist =
    async () => {
        try {
            const userId =
                await getCurrentUserId();

            if (!userId) {
                return [];
            }

            await connectToDatabase();

            const items = await Watchlist.find({
                userId,
            })
                .sort({
                    createdAt: -1,
                })
                .lean();

            return items.map((item) => ({
                id: String(item._id),
                symbol: String(item.symbol),
                company: String(item.company),
                createdAt:
                    item.createdAt instanceof Date
                        ? item.createdAt.toISOString()
                        : String(item.createdAt),
            }));
        } catch (error) {
            console.error(
                "Get watchlist failed:",
                error
            );

            return [];
        }
    };

/*
 * Keep this function because your daily-news
 * workflow may use an email to retrieve symbols.
 */
export const getWatchlistSymbolsByEmail =
    async (
        email: string
    ): Promise<string[]> => {
        try {
            if (!email) {
                return [];
            }

            const mongoose =
                await connectToDatabase();

            const database =
                mongoose.connection.db;

            if (!database) {
                throw new Error(
                    "MongoDB connection not found"
                );
            }

            const user = await database
                .collection<DatabaseUser>("user")
                .findOne({
                    email: email.trim().toLowerCase(),
                });

            if (!user) {
                return [];
            }

            const userId =
                user.id ||
                user._id?.toString() ||
                "";

            if (!userId) {
                return [];
            }

            const items = await Watchlist.find(
                {
                    userId,
                },
                {
                    symbol: 1,
                }
            ).lean();

            return items.map((item) =>
                String(item.symbol)
            );
        } catch (error) {
            console.error(
                "Get watchlist by email failed:",
                error
            );

            return [];
        }
    };