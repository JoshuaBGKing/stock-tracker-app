"use server";
import { getSession } from "@/lib/session";
import { generateResearchInsight } from "@/lib/insights";
import { permitUserAction } from "@/lib/rate-limit";

export async function requestResearchInsight(symbol: string, consent: boolean) {
  if (
    consent !== true ||
    typeof symbol !== "string" ||
    !/^[A-Z0-9.:-]{1,25}$/.test(symbol)
  )
    return {
      success: false as const,
      error: "Choose a valid stock and allow this AI request first.",
    };
  try {
    const session = await getSession();
    if (!session?.user.emailVerified)
      return {
        success: false as const,
        error: "Sign in with a verified account to request AI research.",
      };
    if (!(await permitUserAction(session.user.id, "ai-insight", 6)))
      return {
        success: false as const,
        error:
          "You can request up to six AI research notes per hour. Try again later.",
      };
    return {
      success: true as const,
      data: await generateResearchInsight(symbol),
    };
  } catch {
    return {
      success: false as const,
      error:
        "AI research is unavailable. Check provider configuration or quota and try again later.",
    };
  }
}
