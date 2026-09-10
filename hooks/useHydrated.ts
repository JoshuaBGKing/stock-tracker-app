"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// SSR can paint controls before their handlers exist. Do not accept interactions
// until hydration finishes, including under slow or cold-loaded client bundles.
export function useHydrated() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
