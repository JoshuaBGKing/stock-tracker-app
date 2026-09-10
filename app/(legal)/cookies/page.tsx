import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
export const metadata: Metadata = { title: "Cookies policy" };
export default function CookiesPage() {
  return (
    <LegalDocument
      title="Small files. Clear choices."
      intro="How this workspace uses cookies and browser storage."
    >
      <section>
        <h2>1. What is used</h2>
        <p>
          Cookies and browser storage can remember requested features or allow
          third-party services to operate. Stillmark does not install site
          analytics, advertising pixels or session recording. Guest browsing
          does not require an account cookie.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Storage</th>
                <th scope="col">Purpose</th>
                <th scope="col">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  better-auth.session_token (with a secure prefix on HTTPS)
                </td>
                <td>
                  Essential signed-in session. HTTP-only, unavailable to client
                  JavaScript.
                </td>
                <td>Up to 7 days, renewed during use</td>
              </tr>
              <tr>
                <td>stillmark.watchlist.v1</td>
                <td>
                  Local storage for the guest watchlist you choose to save
                </td>
                <td>Until removed or browser storage is cleared</td>
              </tr>
              <tr>
                <td>
                  stillmark.alerts.v1 (optionally suffixed with account ID)
                </td>
                <td>Local storage for browser alerts you create</td>
                <td>Until removed or browser storage is cleared</td>
              </tr>
              <tr>
                <td>stillmark.preferences.v1</td>
                <td>
                  Remembers external-chart permission, policy version and choice
                  time
                </td>
                <td>
                  Choice honoured for up to 180 days, then charts default to off
                </td>
              </tr>
              <tr>
                <td>stillmark.appearance.v1</td>
                <td>
                  Local storage for your chosen light, dark or system
                  appearance. Contains only the theme name; does not enable
                  tracking or charts.
                </td>
                <td>Until changed or removed using browser storage controls</td>
              </tr>
              <tr>
                <td>stillmark.charts-off</td>
                <td>
                  First-party refusal-only cookie, used if the browser cannot
                  save or remove an old chart permission. Contains no identifier
                  and never enables charts.
                </td>
                <td>Up to 180 days, or until you successfully allow charts</td>
              </tr>
              <tr>
                <td>TradingView storage</td>
                <td>Optional third-party charts, only after permission</td>
                <td>
                  Controlled by TradingView; consult its policy and your browser
                  controls
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>2. When permission is requested</h2>
        <p>
          External charts are blocked before permission. The chart placeholder
          explains TradingView’s data access and offers a clear choice. You can
          also enable or disable charts in{" "}
          <Link href="/settings">Settings & privacy</Link>. Core browsing
          remains available if you leave them off.
        </p>
        <p>
          No sitewide “accept all” banner is necessary for the current feature
          design: nonessential charts use a contextual consent control, and
          there are no analytics or advertising trackers to enable. The operator
          must confirm the legal treatment of essential and user-requested
          storage for the countries served before launch. Adding tracking later
          requires a new assessment and appropriate controls before it runs.
        </p>
      </section>
      <section>
        <h2>3. Changing your mind</h2>
        <p>
          Turn TradingView charts off in Settings at any time. The application
          removes the embedded chart and reloads the page to stop scripts that
          were already loaded. We cannot erase cookies or storage on
          TradingView’s own domain; use your browser’s website-data controls to
          remove those. This also applies to storage set after you follow an
          external publisher link.
        </p>
        <p>
          Clearing the Stillmark preference from your browser returns charts to
          the blocked state. If saving a refusal fails, we try removing the old
          permission, then a refusal-only cookie. If all storage is blocked,
          charts stay off in the current tab using a charts=off address
          parameter. Keep that parameter when reloading or sharing the address.
          A warning explains that a new tab without it may still read the old
          permission; clear this site&apos;s stored permissions using your
          browser controls.
        </p>
      </section>
      <section>
        <h2>4. Provider information</h2>
        <p>
          Read{" "}
          <a
            href="https://www.tradingview.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            TradingView’s privacy policy (new tab)
          </a>{" "}
          for its storage practices. Cookie names and lifetimes can change; the
          operator must audit the production deployment and enabled widgets
          before launch and after provider changes.
        </p>
      </section>
    </LegalDocument>
  );
}
