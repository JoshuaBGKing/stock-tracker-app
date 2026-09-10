import "server-only";
import { NonRetriableError } from "inngest";
import { deliveryInngest } from "./delivery-client";
import {
  backgroundEmailEnabled,
  createBriefJob,
  deliverBriefJob,
  mailCollections,
} from "@/lib/mail-preferences";

export const deliverNewsBrief = deliveryInngest.createFunction(
  {
    id: "deliver-news-brief",
    name: "Deliver opted-in news brief",
    retries: 3,
    concurrency: { limit: 1, key: "event.data.jobId" },
  },
  { event: "stillmark/brief.requested" },
  async ({ event, step }) => {
    if (
      !backgroundEmailEnabled() ||
      typeof event.data.jobId !== "string" ||
      !/^[a-f0-9-]{36}:\d{4}-\d{2}-\d{2}$/.test(event.data.jobId)
    )
      throw new NonRetriableError("Invalid or disabled email job");
    return step.run("recheck-consent-and-send-email", () =>
      deliverBriefJob(event.data.jobId),
    );
  },
);

// Optional production schedule: never registered without its own explicit flag.
export const scheduleNewsBriefs = deliveryInngest.createFunction(
  { id: "schedule-news-briefs", retries: 2 },
  { cron: "0 22 * * 1-5" },
  async ({ step }) => {
    if (
      !backgroundEmailEnabled() ||
      process.env.ENABLE_DAILY_BRIEF_CRON !== "true"
    )
      throw new NonRetriableError("Scheduled news email is disabled");
    let after = "";
    let queued = 0;
    for (;;) {
      const batch = await step.run(`load-subscribers-${queued}`, async () => {
        const { subscriptions } = await mailCollections();
        return (
          await subscriptions
            .find({ active: true, _id: { $gt: after } })
            .sort({ _id: 1 })
            .limit(100)
            .toArray()
        ).map((item) => ({ id: item._id, userId: item.userId }));
      });
      if (!batch.length) break;
      const jobs = await step.run(`queue-briefs-${queued}`, async () => {
        const ids: string[] = [];
        for (const item of batch) {
          // Consent may have been withdrawn since selection; skip those records.
          const { subscriptions } = await mailCollections();
          if (!(await subscriptions.findOne({ _id: item.id, active: true })))
            continue;
          const job = await createBriefJob(item.userId);
          if (job.status === "queued") ids.push(job._id);
        }
        return ids;
      });
      if (jobs.length)
        await step.sendEvent(
          `dispatch-briefs-${queued}`,
          jobs.map((jobId) => ({
            name: "stillmark/brief.requested",
            data: { jobId },
          })),
        );
      queued += batch.length;
      after = batch[batch.length - 1].id;
    }
    return { processed: queued };
  },
);
