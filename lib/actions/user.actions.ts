"use server";

import { connectToDatabase } from "@/database/mongoose";

interface DatabaseUser {
    id?: string;
    email?: string | null;
    name?: string | null;
}

export interface UserForNewsEmail {
    id: string;
    email: string;
    name: string;
}

export async function getAllUsersForNewsEmail(): Promise<
    UserForNewsEmail[]
> {
    try {
        const mongoose =
            await connectToDatabase();

        const db = mongoose.connection.db;

        if (!db) {
            console.error(
                "Mongoose database connection is unavailable"
            );

            return [];
        }

        // Better Auth stores users in
        // the MongoDB "user" collection.
        const users = await db
            .collection<DatabaseUser>("user")
            .find(
                {
                    email: {
                        $exists: true,
                        $ne: null,
                    },
                    name: {
                        $exists: true,
                        $ne: null,
                    },
                },
                {
                    projection: {
                        _id: 1,
                        id: 1,
                        email: 1,
                        name: 1,
                    },
                }
            )
            .toArray();

        const usersForNews: UserForNewsEmail[] =
            [];

        for (const user of users) {
            const email =
                typeof user.email === "string"
                    ? user.email.trim()
                    : "";

            const name =
                typeof user.name === "string"
                    ? user.name.trim()
                    : "";

            if (!email || !name) {
                continue;
            }

            const id =
                typeof user.id === "string" &&
                user.id.trim()
                    ? user.id.trim()
                    : user._id.toString();

            usersForNews.push({
                id,
                email,
                name,
            });
        }

        return usersForNews;
    } catch (error) {
        console.error(
            "Error fetching users for news email:",
            error
        );

        return [];
    }
}