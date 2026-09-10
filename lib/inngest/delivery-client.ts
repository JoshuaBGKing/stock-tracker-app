import "server-only";
import { Inngest } from "inngest";
import { isIsolatedTestEnvironment } from "@/lib/test-mode";

const local = isIsolatedTestEnvironment();
export const deliveryInngest = new Inngest({
  id: local ? "stillmark-test-delivery" : "stillmark-delivery",
  isDev: local,
  ...(local
    ? { baseUrl: "http://127.0.0.1:8288", eventKey: "stillmark-local" }
    : {}),
});
