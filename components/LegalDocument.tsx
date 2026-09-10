import Brand from "./Brand";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { legal, legalReady } from "@/lib/legal";
import { policyVersion } from "@/lib/brand";
export function LegalDocument({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-layout">
      <header className="legal-header">
        <Brand />
        <Link href="/" className="text-link">
          <ArrowLeft size={13} aria-hidden="true" />
          Back to workspace
        </Link>
      </header>
      <main id="main-content">
        <div className="legal-title">
          <span className="eyebrow">A more considered workspace</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <p className="text-xs!">Last updated {policyVersion}</p>
        </div>
        <div className="legal-body">
          <nav className="legal-nav" aria-label="Legal pages">
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms & conditions</Link>
            <Link href="/cookies">Cookies policy</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/settings">Privacy choices ↗</Link>
          </nav>
          <article className="prose">
            {!legalReady && (
              <div className="notice">
                <strong>Preview policy — operator details pending.</strong>
                <br />
                Stillmark is in development. The legal operator, country, postal
                address and privacy contact have not yet been published. New
                account registration is disabled. These pages must be finalised
                for the operator and intended audience before public launch.
              </div>
            )}
            {children}
            <section>
              <h2>Contact & requests</h2>
              {legalReady ? (
                <p>
                  {legal.operator}
                  <br />
                  {legal.address}
                  <br />
                  {legal.country}
                  <br />
                  <a href={"mailto:" + legal.email}>{legal.email}</a>
                </p>
              ) : (
                <p>
                  A public operator and privacy contact have not been
                  designated. No invented contact address is provided. During
                  development, contact the person who gave you access to this
                  preview. Browser data can be exported or cleared in{" "}
                  <Link href="/settings">Settings & privacy</Link>; existing
                  account holders can also export or delete their account there.
                </p>
              )}
            </section>
          </article>
        </div>
      </main>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Stillmark</span>
        <Link href="/">Back to the workspace</Link>
      </footer>
    </div>
  );
}
