"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import {
  addToWatchlist,
  getCurrentUserWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import type { PriceAlert, ReaderUser, SavedStock } from "@/lib/market-types";
export const WATCHLIST_KEY = "stillmark.watchlist.v1";
export const ALERTS_KEY = "stillmark.alerts.v1";
const eventName = "stillmark-workspace";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}
function read(key: string) {
  try {
    return localStorage.getItem(key) || "[]";
  } catch {
    return "[]";
  }
}
function parse<T>(raw: string, valid: (item: T) => boolean): T[] {
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(valid).slice(0, 100) : [];
  } catch {
    return [];
  }
}
function write(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event(eventName));
    return true;
  } catch {
    toast.error(
      "Your browser could not save this change. Check your storage settings.",
      { id: "workspace-storage-error" },
    );
    return false;
  }
}
function validStock(item: SavedStock) {
  return (
    !!item &&
    typeof item.symbol === "string" &&
    /^[A-Z0-9.:-]{1,25}$/.test(item.symbol) &&
    typeof item.company === "string"
  );
}
function validAlert(item: PriceAlert) {
  return (
    !!item &&
    typeof item.id === "string" &&
    typeof item.symbol === "string" &&
    /^[A-Z0-9.:-]{1,25}$/.test(item.symbol) &&
    ["above", "below"].includes(item.direction) &&
    Number.isFinite(item.target) &&
    item.target > 0
  );
}
type AlertCommit = { success: boolean; triggered: PriceAlert[] };
const Context = createContext<{
  user: ReaderUser | null;
  stocks: SavedStock[];
  alerts: PriceAlert[];
  toggleStock: (stock: SavedStock) => Promise<boolean>;
  saveAlert: (alert: PriceAlert) => boolean;
  removeAlert: (id: string) => boolean;
  markTriggered: (ids: string[]) => AlertCommit;
  clearLocal: () => boolean;
}>({
  user: null,
  stocks: [],
  alerts: [],
  toggleStock: async () => false,
  saveAlert: () => false,
  removeAlert: () => false,
  markTriggered: () => ({ success: false, triggered: [] }),
  clearLocal: () => false,
});
export function WorkspaceProvider({
  user,
  initialStocks,
  children,
}: {
  user: ReaderUser | null;
  initialStocks: SavedStock[];
  children: React.ReactNode;
}) {
  const [accountStocks, setAccountStocks] = useState(initialStocks);
  const pendingStocks = useRef(new Map<string, Promise<boolean>>());
  const mutationVersion = useRef(0);
  const refreshVersion = useRef(0);
  const accountChannel = useRef<BroadcastChannel | null>(null);
  const userId = user?.id;
  const refreshAccountStocks = useCallback(async () => {
    if (!userId || pendingStocks.current.size) return;
    const mutation = mutationVersion.current;
    const request = ++refreshVersion.current;
    try {
      const current = await getCurrentUserWatchlist();
      // A response begun before another save must never undo its result.
      if (
        request === refreshVersion.current &&
        mutation === mutationVersion.current &&
        !pendingStocks.current.size
      )
        setAccountStocks(current);
    } catch {
      // Keep the last confirmed state. A later focus or save retries the read.
    }
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshAccountStocks();
    };
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined")
        channel = new BroadcastChannel(`stillmark-watchlist.${userId}`);
    } catch {
      // Private browser modes may block channels. Focus still refreshes data.
    }
    accountChannel.current = channel;
    if (channel) channel.onmessage = refresh;
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      channel?.close();
      accountChannel.current = null;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId, refreshAccountStocks]);
  useEffect(() => {
    // Reconcile route refreshes, but never apply a stale server prop over an
    // in-flight mutation. Coalesce prop updates before starting another read;
    // the final mutation also reconciles once it settles.
    const timer = window.setTimeout(() => void refreshAccountStocks(), 0);
    return () => window.clearTimeout(timer);
  }, [initialStocks, refreshAccountStocks]);
  const watchRaw = useSyncExternalStore(
    subscribe,
    () => read(WATCHLIST_KEY),
    () => "[]",
  );
  const alertKey = user ? ALERTS_KEY + "." + user.id : ALERTS_KEY;
  const alertRaw = useSyncExternalStore(
    subscribe,
    () => read(alertKey),
    () => "[]",
  );
  const guestStocks = parse<SavedStock>(watchRaw, validStock);
  const alerts = parse<PriceAlert>(alertRaw, validAlert);
  const stocks = user ? accountStocks : guestStocks;
  async function toggleStock(stock: SavedStock) {
    // Multiple buttons can represent the same stock. Share the pending intent
    // so clicking a second copy cannot accidentally invert an unfinished save.
    const pending = pendingStocks.current.get(stock.symbol);
    if (pending) return pending;
    const current = user
      ? accountStocks
      : parse<SavedStock>(read(WATCHLIST_KEY), validStock);
    const exists = current.some((item) => item.symbol === stock.symbol);
    if (!exists && current.length >= 100) {
      toast.error("A watchlist can hold up to 100 stocks.");
      return false;
    }
    const applyIntent = (items: SavedStock[]) =>
      exists
        ? items.filter((item) => item.symbol !== stock.symbol)
        : items.some((item) => item.symbol === stock.symbol)
          ? items
          : [...items, stock];
    if (user) {
      ++mutationVersion.current;
      const task = (async () => {
        try {
          const result = exists
            ? await removeFromWatchlist(stock.symbol)
            : await addToWatchlist(stock);
          if (!result.success) {
            toast.error(result.error || "Could not update your watchlist.");
            return false;
          }
          // Apply an idempotent add/remove to the latest state, not the array
          // captured before this request. Other symbols may have just saved.
          setAccountStocks(applyIntent);
          try {
            accountChannel.current?.postMessage("changed");
          } catch {
            // Cross-tab refresh is best-effort; the account save succeeded.
          }
          toast.success(
            exists
              ? `${stock.symbol} removed from watchlist`
              : `${stock.symbol} added to watchlist`,
          );
          return true;
        } catch {
          toast.error("Could not update your watchlist. Please try again.");
          return false;
        }
      })();
      pendingStocks.current.set(stock.symbol, task);
      void task.finally(() => {
        pendingStocks.current.delete(stock.symbol);
        if (!pendingStocks.current.size) void refreshAccountStocks();
      });
      return task;
    }
    if (!write(WATCHLIST_KEY, applyIntent(current))) return false;
    toast.success(
      exists
        ? `${stock.symbol} removed from watchlist`
        : `${stock.symbol} added to watchlist`,
    );
    return true;
  }
  function saveAlert(alert: PriceAlert) {
    const current = parse<PriceAlert>(read(alertKey), validAlert);
    if (current.length >= 30) {
      toast.error("You can keep up to 30 browser alerts.");
      return false;
    }
    if (
      current.some(
        (item) =>
          item.id === alert.id ||
          (!item.triggeredAt &&
            item.symbol === alert.symbol &&
            item.direction === alert.direction &&
            item.target === alert.target),
      )
    ) {
      toast.error("You already have an active alert for this target.");
      return false;
    }
    return write(alertKey, [...current, alert]);
  }
  function clearLocal() {
    try {
      localStorage.removeItem(WATCHLIST_KEY);
      localStorage.removeItem(alertKey);
      window.dispatchEvent(new Event(eventName));
      toast.success("This browser’s watchlist and alerts were cleared.");
      return true;
    } catch {
      // A browser may permit one removal and reject another. Reflect any
      // successful removal instead of leaving the UI stale after partial work.
      window.dispatchEvent(new Event(eventName));
      toast.error("Could not clear browser data.");
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        stocks,
        alerts,
        toggleStock,
        saveAlert,
        clearLocal,
        removeAlert: (id) => {
          return write(
            alertKey,
            parse<PriceAlert>(read(alertKey), validAlert).filter(
              (item) => item.id !== id,
            ),
          );
        },
        markTriggered: (ids) => {
          const current = parse<PriceAlert>(read(alertKey), validAlert);
          const triggered = current.filter(
            (item) => ids.includes(item.id) && !item.triggeredAt,
          );
          if (!triggered.length) return { success: true, triggered: [] };
          const success = write(
            alertKey,
            current.map((item) =>
              ids.includes(item.id) && !item.triggeredAt
                ? { ...item, triggeredAt: new Date().toISOString() }
                : item,
            ),
          );
          return { success, triggered: success ? triggered : [] };
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useWorkspace = () => useContext(Context);
