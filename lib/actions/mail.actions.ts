"use server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  backgroundEmailEnabled,
  createBriefJob,
  subscriptionForUser,
  updateSubscription,
} from "@/lib/mail-preferences";
import { permitUserAction } from "@/lib/rate-limit";
import { deliveryInngest } from "@/lib/inngest/delivery-client";

export async function setNewsSubscription(active: boolean) {
  if (typeof active !== "boolean")
    return { success: false, error: "Choose whether to receive news briefs." };
  try {
    const session = await getSession();
    if (!session?.user.emailVerified)
      return {
        success: false,
        error: "Sign in with a verified account first.",
      };
    if (active && !backgroundEmailEnabled())
      return { success: false, error: "News email is not enabled." };
    if (
      active &&
      !(await permitUserAction(session.user.id, "news-consent", 10))
    )
      return { success: false, error: "Too many changes. Try again later." };
    await updateSubscription(session.user.id, active);
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Could not update your email preference." };
  }
}
export async function requestNewsBrief() {
  try {
    const session = await getSession();
    if (!session?.user.emailVerified)
      return {
        success: false,
        error: "Sign in with a verified account first.",
      };
    if (!backgroundEmailEnabled())
      return { success: false, error: "News email is not enabled." };
    if (!(await subscriptionForUser(session.user.id)))
      return { success: false, error: "Opt in to news briefs first." };
    if (!(await permitUserAction(session.user.id, "news-request", 5)))
      return { success: false, error: "Too many requests. Try again later." };
    const job = await createBriefJob(session.user.id);
    if (job.status === "sent")
      return {
        success: true,
        message:
          "Today's brief has already been sent. The limit is one per UTC day.",
      };
    if (job.status === "cancelled")
      return {
        success: false,
        error:
          "Today's delivery was cancelled. A new brief can be requested tomorrow.",
      };
    await deliveryInngest.send({
      name: "stillmark/brief.requested",
      data: { jobId: job._id },
    });
    return {
      success: true,
      message:
        "Brief queued. Delivery depends on the worker and mail provider.",
    };
  } catch {
    return {
      success: false,
      error:
        "Could not submit your brief. Check that the Inngest worker is running and try again.",
    };
  }
}
