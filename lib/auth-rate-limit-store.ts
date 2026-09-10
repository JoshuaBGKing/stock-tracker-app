import type { AuthLimitRule } from "./auth-rate-limit-policy";

export type AuthLimitCounter = { _id: string; count: number; expiresAt: Date };
type CounterCollection = {
  findOneAndUpdate(
    filter: { _id: string; count: { $lt: number } },
    update: { $inc: { count: number }; $setOnInsert: { expiresAt: Date } },
    options: { upsert: true; returnDocument: "after" },
  ): Promise<AuthLimitCounter | null>;
};

export async function consumeAuthLimit(
  attempts: CounterCollection,
  { id, limit, expiresAt }: AuthLimitRule,
) {
  try {
    // Atomic conditional update: simultaneous instances cannot exceed the cap.
    // A capped existing row makes upsert hit the unique _id, which means deny.
    const row = await attempts.findOneAndUpdate(
      { _id: id, count: { $lt: limit } },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    );
    return Boolean(row && row.count <= limit);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    )
      return false;
    // Database failures are never interpreted as permission to proceed.
    throw error;
  }
}
