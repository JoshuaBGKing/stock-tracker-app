import "server-only";
import { Inngest } from "inngest";

// A separate local app identity cannot replace a deployed tutorial schedule.
// Explicit URLs and dev mode keep test events off Inngest Cloud, regardless of
// legacy keys in .env. The route additionally rejects production invocations.
export const inngest = new Inngest({
  id: "stillmark-local",
  isDev: true,
  baseUrl: "http://127.0.0.1:8288",
  eventKey: "stillmark-local",
});
