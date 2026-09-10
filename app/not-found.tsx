import Link from "next/link";
import Brand from "@/components/Brand";
export default function NotFound() {
  return (
    <main id="main-content" className="legal-layout">
      <Brand />
      <section className="empty-state">
        <span className="eyebrow justify-center">404 · A small detour</span>
        <h1>Nothing on this horizon.</h1>
        <p className="mt-5">
          That page or stock couldn’t be found. Let’s get you back to a clearer
          view.
        </p>
        <Link href="/" className="button primary">
          Back to overview
        </Link>
      </section>
    </main>
  );
}
