import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { legalReady } from "./legal";
import { isIsolatedTestEnvironment } from "./test-mode";
import { sendServiceEmail } from "./nodemailer";
import { getNews } from "./actions/finnhub.actions";

export type NewsSubscription = {
  _id: string;
  userId: string;
  active: boolean;
  version: string;
  consentedAt: Date;
  consentVersion: string;
  unsubscribedAt?: Date;
};
type BriefJob = {
  _id: string;
  subscriptionId: string;
  subscriptionVersion: string;
  userId: string;
  status: "queued" | "sent" | "cancelled";
  createdAt: Date;
  expiresAt: Date;
  sentAt?: Date;
};
export function backgroundEmailEnabled() {
  return (
    isIsolatedTestEnvironment() ||
    (process.env.NODE_ENV === "production" &&
      legalReady &&
      process.env.ENABLE_BACKGROUND_EMAIL === "true" &&
      Boolean(
        process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY,
      ) &&
      process.env.BETTER_AUTH_URL?.startsWith("https://") === true)
  );
}
export async function mailCollections() {
  const db = (await connectToDatabase()).connection.db!;
  const subscriptions = db.collection<NewsSubscription>("newsSubscriptions");
  const jobs = db.collection<BriefJob>("briefJobs");
  await subscriptions.createIndex({ userId: 1 }, { unique: true });
  await jobs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return { db, subscriptions, jobs };
}
export async function subscriptionForUser(userId: string) {
  return (await mailCollections()).subscriptions.findOne({ userId });
}
export async function updateSubscription(userId: string, active: boolean) {
  const { subscriptions } = await mailCollections();
  const existing = await subscriptions.findOne({ userId });
  if (!active) {
    await subscriptions.updateOne(
      { userId },
      { $set: { active: false, unsubscribedAt: new Date() } },
    );
    return;
  }
  if (existing?.active) return;
  await subscriptions.updateOne(
    { userId },
    {
      $set: {
        active: true,
        version: randomUUID(),
        consentedAt: new Date(),
        consentVersion: "news-brief-v1",
      },
      $unset: { unsubscribedAt: "" },
      $setOnInsert: { _id: randomUUID(), userId },
    },
    { upsert: true },
  );
}
function sign(value: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Account service is not configured");
  return createHmac("sha256", secret)
    .update(`news-unsubscribe:${value}`)
    .digest("hex");
}
function unsubscribeUrl(subscription: NewsSubscription) {
  const value = `${subscription._id}.${subscription.version}`;
  return `${process.env.BETTER_AUTH_URL}/unsubscribe?token=${value}.${sign(value)}`;
}
export async function unsubscribeWithToken(token: string) {
  if (!/^[a-f0-9-]{36}\.[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(token)) return false;
  const [id, version, signature] = token.split(".");
  if (
    !timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(sign(`${id}.${version}`), "hex"),
    )
  )
    return false;
  const { subscriptions } = await mailCollections();
  const result = await subscriptions.updateOne(
    { _id: id, version },
    {
      $set: { active: false, unsubscribedAt: new Date() },
    },
  );
  return result.matchedCount > 0;
}
export async function createBriefJob(userId: string) {
  if (!backgroundEmailEnabled())
    throw new Error("Background email is not enabled");
  const { subscriptions, jobs } = await mailCollections();
  const subscription = await subscriptions.findOne({ userId, active: true });
  if (!subscription) throw new Error("Opt in to news briefs first");
  const id = `${subscription._id}:${new Date().toISOString().slice(0, 10)}`;
  await jobs.updateOne(
    { _id: id },
    {
      $setOnInsert: {
        subscriptionId: subscription._id,
        subscriptionVersion: subscription.version,
        userId,
        status: "queued",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    },
    { upsert: true },
  );
  return (await jobs.findOne({ _id: id }))!;
}

// Inngest serialises runs by job ID. Completed jobs are skipped on replay. SMTP
// cannot guarantee exactly-once delivery after a crash between acceptance and
// this database write; a stable Message-ID helps, but is not an exactly-once claim.
export async function deliverBriefJob(jobId: string) {
  if (!backgroundEmailEnabled())
    throw new Error("Background email is not enabled");
  const { db, jobs, subscriptions } = await mailCollections();
  const job = await jobs.findOne({ _id: jobId });
  if (!job || job.status !== "queued")
    return { status: job?.status || "missing" };
  const subscription = await subscriptions.findOne({
    _id: job.subscriptionId,
    version: job.subscriptionVersion,
    active: true,
  });
  const user = await db
    .collection("user")
    .findOne(
      ObjectId.isValid(job.userId)
        ? { _id: new ObjectId(job.userId) }
        : { id: job.userId },
    );
  if (!subscription || !user?.emailVerified || typeof user.email !== "string") {
    await jobs.updateOne({ _id: jobId }, { $set: { status: "cancelled" } });
    return { status: "cancelled" };
  }
  const local = isIsolatedTestEnvironment();
  const news = local ? [] : await getNews();
  if (!local && !news.length)
    throw new Error("News provider is unavailable; no invented brief was sent");
  const unsubscribe = unsubscribeUrl(subscription);
  const headlines = local
    ? "LOCAL TEST FIXTURE — this message tests SMTP delivery, not current news.\n\nResearch prompt: compare the company's latest published financial statements across periods."
    : news
        .slice(0, 6)
        .map(
          (item) =>
            `${item.headline}\n${item.source} · ${new Date(item.datetime * 1000).toISOString().slice(0, 10)}\n${item.url}`,
        )
        .join("\n\n");
  // Recheck withdrawal immediately before delivery, not just when queuing.
  if (
    !(await subscriptions.findOne({
      _id: subscription._id,
      version: subscription.version,
      active: true,
    }))
  ) {
    await jobs.updateOne({ _id: jobId }, { $set: { status: "cancelled" } });
    return { status: "cancelled" };
  }
  await sendServiceEmail({
    to: user.email,
    subject: `${local ? "[TEST] " : ""}Your Stillmark news brief`,
    text: `Your requested market reading list\n\n${headlines}\n\nThese are publisher headlines, not AI analysis or investment recommendations. Open the sources and check their dates.\n\nYou opted in through Settings. Unsubscribe without signing in:\n${unsubscribe}\n\nA message already being delivered may still arrive after you unsubscribe.`,
    messageId: `<${jobId}@stillmark.local>`,
    unsubscribeUrl: unsubscribe,
  });
  await jobs.updateOne(
    { _id: jobId },
    { $set: { status: "sent", sentAt: new Date() } },
  );
  return { status: "sent" };
}
