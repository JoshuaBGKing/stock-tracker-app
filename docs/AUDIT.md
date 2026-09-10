# Stillmark redesign audit

## Brand and design

Working brand: **Stillmark**. Original geometric mark in `app/icon.svg` and `public/stillmark.svg`; original CSS sculpture and editorial artwork. No Apple, Robinhood or TradingView branding is imitated. Apple’s guidance informed hierarchy, restraint, layout and accessibility; market tools informed the quote/table interactions.

Stillmark is a proposed name, not a cleared trademark or acquired domain. Do a relevant territory/class trademark and domain search before investing in a launch identity.

Design references: [Apple Design](https://developer.apple.com/design/), [Apple layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout), [TradingView widget documentation](https://www.tradingview.com/widget-docs/), [Robinhood](https://robinhood.com/us/en/).

## Findings addressed

| Original finding                                             | Implemented change                                                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Required country, investment goal, industry and risk fields  | Removed from signup and data submission; display name is optional                                                      |
| Unverified named testimonial and five-star rating            | Removed; replaced with original brand copy and CSS artwork                                                             |
| Immediate TradingView script loads                           | Contextual opt-in before any widget script mounts                                                                      |
| Automatic personalised signup workflow                       | No signup event sent; manual development-only preview uses no personal data                                            |
| Daily news sent to every account                             | Verified-account opt-in, signed unsubscribe and consent recheck; live delivery/schedule require explicit configuration |
| Public server helpers for arbitrary fetch/user email lookups | Internal fetch and user reads use server-only; arbitrary fetch and email-watchlist lookup removed                      |
| DB connection at module import                               | Lazy authentication; public guest pages work without a DB session                                                      |
| Provider errors logged with raw response content             | Generic, non-secret provider error messages                                                                            |
| Invalid effect state update in search                        | Debounced, query-keyed results with cancellation and derived loading state                                             |
| No consent or legal routes                                   | Public preview policies, contextual chart consent, separate server-validated terms acceptance                          |
| Unlabelled data freshness                                    | Provider timestamps, cached-quote disclosure and explicit demo mode                                                    |
| Tutorial graphics of unknown licence                         | Removed from the served asset set and kept in a local archive                                                          |
| External fonts                                               | Replaced with OS font stack; no Google Font requests                                                                   |
| Account failure returned raw auth response                   | Actions return status only, without tokens                                                                             |
| No account data controls                                     | Export and password-confirmed deletion, watchlist cleanup                                                              |
| Development DNS override                                     | Removed; app respects the machine's network settings                                                                   |

## Data map

| Data                                                          | Location / recipient                                            | Trigger                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| Guest watchlist                                               | localStorage                                                    | User saves a stock                          |
| Appearance (light/dark/system)                                 | localStorage, `stillmark.appearance.v1`; theme name only         | User chooses an appearance                  |
| Browser alerts                                                | localStorage; account ID suffix when signed in                  | User creates an alert                       |
| Chart permission/version/time                                 | localStorage, 180-day validity                                  | User chooses chart access                   |
| Session token                                                 | HTTP-only auth cookie, 7-day renewable lifetime                 | Successful sign-in                          |
| Account profile, hashed password, session, terms version/time | MongoDB through Better Auth                                     | Registration/sign-in                        |
| Authentication throttle key                                   | HMAC-only subject/IP/global counters in MongoDB; expiry within 2 hours plus TTL cleanup delay | Auth/recovery and account-mail attempts |
| Symbol/search text                                            | Finnhub via fixed-origin server fetch                           | Stock data/search request                   |
| Network headers                                               | Hosting platform; TradingView only after chart consent          | Requests                                    |
| Email + verification/reset link or requested brief            | Configured Gmail/SMTP provider                                  | Requested account service or opted-in brief |
| News subscription/version/time                                | MongoDB; included in account export/deletion                    | Explicit Settings opt-in or withdrawal      |
| Opaque delivery job ID and execution status                   | MongoDB (30-day expiry) and Inngest when enabled                | Requested or opted-in scheduled brief       |
| Internal subscriber/account IDs                               | Inngest durable scheduler step state when schedule enabled      | Explicitly enabled weekday schedule         |
| Public quote/headlines, without account identity              | Google Gemini when enabled; output shown but not account-saved  | Verified user's per-request permission      |
| AI/news request throttle key                                  | Keyed account hash + time bucket in MongoDB, short-lived TTL    | Limited authenticated feature use           |

Host-level logs, platform analytics, CDN cookies, regions, backups and transfer safeguards cannot be determined from repository code alone. Audit the actual deployment.

Next.js 16's default development logging includes Server Function arguments. It is now disabled, together with request-URL logging, to avoid future password and token logging. This does not remove historical terminal logs. Local integration checks use synthetic credentials only.

The isolated test launcher never uses the existing account database or real SMTP/Gemini credentials. It starts loopback MongoDB and SMTP, allows only `@example.test` recipients, and discards test data on shutdown. The normal application's public registration gate remains unchanged.

Optional provider reviews: [Gemini API data/service terms](https://ai.google.dev/gemini-api/terms), [Inngest privacy policy](https://www.inngest.com/privacy). Provider retention, service tier, regional eligibility, sender configuration and deployment controls remain launch requirements. See [TESTING.md](TESTING.md) and [INNGEST.md](INNGEST.md).

## Cookie and form consent assessment

No analytics or ad tracker is installed. Therefore no analytics consent UI is added. Strictly necessary session storage and user-requested workspace storage are distinguished from optional TradingView content. Optional content is blocked by default and has feature-level consent and a persistent settings control. Expired/corrupt preferences default to off. Withdrawal reloads the document so previously loaded scripts stop.

If a refusal cannot be written, the app first removes the old grant. If removal also fails, it uses the refusal-only `stillmark.charts-off` cookie (no identifier; up to 180 days). If neither mechanism works, a visible warning and `charts=off` URL marker keep charts off in that tab across navigation/reload. A new tab without the marker can still read an unerased old grant; the warning directs users to clear site permissions. Do not describe an unpersistable preference as successfully remembered.

Auth Server Actions apply database-backed aggregate and per-subject budgets independently of Better Auth's HTTP limiter, including reset-token attempts. Actual verification/recovery mail shares a separate bounded delivery budget. No IP header is trusted by default. `AUTH_TRUSTED_IP_HEADER` is appropriate only where ingress overwrites one validated IP and direct origin access is blocked. Counter IDs are keyed hashes; no raw email, token or IP is stored in these limiter rows. The site's request/session logs require separate review.

Terms acceptance is required only for account creation and is validated on the server. It is not bundled with marketing, AI profiling or external-chart permission. Essential account processing is explained in the privacy notice rather than misleadingly described as revocable marketing consent.

This is an implementation assessment, not a jurisdiction-independent legal opinion. The operator has not selected a country, business identity or audience. Review the local rules and vendor processing before launch. UK guidance changed in 2026; do not assume every form of analytics is treated identically across jurisdictions.

Primary references checked:

- [ICO storage/access technologies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/) (updated April 2026): exceptions, consent, feature-led choices and withdrawal.
- [ICO: when consent is appropriate](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/when-is-consent-appropriate/): account processing does not automatically require consent as its legal basis.
- [TradingView privacy policy](https://www.tradingview.com/privacy-policy/): external provider practices.

## Accessibility

Target: WCAG 2.2 AA, not a certification.

Implemented: semantic regions, skip link, one page-level heading, explicit field labels, autocomplete, password visibility toggle, signed changes and direction arrows, keyboard search, Escape/arrow/Enter dialog behavior, visible focus, reduced motion, reflow, screen-reader chart description and sample table alternative. Original artwork is decorative and hidden from assistive technology; the logo link has an accessible name.

[W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) informs the 4.5:1 normal-text target. Browser tests use axe for several key routes; manual keyboard and narrow-viewport behavior are checked separately. Third-party chart accessibility remains outside the application's direct control.

Before launch: test VoiceOver/NVDA, zoom/reflow, touch targets, actual enabled charts, error flows and multiple browsers with people who use assistive technology.

## Content and asset rights

No claims of profitable returns, predictive AI, guaranteed live data, real customer ratings, or user counts remain in the shipped UI. Illustrative fixtures are invented and explicitly identified. News headlines link to original sources; images and article bodies are not copied.

Original tutorial assets are retained outside `public` in `docs/legacy-assets` for recoverability, not approved for redistribution. Their ownership/licensing has not been established. Remove the archive from any redistributed source bundle unless appropriate permission is confirmed.

Lucide and other packages retain their bundled licences. Company names/tickers are nominative identifiers; no company logos or endorsements are invented. Market-data display/redistribution rights and the selected Finnhub plan must be confirmed separately. TradingView attribution remains visible.

## Verification limitations

The 9 September correctness pass fixed overlapping watchlist UI updates, duplicate-control saves, deletion-dialog secret retention, false success on failed alert storage, source/currency mislabelling and incomplete auth/mail throttling. Dependency updates and a checksum-pinned native CLI installer resolved the newly reported advisories. See [VERIFICATION.md](VERIFICATION.md) for the current test/build results and the remaining distributed watchlist-cap limitation.

The browser suite deliberately runs in sample mode and intercepts the consented chart script. This verifies gating without giving a third party test traffic or executing its code. It does not certify the third-party widget's availability, cookies or accessibility.

No test should create/delete real customer accounts, send external mail, or mutate an existing production database. Authentication delivery, recovery, account-scoped watchlists/exports, persistence, deletion and opt-in brief delivery have passed against the disposable local database and SMTP sink; see [VERIFICATION.md](VERIFICATION.md). Repeat the relevant checks on the chosen isolated staging deployment and real mail provider before registration is enabled.
