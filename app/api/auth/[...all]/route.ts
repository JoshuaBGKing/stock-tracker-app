import { getAuth } from "@/lib/better-auth/auth";
// Account creation, sign-in, reset and deletion use validated Server Actions.
// Only email verification and reset-link resolution need public GET callbacks.
export async function GET(request: Request) {
  const path = new URL(request.url).pathname;
  if (!/^\/api\/auth\/(verify-email|reset-password\/[^/]+)$/.test(path))
    return Response.json({ error: "Not found" }, { status: 404 });
  try {
    return await (await getAuth()).handler(request);
  } catch {
    return Response.json(
      { error: "Account service unavailable" },
      { status: 503 },
    );
  }
}
