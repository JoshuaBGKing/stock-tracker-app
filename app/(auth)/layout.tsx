import type { ReactNode } from "react";
import Link from "next/link";
import Brand from "@/components/Brand";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <section className="auth-left">
        <Brand />
        <main id="main-content" className="auth-form">
          {children}
        </main>
        <footer className="auth-footer">
          <Link href="/">Explore the workspace</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookies">Cookies</Link>
        </footer>
      </section>
      <aside className="auth-art" aria-label="About Stillmark">
        <span className="eyebrow">A little perspective</span>
        <h2>
          Your curiosity.
          <br />
          Your companies.
          <br />
          Your own pace.
        </h2>
        <p>
          A considered space to follow the market and build a watchlist that
          means something to you.
        </p>
        <div className="auth-sculpture" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>
    </div>
  );
}
