import { serve } from "inngest/next";
import type { NextRequest } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { sendDailyNewsSummary, sendSignUpEmail } from "@/lib/inngest/functions";
import { localWorkflowsEnabled } from "@/lib/inngest/local-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = serve({
  client: inngest,
  functions: [sendSignUpEmail, sendDailyNewsSummary],
});

function disabled(status: number) {
  return Response.json(
    {
      enabled: false,
      message:
        "Local workflow previews require next dev. Production delivery is disabled.",
    },
    { status },
  );
}

function localRequest(request: NextRequest) {
  const url = new URL(request.url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return false;
  // Local dev has no signature check. Block cross-origin browser calls and bind
  // the documented dev commands to loopback; a Host check alone is not auth.
  const origin = request.headers.get("origin");
  return !origin || origin === url.origin;
}

async function handle(method: "GET" | "POST" | "PUT", request: NextRequest) {
  if (!localWorkflowsEnabled()) return disabled(method === "GET" ? 200 : 403);
  if (!localRequest(request))
    return Response.json({ error: "Local requests only." }, { status: 403 });
  const response = await handlers[method](request, undefined);
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
