"use server";

import { Watchlist } from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";

interface DatabaseUser {
    _id?: {
        toString(): string;
    };
    id?: string;
    email?: string;
}

export async function getWatchlistSymbolsByEmail(
    email: string
): Promise<string[]> {
    if (!email?.trim()) {
        return [];
    }

    try {
        const mongoose =
            await connectToDatabase();

        const db = mongoose.connection.db;

        if (!db) {
            throw new Error(
                "MongoDB connection not found"
            );
        }

        const user = await db
            .collection<DatabaseUser>("user")
            .findOne({
                email: email
                    .trim()
                    .toLowerCase(),
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

        const watchlistItems =
            await Watchlist.find(
                {
                    userId,
                },
                {
                    symbol: 1,
                    _id: 0,
                }
            ).lean();

        const symbols = watchlistItems.map(
            (item) =>
                String(item.symbol)
                    .trim()
                    .toUpperCase()
        );

        return [...new Set(symbols)];
    } catch (error) {
        console.error(
            "getWatchlistSymbolsByEmail error:",
            error
        );

        return [];
    }
}