import { AppShell } from "@/components/AppShell";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { getSession } from "@/lib/session";
import { getCurrentUserWatchlist } from "@/lib/actions/watchlist.actions";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const stocks = session ? await getCurrentUserWatchlist() : [];
  const user = session
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    : null;
  return (
    <WorkspaceProvider
      key={user?.id || "guest"}
      user={user}
      initialStocks={stocks}
    >
      <AppShell user={user}>{children}</AppShell>
    </WorkspaceProvider>
  );
}
