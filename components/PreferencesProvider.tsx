"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export const PREFERENCES_KEY = "stillmark.preferences.v1";
type Preferences = {
  embeds: boolean;
  updatedAt: string;
  version: 1;
  temporary?: boolean;
};
const fallback = '{"embeds":false,"updatedAt":"","version":1}';
const temporaryFallback =
  '{"embeds":false,"updatedAt":"","version":1,"temporary":true}';
const refusalCookie = "stillmark.charts-off";
let documentBlocked = false;
let temporaryRefusal = false;
function hasRefusalCookie() {
  return document.cookie
    .split(";")
    .some((item) => item.trim() === `${refusalCookie}=1`);
}
function setRefusalCookie(blocked: boolean) {
  document.cookie = `${refusalCookie}=${blocked ? "1" : ""}; Path=/; Max-Age=${blocked ? 180 * 86400 : 0}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return hasRefusalCookie() === blocked;
}
function signalChange() {
  window.dispatchEvent(new Event("stillmark-preferences"));
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("stillmark-preferences", callback);
  window.addEventListener("visibilitychange", callback);
  const timer = window.setInterval(callback, 60000);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("stillmark-preferences", callback);
    window.removeEventListener("visibilitychange", callback);
    window.clearInterval(timer);
  };
}
function snapshot() {
  try {
    // Last-resort URL refusal survives reload when every storage mechanism fails.
    if (new URL(window.location.href).searchParams.get("charts") === "off") {
      documentBlocked = true;
      temporaryRefusal = true;
    }
    if (temporaryRefusal) return temporaryFallback;
    if (documentBlocked || hasRefusalCookie()) return fallback;
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return fallback;
    const prefs = JSON.parse(raw) as Preferences;
    const age = Date.now() - Date.parse(prefs.updatedAt);
    return prefs.version === 1 && age >= 0 && age < 180 * 86400000
      ? raw
      : fallback;
  } catch {
    return fallback;
  }
}
const Context = createContext({
  embeds: false,
  setEmbeds: (_value: boolean) => {
    void _value;
  },
});
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, snapshot, () => fallback);
  let prefs: Preferences;
  try {
    prefs = JSON.parse(raw);
  } catch {
    prefs = JSON.parse(fallback);
  }
  const enabled = prefs.embeds === true;
  const previouslyEnabled = useRef(false);
  useEffect(() => {
    if (previouslyEnabled.current && !enabled) window.location.reload();
    previouslyEnabled.current = enabled;
  }, [enabled]);
  useEffect(() => {
    // Preserve the fail-closed marker on client navigation so a later reload
    // cannot resurrect a consent value the browser refused to erase.
    if (temporaryRefusal) {
      const url = new URL(window.location.href);
      url.searchParams.set("charts", "off");
      window.history.replaceState(window.history.state, "", url);
    }
  }, [pathname]);
  function setEmbeds(embeds: boolean) {
    if (!embeds) {
      documentBlocked = true;
      let remembered = false;
      try {
        const off = JSON.stringify({
          embeds: false,
          updatedAt: new Date().toISOString(),
          version: 1,
        });
        localStorage.setItem(PREFERENCES_KEY, off);
        remembered = localStorage.getItem(PREFERENCES_KEY) === off;
      } catch {
        /* Try removing the old grant when storage is full/read-only. */
      }
      if (!remembered) {
        try {
          localStorage.removeItem(PREFERENCES_KEY);
          remembered = localStorage.getItem(PREFERENCES_KEY) === null;
        } catch {
          /* A first-party refusal cookie never grants chart permission. */
        }
      }
      if (!remembered) {
        try {
          remembered = setRefusalCookie(true);
        } catch {
          /* Fall back to the URL. */
        }
      }
      temporaryRefusal = !remembered;
      if (!remembered) {
        // Persist the refusal in the current URL before notifying React. The
        // enabled-to-disabled effect can synchronously initiate its own reload.
        const url = new URL(window.location.href);
        url.searchParams.set("charts", "off");
        window.history.replaceState(window.history.state, "", url);
      }
      signalChange();
      // Removing React content cannot stop all previously loaded vendor scripts.
      // Unload this document even if saving the refusal failed.
      window.location.reload();
      return;
    }
    try {
      const grant = JSON.stringify({
        embeds: true,
        updatedAt: new Date().toISOString(),
        version: 1,
      });
      localStorage.setItem(PREFERENCES_KEY, grant);
      if (
        localStorage.getItem(PREFERENCES_KEY) !== grant ||
        !setRefusalCookie(false)
      )
        throw new Error("Permission could not be saved");
      documentBlocked = false;
      temporaryRefusal = false;
      const url = new URL(window.location.href);
      url.searchParams.delete("charts");
      window.history.replaceState(window.history.state, "", url);
      signalChange();
      toast.success("TradingView charts enabled");
    } catch {
      documentBlocked = true;
      signalChange();
      toast.error(
        "Your browser could not save this preference. External charts remain off.",
      );
    }
  }
  return (
    <Context.Provider value={{ embeds: prefs.embeds === true, setEmbeds }}>
      {prefs.temporary && (
        <p className="notice" role="alert">
          Charts are off in this tab, but your browser could not remember the
          choice. Keep the charts=off address parameter, or clear this site’s
          stored permissions before opening a new tab.
        </p>
      )}
      {children}
    </Context.Provider>
  );
}
export const usePreferences = () => useContext(Context);
