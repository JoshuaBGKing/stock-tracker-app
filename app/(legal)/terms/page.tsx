import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
export const metadata: Metadata = { title: "Terms & conditions" };
export default function TermsPage() {
  return (
    <LegalDocument
      title="A clear understanding."
      intro="The terms for using the Stillmark research workspace."
    >
      <section>
        <h2>1. About the service</h2>
        <p>
          Stillmark provides tools for following stock quotes, maintaining
          watchlists, reading linked market news and setting browser price
          alerts. It does not execute orders, hold assets, manage portfolios or
          connect to brokerage accounts. These terms describe the current
          preview; operator details and jurisdiction must be finalised before
          public launch.
        </p>
      </section>
      <section>
        <h2>2. Eligibility and accounts</h2>
        <p>
          When registration is available, you must be an adult able to enter
          into this agreement under applicable law, provide an email address you
          control, verify that address and protect your login credentials.
          Display names are optional. You are responsible for activity you
          authorise through your account. Contact the operator if you suspect
          unauthorised access.
        </p>
        <p>
          Creating an account requires explicit acceptance of these terms. It
          does not subscribe you to marketing. Our{" "}
          <Link href="/privacy">Privacy policy</Link> explains the use of
          account information.
        </p>
      </section>
      <section>
        <h2>3. Information, not advice</h2>
        <p>
          Content is general information for research and education. It is not
          personalised investment, tax, accounting or legal advice, and does not
          recommend buying, selling or holding a security. You are responsible
          for your decisions and for verifying information with original sources
          or an appropriately qualified adviser.
        </p>
        <p>
          Investments can lose value. Past performance and an upward chart do
          not guarantee future results. Stillmark makes no claims about
          improving returns, predicting prices or identifying profitable trades.
        </p>
        <p>
          Optional AI research is generated from a limited set of quote and
          headline inputs. It may contain mistakes, omissions or unsupported
          interpretations. Check the original sources; the supplied headlines
          are inputs, not proof that the generated explanation is correct. AI
          research is not personalised advice.
        </p>
      </section>
      <section>
        <h2>4. Market data and alerts</h2>
        <p>
          Quotes can be delayed, incomplete, stale or unavailable. Check the
          source and timestamp. Data marked “demo,” “sample,” or “illustrative”
          is invented for product demonstration and must never be used for a
          financial decision. Provider charts are separately sourced and may
          differ from the native overview.
        </p>
        <p>
          Alerts are checked about once per minute only while this workspace is
          open and visible, using available provider quotes less than five
          minutes old. They do not run when the site is closed and are not sent
          by email or push notification. Network failures, browser restrictions
          or data delays can prevent delivery. An alert is not an order, stop
          loss or guaranteed notification.
        </p>
        <p>
          Optional news briefs are separate from price alerts. They require a
          verified email and an explicit subscription, can be stopped through
          Settings or an unsubscribe link, and depend on the configured worker
          and mail provider. Scheduled delivery is off unless the operator
          enables it. No guaranteed delivery time or exactly-once SMTP delivery
          is promised.
        </p>
      </section>
      <section>
        <h2>5. Acceptable use</h2>
        <p>
          Do not attempt to access another person’s account, bypass security or
          rate limits, disrupt the service, distribute malicious code or use
          data in violation of applicable law or the provider’s terms. Access
          may be restricted where necessary to protect the service or others.
        </p>
      </section>
      <section>
        <h2>6. Intellectual property and third parties</h2>
        <p>
          The Stillmark mark and interface artwork were created for this
          project. Third-party libraries retain their own licences. Company
          names and tickers identify the securities discussed and do not imply
          endorsement. Market data, news headlines and TradingView content
          remain subject to the rights and terms of their providers.
        </p>
        <p>
          External websites operate independently. Opening a publisher link or
          allowing a chart can take you to content governed by that provider’s
          terms and privacy policy. Permission to use the application does not
          grant a licence to redistribute third-party financial data.
        </p>
      </section>
      <section>
        <h2>7. Availability and responsibility</h2>
        <p>
          The preview is provided without a service-level commitment. Features
          or data sources may change, and access may be interrupted. Keep an
          export of information you wish to preserve. To the extent permitted by
          applicable law, no guarantee of continuous availability or complete
          accuracy is made. Nothing in these terms excludes liability or
          consumer rights that cannot lawfully be excluded.
        </p>
        <p>
          Any jurisdiction-specific liability provisions and dispute procedures
          must be reviewed for the operator and intended users before launch;
          this preview does not invent a governing law or arbitration
          requirement.
        </p>
      </section>
      <section>
        <h2>8. Leaving the service and changes</h2>
        <p>
          You can stop using the guest workspace and clear its browser data at
          any time. Account holders can export data and request deletion through
          Settings. If the terms materially change, the operator should
          communicate the change and obtain any renewed acceptance required by
          law.
        </p>
      </section>
    </LegalDocument>
  );
}
