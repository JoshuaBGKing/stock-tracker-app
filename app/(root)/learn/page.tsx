import type { Metadata } from "next";
export const metadata: Metadata = { title: "Field guide" };
const chapters = [
  {
    number: "01",
    title: "Start with the business.",
    text: "A ticker is a shortcut to a company, not a complete picture. Explore what the company sells, how it earns revenue, and the risks it discloses. Company filings provide context that a price chart cannot.",
    url: "https://www.sec.gov/edgar/search/",
    link: "Find company filings at the SEC",
  },
  {
    number: "02",
    title: "Read a quote with context.",
    text: "A quote is a price observation at a particular moment. Open, high, low, and previous close refer to a trading session. Check the timestamp, currency, source, and exchange before relying on a number.",
    url: "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks",
    link: "Explore stock basics at Investor.gov",
  },
  {
    number: "03",
    title: "Make a watchlist, not a prediction.",
    text: "A watchlist keeps your research in one place. Saving a company or setting a price alert does not mean it is a suitable investment. Stillmark does not know your financial circumstances and does not recommend trades.",
    url: "https://www.investor.gov/introduction-investing/investing-basics",
    link: "Read investing basics at Investor.gov",
  },
  {
    number: "04",
    title: "Leave room for uncertainty.",
    text: "Market prices can fall as well as rise. Concentrating on one company or sector can expose you to risks that are hard to see in a single chart. Consider risk, time horizon, fees, and diversification when researching investments.",
    url: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
    link: "Learn about diversification at Investor.gov",
  },
];
export default function LearnPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">The Stillmark field guide</span>
          <h1>
            A little knowledge.
            <br />A wider perspective.
          </h1>
          <p>
            Four starting points for more considered research. Educational
            information, not personal financial advice.
          </p>
        </div>
      </div>
      <div className="news-grid">
        {chapters.map((chapter) => (
          <article className="panel education-card" key={chapter.number}>
            <p className="chapter-number">{chapter.number}</p>
            <h2>{chapter.title}</h2>
            <p>{chapter.text}</p>
            <a
              href={chapter.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              {chapter.link} ↗ (new tab)
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
