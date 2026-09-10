import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { brand } from "@/lib/brand";
import { isIsolatedTestEnvironment } from "@/lib/test-mode";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Stillmark — A clearer view of the market",
    template: "%s · Stillmark",
  },
  description: brand.description,
  icons: { icon: "/icon.svg", apple: "/stillmark.svg" },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <AppearanceProvider>
          {isIsolatedTestEnvironment() && (
            <div className="test-mode-banner" role="status">
              Isolated test workspace · Use an @example.test email. Accounts
              reset when this server stops.{" "}
              <a
                href="http://127.0.0.1:8025"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open test inbox (new tab)
              </a>
            </div>
          )}
          <PreferencesProvider>
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            {children}
            <Toaster position="bottom-right" richColors />
          </PreferencesProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
