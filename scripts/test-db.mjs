import { setServers } from "node:dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Your router refuses Node.js SRV requests.
// Use public DNS servers for this process.
setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config({
    path: ".env.local",
    quiet: true,
});

dotenv.config({
    path: ".env",
    quiet: true,
});

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error(
        "ERROR: MONGODB_URI was not found in .env or .env.local"
    );

    process.exit(1);
}

async function testDatabaseConnection() {
    try {
        const startedAt = Date.now();

        await mongoose.connect(uri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
        });

        const elapsedTime = Date.now() - startedAt;

        console.log("SUCCESS: MongoDB connection is working");
        console.log(`Database: ${mongoose.connection.name}`);
        console.log(`Host: ${mongoose.connection.host}`);
        console.log(`Connection time: ${elapsedTime}ms`);
    } catch (error) {
        console.error("ERROR: MongoDB connection failed");

        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }

        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

await testDatabaseConnection();