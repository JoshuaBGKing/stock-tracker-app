import "server-only";
import { createHmac } from "node:crypto";
import { connectToDatabase } from "@/database/mongoose";

export async function permitUserAction(
  userId: string,
  action: string,
  limit: number,
  windowSeconds = 3600,
) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Account service is unavailable");
  const db = (await connectToDatabase()).connection.db!;
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = createHmac("sha256", secret)
    .update(`${action}:${userId}:${bucket}`)
    .digest("hex");
  const attempts = db.collection<{
    _id: string;
    count: number;
    expiresAt: Date;
  }>("actionLimits");
  await attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const row = await attempts.findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(Date.now() + windowSeconds * 2000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  return (row?.count || 0) <= limit;
}
