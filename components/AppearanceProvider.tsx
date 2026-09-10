"use client";

import { ThemeProvider } from "next-themes";
import { APPEARANCE_KEY } from "@/lib/appearance";

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      storageKey={APPEARANCE_KEY}
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
