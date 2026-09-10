import "server-only";
import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { localWorkflowsEnabled } from "./local-mode";
import { sampleSnapshot } from "@/lib/market-catalog";
import {
  dailyNewsPreview,
  readPreviewSymbols,
  welcomeEmailPreview,
} from "./previews";

function validatePreview(data: unknown) {
  if (!localWorkflowsEnabled())
    throw new NonRetriableError("Workflow previews are development-only.");
  try {
    return readPreviewSymbols(data);
  } catch (error) {
    throw new NonRetriableError(
      error instanceof Error ? error.message : "Invalid preview event.",
    );
  }
}

// Manual events only: no cron, signup dispatch, user lookup, SMTP or AI calls.
export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email", name: "Welcome email · local preview", retries: 1 },
  { event: "app/user.created" },
  async ({ event, step }) => {
    await step.run("validate-local-test", () => validatePreview(event.data));
    return await step.run("render-welcome-email", () => welcomeEmailPreview());
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  {
    id: "daily-news-summary",
    name: "Daily news summary · local preview",
    retries: 1,
  },
  { event: "app/send.daily.news" },
  async ({ event, step }) => {
    const symbols = await step.run("validate-local-test", () =>
      validatePreview(event.data),
    );
    const snapshot = await step.run("load-illustrative-market-data", () =>
      sampleSnapshot(),
    );
    return await step.run("render-news-summary", () =>
      dailyNewsPreview(snapshot, symbols),
    );
  },
);
