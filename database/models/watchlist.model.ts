import {
    Schema,
    model,
    models,
    type Model,
} from "mongoose";

export interface WatchlistItem {
    userId: string;
    symbol: string;
    company: string;
    createdAt: Date;
    updatedAt: Date;
}

const WatchlistSchema =
    new Schema<WatchlistItem>(
        {
            userId: {
                type: String,
                required: true,
                index: true,
                trim: true,
            },
            symbol: {
                type: String,
                required: true,
                uppercase: true,
                trim: true,
            },
            company: {
                type: String,
                required: true,
                trim: true,
            },
        },
        {
            timestamps: true,
        }
    );

/*
 * A user cannot add the same stock twice.
 */
WatchlistSchema.index(
    {
        userId: 1,
        symbol: 1,
    },
    {
        unique: true,
    }
);

export const Watchlist: Model<WatchlistItem> =
    (models.Watchlist as
        | Model<WatchlistItem>
        | undefined) ??
    model<WatchlistItem>(
        "Watchlist",
        WatchlistSchema
    );