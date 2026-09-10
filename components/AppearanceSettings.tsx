"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/hooks/useHydrated";
import { APPEARANCE_KEY, type Appearance } from "@/lib/appearance";

const choices = [
  {
    value: "light",
    label: "Light",
    description: "A bright, open workspace",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "A softer view after hours",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your device settings",
    icon: Monitor,
  },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const [storageFailed, setStorageFailed] = useState(false);
  // Keep the server and first client render identical; controls become ready
  // when browser preferences are available. The provider applies colors early.
  const selected = hydrated ? theme || "system" : "system";
  function choose(value: Appearance) {
    setTheme(value);
    try {
      // next-themes deliberately tolerates storage failures. Explain when this
      // change is only temporary instead of promising that it was remembered.
      setStorageFailed(localStorage.getItem(APPEARANCE_KEY) !== value);
    } catch {
      setStorageFailed(true);
    }
  }
  return (
    <section
      className="panel settings-section appearance-panel"
      aria-labelledby="appearance-heading"
    >
      <h2 id="appearance-heading">Appearance</h2>
      <p id="appearance-description">
        Find your comfortable view. This choice stays in this browser and does
        not enable external charts or tracking.
      </p>
      <fieldset disabled={!hydrated} aria-describedby="appearance-description">
        <legend className="sr-only">Color theme</legend>
        <div className="appearance-options">
          {choices.map(({ value, label, description, icon: Icon }) => (
            <label className="appearance-option" key={value}>
              <input
                type="radio"
                name="appearance"
                value={value}
                checked={selected === value}
                onChange={() => choose(value)}
                aria-labelledby={`appearance-${value}-label`}
                aria-describedby={`appearance-${value}-description`}
              />
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
              <span className="appearance-option-copy">
                <strong id={`appearance-${value}-label`}>{label}</strong>
                <small id={`appearance-${value}-description`}>
                  {description}
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {storageFailed && (
        <p className="notice mt-4" role="status">
          Your appearance changed for this tab, but your browser could not save
          it.
        </p>
      )}
    </section>
  );
}
