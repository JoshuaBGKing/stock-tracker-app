import type { Metadata } from "next";
import { SettingsView } from "@/components/SettingsView";
import { NewsEmailSettings } from "@/components/NewsEmailSettings";
import {
  backgroundEmailEnabled,
  subscriptionForUser,
} from "@/lib/mail-preferences";
import { getSession } from "@/lib/session";
import { isIsolatedTestEnvironment } from "@/lib/test-mode";
export const metadata: Metadata = { title: "Settings & privacy" };
export default async function SettingsPage() {
  const session = await getSession();
  const subscription = session
    ? await subscriptionForUser(session.user.id)
    : null;
  return (
    <>
      <SettingsView />
      <NewsEmailSettings
        key={`${subscription?.version || "none"}:${subscription?.active}`}
        signedIn={Boolean(session?.user.emailVerified)}
        enabled={backgroundEmailEnabled()}
        subscribed={Boolean(subscription?.active)}
        scheduled={
          process.env.ENABLE_DAILY_BRIEF_CRON === "true" &&
          !isIsolatedTestEnvironment()
        }
        testMode={isIsolatedTestEnvironment()}
      />
    </>
  );
}
