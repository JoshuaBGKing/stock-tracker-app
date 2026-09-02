import mongoose from "mongoose";
import * as dns from "node:dns";

if (process.env.NODE_ENV === "development") {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

const cached =
    global.mongooseCache ??
    (global.mongooseCache = {
        conn: null,
        promise: null,
    });

export const connectToDatabase = async () => {
    if (!MONGODB_URI) {
        throw new Error(
            "MONGODB_URI must be defined in the .env file"
        );
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
        });
    }

    try {
        cached.conn = await cached.promise;

        console.log(
            `Connected to MongoDB database: ${cached.conn.connection.name}`
        );

        return cached.conn;
    } catch (error) {
        cached.promise = null;
        throw error;
    }
};