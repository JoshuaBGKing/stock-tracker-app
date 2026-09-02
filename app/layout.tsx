import type { Metadata } from "next";
import type { ReactNode } from "react";
import {Toaster} from "@/components/ui/sonner"
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Signalist",
  description: "Track real-time stock prices, get personalized alerts and explore detailed company insights.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: ReactNode;
}>) {
  return (
      <html
          lang="en"
          className={cn(
              "dark",
              "h-full",
              "antialiased",
              "font-sans",
              geistSans.variable,
              geistMono.variable,
              inter.variable
          )}
      >
      <body className="min-h-full flex flex-col">
      {children}
      <Toaster/>
      </body>
      </html>
  );
}