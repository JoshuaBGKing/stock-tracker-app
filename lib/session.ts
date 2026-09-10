import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
export const getSession = cache(async () => {
  const requestHeaders = await headers();
  if (!requestHeaders.get("cookie")?.includes("better-auth.session_token"))
    return null;
  const auth = await getAuth();
  return auth.api.getSession({ headers: requestHeaders });
});
