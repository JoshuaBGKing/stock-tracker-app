import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
export const metadata: Metadata = { title: "Privacy policy" };
export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Your space. Your privacy."
      intro="What Stillmark collects, why it is used, and the choices you have."
    >
      <section>
        <h2>1. The information this workspace uses</h2>
        <p>
          You can browse without an account. Guest watchlists and price alerts
          are saved in your browser only when you create them. The application
          does not upload these saved lists as a user profile. Requests to our
          server still include ordinary network information, such as your IP
          address, requested page and browser headers.
        </p>
        <p>
          When account registration is enabled, we ask for an email address, a
          password, an optional display name and acceptance of our terms.
          Authentication stores a password hash, account timestamps,
          verification status and session records. We do not ask for your
          address, country, income, investment goals, risk tolerance or
          brokerage credentials.
        </p>
        <p>
          Signed-in watchlists are stored in the application database under your
          account ID. The terms version and acceptance time are stored with your
          account. Account and security operations may create technical logs
          through the hosting or database provider.
        </p>
      </section>
      <section>
        <h2>2. How the information is used</h2>
        <p>
          Account details provide authentication, email verification, password
          recovery and watchlist synchronisation. Session cookies keep you
          signed in. Short-lived, keyed hashes of email addresses, recovery
          tokens and, only when explicitly configured behind a trusted ingress,
          IP addresses are used to limit authentication attempts and account
          email. The counters do not store those raw values. They are scheduled
          to expire within two hours, subject to the database’s TTL cleanup
          interval.
        </p>
        <p>
          Where applicable, necessary account processing is based on providing
          the service you request, and proportionate security processing on
          legitimate interests. Optional external charts are based on your
          consent. The operator must confirm the applicable legal bases and
          jurisdiction before launch. Agreeing to terms is not consent to
          marketing or tracking.
        </p>
      </section>
      <section>
        <h2>3. Services involved</h2>
        <ul>
          <li>
            <strong>Hosting and MongoDB:</strong> serve the application and, for
            accounts, store account and watchlist records. The operator must
            publish the selected providers, hosting regions, contractual
            safeguards and retention schedule before launch.
          </li>
          <li>
            <strong>Finnhub:</strong> receives stock symbols and search queries
            through our server to supply quotes and news. We do not send your
            account name or email with those requests. Queries are cached for a
            limited period.
          </li>
          <li>
            <strong>TradingView, only if allowed:</strong> receives network and
            browser details and viewed symbols when external charts load. It may
            use cookies or similar technologies under its own{" "}
            <a
              href="https://www.tradingview.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy (new tab)
            </a>
            . You can withdraw permission in Settings.
          </li>
          <li>
            <strong>Account email provider:</strong> the configured mail service
            receives your email address and verification or password-reset
            message when those services are requested. If you separately opt in,
            it also receives your requested news brief. Delivery uses the
            operator’s configured Gmail or SMTP provider through Nodemailer.
            These messages contain no tracking pixels or remote images.
          </li>
        </ul>
        <p>
          Advertising pixels, session replay and site analytics are not
          installed. We do not sell personal information or use it for targeted
          advertising. Following an external news link opens the publisher’s
          website, where its policies apply.
        </p>
        <p>
          <strong>Optional Google Gemini research:</strong> when enabled by the
          operator, a verified account holder can permit each request. Only the
          selected stock’s public quote, company name, symbol and recent
          headlines are sent from our server, not your account identity or
          watchlist. The result is displayed in this browser and is not saved to
          your account. Unchecking permission clears the displayed result but
          cannot undo earlier provider processing. Google handles requests under
          its{" "}
          <a
            href="https://ai.google.dev/gemini-api/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gemini API terms (new tab)
          </a>
          ; retention and model-improvement use depend on the operator’s service
          tier. The operator must confirm the appropriate plan, regions and
          provider agreement before enabling this feature for users.
        </p>
        <p>
          <strong>Optional news briefs and Inngest:</strong> subscribing in
          Settings records your choice, its time and notice version. Briefs link
          to publisher headlines; they do not upload your watchlist or use AI
          profiling. When background delivery is enabled, Inngest receives an
          opaque delivery-job ID and execution status. The daily scheduler also
          processes internal subscription and account IDs, not account email
          addresses, through its durable steps. The mail worker looks up the
          verified recipient on our server and rechecks the subscription before
          sending. Unsubscribe in Settings or through the signed link in any
          brief without signing in. An email already being delivered may still
          arrive. Account verification and recovery emails are separate.
        </p>
      </section>
      <section>
        <h2>4. Storage and retention</h2>
        <p>
          Guest watchlists and browser alerts remain until you remove them or
          clear browser storage. They are not automatically transferred into an
          account. Your chosen light, dark or system appearance is stored only
          in this browser until changed or removed. The external-chart
          preference expires after 180 days. Account sessions expire after seven
          days and can be renewed during use. Verification and recovery tokens
          expire according to the authentication service.
        </p>
        <p>
          Account data remains in the active database while the account exists.
          The delete-account control removes account records, credentials,
          sessions, the associated watchlist, news subscription and pending
          delivery records. Delivery-job records expire after 30 days;
          short-lived usage limits expire automatically. A withdrawn
          subscription remains recorded until account deletion to preserve its
          current off state and consent history. Some information can remain in
          provider logs and backups; the operator must establish and disclose
          their retention periods and deletion process before launch. No
          unsupported claim of instant deletion from backups is made.
        </p>
      </section>
      <section>
        <h2>5. Your choices and rights</h2>
        <p>
          <Link href="/settings">Settings & privacy</Link> lets you export your
          workspace, clear browser data and change external-chart consent.
          Signed-in users can export or delete their account after confirming
          their password. These controls do not clear storage set directly by
          third-party sites; your browser settings provide those controls.
        </p>
        <p>
          Depending on the laws that apply, you may also have rights to access,
          correct, delete or transfer personal information, restrict or object
          to processing, withdraw consent and complain to a supervisory
          authority. Withdrawing consent does not affect earlier lawful
          processing. We may need proportionate identity verification to handle
          a request.
        </p>
      </section>
      <section>
        <h2>6. Security, international processing and children</h2>
        <p>
          Account actions check the current session, and passwords are handled
          by the authentication library. No internet service can guarantee
          absolute security. The operator must assess international transfers,
          provider contracts, safeguards and incident procedures before
          production use.
        </p>
        <p>
          Accounts are intended for adults who can enter into the applicable
          agreement. The service is not designed to collect information from
          children. The operator must confirm appropriate age requirements for
          its launch regions.
        </p>
      </section>
      <section>
        <h2>7. Changes</h2>
        <p>
          Material changes to data use will be reflected here with an updated
          date. A new optional tracking purpose requires a new choice before it
          is enabled.
        </p>
      </section>
    </LegalDocument>
  );
}
