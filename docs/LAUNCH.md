# Before public launch

The application is implemented and locally testable. Public deployment still needs decisions and checks outside the repository.

1. Finalise the operator’s legal identity, country, postal address, public privacy email and launch audience. The policy pages are visibly marked as previews until these are supplied.
2. Have the policies reviewed for the actual jurisdiction, users and service. Complete hosting/database/email provider identities, regions, lawful bases, transfer safeguards, log/backup retention and rights-request procedures.
3. Clear the Stillmark name and logo for the relevant territories and acquire a domain. The working brand is not a trademark clearance.
4. Confirm Finnhub commercial display and redistribution rights, exchange entitlements, quota and the TradingView widget terms. Do not market the product as guaranteed real-time.
5. The disposable local account/SMTP integration tests are now available with `npm.cmd run dev:test` and `npm.cmd run test:accounts`; see [TESTING.md](TESTING.md). Repeat the account, authorization, recovery and deletion checks against the chosen isolated staging deployment and real mail provider. Confirm email links use the intended HTTPS origin. Existing unverified tutorial accounts will need email verification.
6. Configure HTTPS, a strong Better Auth secret, restricted MongoDB access and production mail delivery. Configure SPF/DKIM/DMARC for the chosen sender. Rotate any key that was ever published, including a formerly client-exposed Finnhub key.
7. Run `npm run check:launch`, lint, typecheck, unit tests, browser tests and a production build. Browser tests require installed Edge (or adjust the channel).
8. Verify the real deployment’s cookies/network requests before consent, after consent and after withdrawal. Check that the hosting service has not added analytics. Re-test after vendor or platform changes.
9. Complete keyboard, screen-reader, zoom, mobile, reduced-motion and cross-browser tests. Inspect enabled TradingView content and provide support for accessibility issues.
10. Set abuse controls at the hosting edge for public quote/search and auth endpoints. Auth Server Actions now have database-backed aggregate, per-action and hashed-subject throttling, plus shared account-mail budgets. These site-wide circuit breakers can temporarily affect legitimate users under attack; they are not DDoS protection. Leave `AUTH_TRUSTED_IP_HEADER` blank unless ingress overwrites it with one IP and direct origin access is blocked. Tune limits for expected traffic and monitor denial rates without logging credentials. The current CSP is a minimal hardening policy, not a complete script-source allowlist.
11. Establish error monitoring without logging secrets or unnecessary user data, backup/restore testing and an incident-response process. This repository intentionally does not install a tracking vendor.
12. Explicitly enable `ENABLE_REGISTRATION=true` only after completing the above. Rebuild with final environment settings. Remove preview wording when the underlying information is final, and deliberately update the current noindex metadata when the site is ready to be indexed.

## Feature limits to preserve in product copy

- This is a research workspace, not a brokerage.
- Native historical-looking charts exist only in clearly labelled sample mode. Market mode uses actual provider OHLC/current ranges; optional TradingView supplies interactive history.
- Browser alerts require the app to be open and visible. No background, email or push guarantee.
- Alerts support valid selected tickers outside the overview catalogue. Watchlist quotes refresh for the visible ten-stock page; provider coverage, quota and unavailable values still apply. Sorting applies to the current page.
- Prices and alert targets support USD listings only. Custom listings require a matching provider profile with explicit USD currency; unsupported or unverified currencies remain unavailable. A selected live quote is labelled independently of an overview outage.
- The 100-stock account watchlist cap currently uses a count-then-insert check. Different clients adding different symbols simultaneously near capacity can exceed it; strict distributed quota enforcement remains a storage-layer hardening task.
- No portfolio valuation is fabricated: a watchlist does not know share quantities, costs or account balances.
- Optional research notes send only public market fields to Gemini after per-request permission; they are not personalised advice. Optional news briefs require verified-account opt-in and support signed unsubscribe. Neither feature is automatically enabled in the normal/public app.
- Guest watchlists are not silently merged into an account. Browser alerts are local and account-scoped when signed in.
- Deleting active account data does not certify erasure from provider backups. Set and disclose retention periods.

## Existing deployment migration

For new live services, review Gemini's service tier/regions/age restrictions and Inngest/mail provider processing terms. Configure feature flags deliberately. Production news delivery requires both Inngest keys, operator information and HTTPS. The optional weekday schedule requires its own flag and Cloud registration. The original preview endpoint remains development-only; the real delivery endpoint is `/api/workflows`.

Local manual Inngest workflow previews can be tested with `npm.cmd run dev`, `npm.cmd run inngest:dev` and `npm.cmd run test:inngest`; see [INNGEST.md](INNGEST.md). They use synthetic data and return unsent messages. They do not enable live subscriptions, AI sharing, registration, background alerts or production invocation.

Disable any old scheduled Inngest functions in the Inngest dashboard; deploying the new handler does not itself prove a previously registered remote schedule has been removed. Audit any old production deployment for public keys, tutorial assets, active analytics and historical personal-profile events. The new code sends no such events, but cannot erase past vendor records. Review whether previously collected country/risk/profile data exists in vendor event history and set an appropriate deletion/retention process.

## Assets

Tutorial screenshots and promotional graphics were archived outside the served directory for recovery. Do not publish that archive or claim rights to it without checking the original licence.
