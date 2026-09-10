"use client";
import { useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "./WorkspaceProvider";
import { instruments, money } from "@/lib/market-catalog";
import { toast } from "sonner";
import { normaliseSymbol } from "@/lib/market-symbols";
export function AlertsView({ initialSymbol }: { initialSymbol?: string }) {
  const { alerts, stocks, saveAlert, removeAlert } = useWorkspace();
  const requestedSymbol = normaliseSymbol(initialSymbol);
  const [open, setOpen] = useState(Boolean(requestedSymbol));
  const [symbol, setSymbol] = useState(requestedSymbol || "AAPL");
  const options = [
    ...new Map([
      ...instruments.map((item) => [item.symbol, item.name] as const),
      ...stocks.map((item) => [item.symbol, item.company] as const),
      ...(!instruments.some((item) => item.symbol === symbol) &&
      !stocks.some((item) => item.symbol === symbol)
        ? [[symbol, symbol] as const]
        : []),
    ]),
  ];
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(target);
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
      setError("Enter a target between $0.01 and $1,000,000.");
      return;
    }
    if (
      alerts.some(
        (item) =>
          !item.triggeredAt &&
          item.symbol === symbol &&
          item.direction === direction &&
          item.target === price,
      )
    ) {
      setError("You already have an active alert for this target.");
      return;
    }
    if (
      saveAlert({ id: crypto.randomUUID(), symbol, direction, target: price })
    ) {
      toast.success("Browser price alert created");
      setOpen(false);
      setTarget("");
      setError("");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Less watching. More intention.</span>
          <h1>Set your point of interest.</h1>
          <p>Simple price alerts for the companies you follow.</p>
        </div>
        <button className="button primary" onClick={() => setOpen(true)}>
          <Plus size={14} aria-hidden="true" />
          Create price alert
        </button>
      </div>
      <div className="notice">
        Alerts are stored on this browser and checked about once a minute while
        Stillmark is open and visible. They only use provider quotes less than
        five minutes old. Demo data never triggers alerts. No email, push
        notifications, or background delivery.
      </div>
      <section className="panel">
        {alerts.length ? (
          <>
            <div className="panel-heading">
              <h2>Your price alerts</h2>
              <span className="status-pill">
                {alerts.filter((item) => !item.triggeredAt).length} active
              </span>
            </div>
            {alerts.map((alert) => (
              <article key={alert.id} className="alert-row">
                <span className="stock-icon">
                  <Bell size={17} aria-hidden="true" />
                </span>
                <div className="alert-info">
                  <h3>
                    {alert.symbol} at or {alert.direction} {money(alert.target)}
                  </h3>
                  <p>
                    {alert.triggeredAt
                      ? "Triggered " +
                        new Date(alert.triggeredAt).toLocaleString()
                      : "Waiting for a fresh quote matching your target"}
                  </p>
                </div>
                <span className="status-pill">
                  {alert.triggeredAt ? "Triggered" : "Active"}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Delete ${alert.symbol} alert at ${money(alert.target)}`}
                  onClick={() => {
                    if (removeAlert(alert.id)) toast.success("Alert removed");
                  }}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </article>
            ))}
          </>
        ) : (
          <div className="empty-state">
            <Bell size={32} strokeWidth={1.2} aria-hidden="true" />
            <h2>Know what you’re waiting for.</h2>
            <p>
              Choose a company and a price. We’ll show an in-app message when a
              fresh quote meets your target while this workspace is open.
            </p>
            <button className="button" onClick={() => setOpen(true)}>
              Create your first alert
            </button>
          </div>
        )}
      </section>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setError("");
        }}
      >
        <DialogContent>
          <DialogTitle>Create a price alert</DialogTitle>
          <DialogDescription>
            A browser-only alert. Quotes may be delayed; this is not an order or
            a guarantee of execution.
          </DialogDescription>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="alert-stock">Company</label>
              <select
                id="alert-stock"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              >
                {options.map(([ticker, name]) => (
                  <option key={ticker} value={ticker}>
                    {name} ({ticker})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="alert-direction">
                Notify me when the price is
              </label>
              <select
                id="alert-direction"
                value={direction}
                onChange={(event) =>
                  setDirection(event.target.value as "above" | "below")
                }
              >
                <option value="above">At or above</option>
                <option value="below">At or below</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="alert-target">Target price (USD)</label>
              <input
                id="alert-target"
                type="number"
                inputMode="decimal"
                min="0.01"
                max="1000000"
                step="0.01"
                required
                placeholder="250.00"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "alert-error" : undefined}
              />
            </div>
            {error && (
              <p className="form-error" id="alert-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" type="submit">
              Save browser alert
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
