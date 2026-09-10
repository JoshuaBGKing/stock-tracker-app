import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getNews } from "@/lib/actions/finnhub.actions";
export const metadata: Metadata = { title: "Market news" };
export default async function NewsPage() {
  const articles = await getNews();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Make space for the bigger picture</span>
          <h1>The reading room.</h1>
          <p>
            Headlines from Finnhub’s news feed. Read the full story with the
            original publisher.
          </p>
        </div>
        <Link href="/learn" className="button">
          Explore the field guide
        </Link>
      </div>
      {articles.length ? (
        <div className="news-grid">
          {articles.map((article) => (
            <article className="panel" key={article.id}>
              <a
                href={article.url}
                className="news-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="news-meta">
                  {article.source} ·{" "}
                  {new Date(article.datetime * 1000).toLocaleDateString(
                    "en-US",
                    { dateStyle: "medium", timeZone: "UTC" },
                  )}
                </span>
                <h2>{article.headline}</h2>
                <span className="external-label">
                  Read at {article.source} ↗ (opens new tab)
                </span>
              </a>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel empty-state">
          <BookOpen size={30} strokeWidth={1.3} aria-hidden="true" />
          <h2>The news feed is taking a pause.</h2>
          <p>
            The news provider is unavailable or not configured. In the meantime,
            take a look at our guide to reading the market.
          </p>
          <Link className="button primary" href="/learn">
            Open the field guide
          </Link>
        </section>
      )}
      <p className="data-disclosure">
        Headlines belong to their respective publishers. External links open in
        a new tab and are subject to the publisher’s privacy policy. We do not
        republish news photographs or full articles.
      </p>
    </>
  );
}
