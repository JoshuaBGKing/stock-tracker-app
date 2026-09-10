import { serve } from "inngest/next";
import type { NextRequest } from "next/server";
import { deliveryInngest } from "@/lib/inngest/delivery-client";
import {
  deliverNewsBrief,
  scheduleNewsBriefs,
} from "@/lib/inngest/delivery-functions";
import { backgroundEmailEnabled } from "@/lib/mail-preferences";
import { isIsolatedTestEnvironment } from "@/lib/test-mode";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = serve({
  client: deliveryInngest,
  functions: [
    deliverNewsBrief,
    ...(process.env.ENABLE_DAILY_BRIEF_CRON === "true" &&
    !isIsolatedTestEnvironment()
      ? [scheduleNewsBriefs]
      : []),
  ],
});
async function handle(method: "GET" | "POST" | "PUT", request: NextRequest) {
  if (!backgroundEmailEnabled())
    return Response.json(
      { enabled: false },
      { status: method === "GET" ? 200 : 403 },
    );
  if (isIsolatedTestEnvironment()) {
    const url = new URL(request.url),
      origin = request.headers.get("origin");
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      (origin && origin !== `http://${request.headers.get("host")}`)
    )
      return Response.json({ error: "Local requests only" }, { status: 403 });
  }
  const response = await handler[method](request, undefined);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export async function GET(request: NextRequest) {
  return handle("GET", request);
}
export async function POST(request: NextRequest) {
  return handle("POST", request);
}
export async function PUT(request: NextRequest) {
  return handle("PUT", request);
}
