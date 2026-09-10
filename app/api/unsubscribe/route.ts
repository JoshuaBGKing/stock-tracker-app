import { unsubscribeWithToken } from "@/lib/mail-preferences";
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 1024)
      return new Response("Request too large", { status: 413 });
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1024) {
          await reader.cancel();
          return new Response("Request too large", { status: 413 });
        }
        chunks.push(value);
      }
    }
    const body = Buffer.concat(chunks).toString("utf8");
    const fields = new URLSearchParams(body),
      url = new URL(request.url);
    const oneClick = fields.get("List-Unsubscribe") === "One-Click";
    const token = oneClick
      ? url.searchParams.get("token")
      : fields.get("token");
    if (token) await unsubscribeWithToken(token);
    // Generic responses never reveal whether an account or subscription exists.
    if (oneClick)
      return new Response("Unsubscribe request processed", {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    return Response.redirect(
      new URL("/unsubscribe?done=1", process.env.BETTER_AUTH_URL),
      303,
    );
  } catch {
    return new Response("Unable to process the request. Please try again.", {
      status: 503,
    });
  }
}
