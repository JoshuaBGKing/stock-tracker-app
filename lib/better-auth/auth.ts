import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

import { connectToDatabase } from "@/database/mongoose";

type AdapterDatabase = Parameters<typeof mongodbAdapter>[0];

const createAuth = async () => {
    const secret = process.env.BETTER_AUTH_SECRET;
    const baseURL = process.env.BETTER_AUTH_URL;

    if (!secret) {
        throw new Error(
            "BETTER_AUTH_SECRET must be defined in the .env file"
        );
    }

    if (!baseURL) {
        throw new Error(
            "BETTER_AUTH_URL must be defined in the .env file"
        );
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
        throw new Error("MongoDB connection not found");
    }

    return betterAuth({
        database: mongodbAdapter(
            db as unknown as AdapterDatabase
        ),

        secret,

        baseURL,

        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },

        plugins: [
            nextCookies(),
        ],
    });
};

type AuthInstance = Awaited<ReturnType<typeof createAuth>>;

let authInstance: AuthInstance | undefined;

export const getAuth = async (): Promise<AuthInstance> => {
    if (!authInstance) {
        authInstance = await createAuth();
    }

    return authInstance;
};

export const auth = await getAuth();