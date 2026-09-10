"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "./PreferencesProvider";
import { AppearanceSettings } from "./AppearanceSettings";
import { useWorkspace } from "./WorkspaceProvider";
import { downloadJson } from "./WatchlistView";
import {
  deleteAccount,
  exportAccount,
  signOut,
} from "@/lib/actions/auth.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
export function SettingsView() {
  const { embeds, setEmbeds } = usePreferences();
  const { user, stocks, alerts, clearLocal } = useWorkspace();
  const [dialog, setDialog] = useState<"clear" | "delete" | null>(null),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  function closeDialog() {
    setDialog(null);
    setError("");
    setPassword("");
    setConfirmation("");
  }
  function openDialog(value: "clear" | "delete") {
    setPassword("");
    setConfirmation("");
    setError("");
    setDialog(value);
  }
  async function accountExport() {
    setPending(true);
    try {
      const result = await exportAccount();
      if (result.success)
        downloadJson("stillmark-account.json", {
          ...result.data,
          browserAlerts: alerts,
        });
      else toast.error(result.error);
    } catch {
      toast.error("Could not export your account.");
    } finally {
      setPending(false);
    }
  }
  async function logout() {
    setPending(true);
    try {
      const result = await signOut();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }
  async function confirm(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog === "clear") {
      if (clearLocal()) closeDialog();
      return;
    }
    if (confirmation !== "DELETE") {
      setError("Type DELETE to confirm.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await deleteAccount(password);
      if (!result.success) {
        setError(result.error || "Could not delete account.");
        return;
      }
      clearLocal();
      toast.success("Account deleted");
      closeDialog();
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not delete the account. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your space, your choices</span>
          <h1>A little more control.</h1>
          <p>Choose what you share and keep your workspace on your terms.</p>
        </div>
        <ShieldCheck
          size={32}
          strokeWidth={1.2}
          className="text-primary"
          aria-hidden="true"
        />
      </div>
      <div className="settings-grid">
        <AppearanceSettings />
        <section className="panel settings-section">
          <h2>Privacy preferences</h2>
          <p>
            No advertising trackers, session recording, or site analytics are
            installed. Optional external charts stay off until you choose to
            load them.
          </p>
          <div className="preference-row">
            <div>
              <strong>Essential account cookies</strong>
              <p>
                Used only when you sign in. Required to keep your session
                secure.
              </p>
            </div>
            <span className="status-pill">Required for sign-in</span>
          </div>
          <div className="preference-row">
            <div>
              <strong id="embeds-label">TradingView charts</strong>
              <p id="embeds-description">
                Shares browser details, IP address and viewed symbols with
                TradingView, which may use cookies. Your choice expires after
                180 days. Turning off reloads this page to stop loaded scripts.
              </p>
            </div>
            <button
              className="switch"
              role="switch"
              aria-checked={embeds}
              aria-labelledby="embeds-label"
              aria-describedby="embeds-description"
              onClick={() => setEmbeds(!embeds)}
            >
              <span />
            </button>
          </div>
          <div className="preference-row">
            <div>
              <strong>Analytics & advertising</strong>
              <p>
                Not installed. No analytics or advertising consent is requested.
              </p>
            </div>
            <span className="status-pill">Not used</span>
          </div>
          <div className="preference-row">
            <div>
              <strong>AI research & news email</strong>
              <p>
                Optional AI research requires permission for each request. News
                briefs require a separate subscription below.
              </p>
            </div>
            <span className="status-pill">Optional</span>
          </div>
          <Link className="text-link mt-4" href="/cookies">
            Read the cookies policy →
          </Link>
        </section>
        <section className="panel settings-section">
          <h2>Your browser data</h2>
          <p>
            {user
              ? "Your watchlist syncs with your account. Price alerts are stored only on this browser, separately for your account."
              : "Your guest watchlist and price alerts stay on this device. Clearing your browser’s storage will remove them."}
          </p>
          <div className="preference-row">
            <div>
              <strong>{stocks.length} saved stocks</strong>
              <p>
                {user ? "Stored in your account" : "Stored in this browser"}
              </p>
            </div>
            <StarCount />
          </div>
          <div className="preference-row">
            <div>
              <strong>{alerts.length} browser alerts</strong>
              <p>No background or email delivery</p>
            </div>
            <span className="status-pill">Local only</span>
          </div>
          <div className="page-actions mt-6">
            <button
              className="button"
              onClick={() =>
                downloadJson("stillmark-workspace.json", {
                  exportedAt: new Date().toISOString(),
                  stocks,
                  alerts,
                })
              }
            >
              <Download size={14} aria-hidden="true" />
              Export workspace
            </button>
            <button
              className="button danger"
              onClick={() => openDialog("clear")}
            >
              <Trash2 size={14} aria-hidden="true" />
              Clear browser data
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-5">
            {user
              ? "Clearing browser data does not remove your synced watchlist or account."
              : "Your export contains the stocks and alerts you saved, without passwords or session tokens."}
          </p>
        </section>
        <section className="panel settings-section">
          <h2>Your account</h2>
          {user ? (
            <>
              <p>
                Signed in as {user.email}. Account exports contain your profile
                and watchlist. Account deletion also removes your saved
                watchlist, credentials, and sessions.
              </p>
              <div className="page-actions">
                <button
                  className="button"
                  disabled={pending}
                  onClick={accountExport}
                >
                  <Download size={14} aria-hidden="true" />
                  Export account
                </button>
                <button className="button" disabled={pending} onClick={logout}>
                  <LogOut size={14} aria-hidden="true" />
                  Sign out
                </button>
                <button
                  className="button danger"
                  disabled={pending}
                  onClick={() => openDialog("delete")}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete account
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                You’re using the guest workspace. You can keep a watchlist and
                browser alerts without sharing an email address.
              </p>
              <Link className="button" href="/sign-in">
                Sign in to an existing account
              </Link>
            </>
          )}
        </section>
        <section className="panel settings-section">
          <h2>Clear policies. Open choices.</h2>
          <p>
            Understand what’s collected, how the workspace works, and where
            third-party services are involved.
          </p>
          <div className="side-nav">
            <Link href="/privacy">Privacy policy →</Link>
            <Link href="/terms">Terms & conditions →</Link>
            <Link href="/cookies">Cookies policy →</Link>
            <Link href="/accessibility">Accessibility statement →</Link>
          </div>
        </section>
      </div>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!pending && !open) {
            closeDialog();
          }
        }}
      >
        <DialogContent>
          <DialogTitle>
            {dialog === "clear"
              ? "Clear this browser’s data?"
              : "Delete your Stillmark account?"}
          </DialogTitle>
          <DialogDescription>
            {dialog === "clear"
              ? "This removes the guest watchlist and this workspace’s browser alerts. Export anything you want to keep first. Privacy preferences and synced account data are not removed."
              : "This permanently removes your account, saved stocks, news subscription, email jobs, credentials and sessions from the active database. This action cannot be undone. Backups follow the operator’s retention policy."}
          </DialogDescription>
          <form onSubmit={confirm}>
            {dialog === "delete" && (
              <>
                <div className="field">
                  <label htmlFor="delete-password">Confirm your password</label>
                  <input
                    id="delete-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="delete-confirm">Type DELETE to confirm</label>
                  <input
                    id="delete-confirm"
                    required
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="page-actions">
              <button
                type="button"
                className="button"
                disabled={pending}
                onClick={closeDialog}
              >
                Keep my data
              </button>
              <button
                type="submit"
                className="button danger"
                disabled={pending}
              >
                {pending
                  ? "Deleting…"
                  : dialog === "clear"
                    ? "Clear browser data"
                    : "Permanently delete account"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
function StarCount() {
  return <span className="status-pill">Your collection</span>;
}
