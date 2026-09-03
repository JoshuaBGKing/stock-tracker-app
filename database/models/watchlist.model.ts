import mongoose, {
    type Document,
    type Model,
    Schema,
} from "mongoose";

export interface WatchlistItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
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
            addedAt: {
                type: Date,
                default: Date.now,
            },
        },
        {
            timestamps: false,
        }
    );

WatchlistSchema.index(
    {
        userId: 1,
        symbol: 1,
    },
    {
        unique: true,
    }
);

const Watchlist: Model<WatchlistItem> =
    (mongoose.models
        .Watchlist as Model<WatchlistItem>) ||
    mongoose.model<WatchlistItem>(
        "Watchlist",
        WatchlistSchema
    );

export { Watchlist };

export default Watchlist;