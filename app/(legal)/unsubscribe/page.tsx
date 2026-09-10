import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
export const metadata = { title: "Unsubscribe from news briefs" };
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { token, done } = await searchParams;
  return (
    <LegalDocument
      title="Your inbox, your choice."
      intro="Stop Stillmark news briefs without signing in."
    >
      {done === "1" ? (
        <p role="status">
          The unsubscribe request has been processed. Account verification and
          password recovery emails are separate service messages.
        </p>
      ) : (
        <form action="/api/unsubscribe" method="post">
          <input
            type="hidden"
            name="token"
            value={typeof token === "string" ? token.slice(0, 200) : ""}
          />
          <p>
            Confirm below to stop news briefs. A message already being delivered
            may still arrive.
          </p>
          <button className="button primary" type="submit">
            Unsubscribe from news briefs
          </button>
        </form>
      )}
      <p>
        <Link className="text-link" href="/settings">
          Manage email preferences in Settings
        </Link>
      </p>
    </LegalDocument>
  );
}
