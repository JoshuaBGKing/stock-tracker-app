# Verification — 7–9 September 2026

## TradingView chart sizing — 9 September 2026

- Fixed the 150px iframe inside the 500px chart panel. TradingView rewrites its own container height to `100%`, so the configured height now lives on a separate outer wrapper. The provider container and chart fill its content area. Loading/error messages remain readable within the panel rather than being clipped below it.
- Read-only live TradingView check passed in fresh Edge contexts: actual AAPL chart canvas and populated price data appeared in light and dark mode. At both 1440px and 390px viewport widths, the iframe measured **498px inside the 500px bordered panel**, filled the panel width and caused no horizontal page overflow. No provider requests occurred before chart consent; no browser exceptions were observed.
- Added five repeatable browser regression cases covering desktop/mobile sizing, light/dark mode, resize, theme remounts and a blocked-provider fallback. The fixture reproduces the provider's container-style rewrite; routine tests do not fetch TradingView data.
- Final Playwright/Edge regression: **39/39 passed**, including the five new sizing/fallback cases and the existing consent, appearance, storage, navigation and accessibility checks.
- The opt-in live smoke check is `node scripts/check-widget.mjs` with the application running on port 3000 (or set `WIDGET_CHECK_ORIGIN`). It uses fresh test contexts, grants chart consent and contacts TradingView with the test browser IP/browser information and AAPL symbol. It checks populated data as well as iframe sizing, not merely iframe presence.
- TypeScript, ESLint and the production build passed; the rebuilt local application is running on port 3000. Chart consent, attribution and account data were not changed.

## Appearance setting — 9 September 2026

- Added Settings > Appearance with Light, Dark and System options. System is the default; an explicit choice is stored only in `stillmark.appearance.v1` in the browser and synchronizes across same-origin tabs. Blocked storage changes the current tab's theme and displays a persistence warning.
- Theme support covers the workspace, account/legal pages, menus, forms, native charts and notifications. Already-consented TradingView widgets follow the resolved theme; appearance never grants chart consent. The storage inventory and privacy notice include the new theme-only preference.
- Full Playwright/Edge regression: **34/34 passed**, including nine new appearance checks for persistence, reload/navigation, cross-tab sync, keyboard controls, OS changes, storage failure, consented widget configuration, and dark/mobile accessibility on five routes. A separate desktop Settings axe check found zero violations.
- TypeScript and ESLint passed. Dark-mode screenshots are in `.artifacts/stillmark-dark-settings.png`, `.artifacts/stillmark-dark-settings-mobile.png` and `.artifacts/stillmark-dark-desktop.png` (local, not committed).
- Production build passed and the local app was restarted on port 3000. Production dark-mode Settings returned HTTP 200, retained the saved choice after reload, and had zero browser exceptions or desktop axe violations. Fixed navigation remained at viewport top. All 24 client bundles passed the configured-secret scan.

## Correctness follow-up — 9 September 2026

- Updated Next.js to 16.3.4, Nodemailer to 10.0.1 and affected transitive packages. The current npm audit reports zero known vulnerabilities. Earlier point-in-time audit statements below are historical: the later advisories included the formerly accepted CLI ZIP dependency.
- Replaced the npm Inngest CLI installer with the official 1.44.0 binary, pinned archive SHA-256 verification, native single-executable extraction and a verified local cache. Fresh download and cached `--version` checks passed on Windows x64; other platforms are not runtime-verified here.
- Unit tests: 33 passed, including aggregate/subject/mail auth limits, ignored untrusted forwarding headers, atomic-counter contract, USD profile validation, malformed quote rejection and selected quotes/AI independent of an overview outage.
- Isolated account integration passed with the revised code: verification/sign-in, overlapping watchlist saves/removals, duplicate-control coalescing, two-account isolation and exports, permission-controlled research fixture, local Inngest-to-SMTP briefs, duplicate guard and signed unsubscribe, recovery/session revocation, and password-confirmed account deletion. Cancelling deletion by button, Escape, close or outside click clears both confirmation fields.
- A five-second account-navigation assertion was too short for lazily compiled development routes. With a 30-second assertion budget, the unchanged successful-sign-in flow sets its session cookie and completes navigation. No authentication fix was needed for that timeout.
- Browser regression revealed missing dynamic routes in the existing development cache. After stopping its owned server, that generated `.next/dev` cache was moved to `.artifacts/next-dev-route-recheck-20260909` for recovery; a fresh start includes both stock and auth routes. Source files and account data were not removed. Route/accessibility tests now assert HTTP 200 and reject the not-found screen, rather than accepting any heading.
- Fixed the last-resort consent-withdrawal race: the `charts=off` URL marker is written before notifying React, so an immediate reload cannot resurrect an unerased grant. Failed writes first try removal, then a refusal-only cookie; the URL fallback explicitly warns about persistence limitations.
- Final Playwright/Edge suite: **25/25 passed**, including all three storage-failure consent cases, failed alert deletion/trigger persistence, partial browser-data clearing, accessible stock headings, route-aware accessibility assertions, keyboard controls and mobile layout. Widget scripts remain intercepted; this is not a repeat of the real vendor-widget audit.
- Final TypeScript and ESLint checks passed. Production build passed on Next.js 16.3.4, completing all 20 generated entries and retaining the dynamic stock/auth routes.
- Actual MongoDB concurrency probe: 100 simultaneous limiter operations with a cap of seven accepted exactly seven and persisted one counter with count seven. This used a separate disposable loopback database, then stopped it.
- Production client-secret scan: 23 JavaScript bundles checked; none contained configured secret values.
- Production browser smoke: HTTP 200, no browser exceptions, no horizontal overflow at 390px, zero automated overview accessibility violations, and expected security headers.
- Read-only live provider check: IBM and COST both returned available Finnhub quotes labelled `source: provider` and `currency: USD`. Ten production page routes returned HTTP 200. Both disabled workflow execution endpoints rejected POST with 403.
- Local service health: normal app on 3000, isolated account app on 3001, test inbox on 8025 and Inngest dashboard on 8288 all returned HTTP 200 after verification. These services are local previews, not a public deployment.

The existing `.env`, existing account database and external email recipients remain untouched. Isolated accounts/inbox are temporary and are discarded when their launcher stops. The strict 100-stock quota race across separate clients remains documented in [LAUNCH.md](LAUNCH.md); these successful checks do not establish that every possible concurrency case or production condition is covered. Legal/operator information, provider entitlements, real-provider delivery, deployment security and manual accessibility review remain launch requirements.

## Completed locally

- Production build: passed with Next.js 16.3.2. All 19 generated pages/routes completed.
- TypeScript: passed.
- ESLint: passed with no errors or warnings.
- Alert-rule tests: 5 passed. Covers sample data, fresh/stale/future quotes, inclusive targets and already-triggered alerts.
- Playwright/Edge suite: 16 passed. Covers guest watchlist persistence/removal, keyboard search, chart consent/persistence/withdrawal, invalid/expired storage, browser alert create/delete, downloads, clear-data cancellation, public policies, gated signup, mobile navigation and automated accessibility on six routes.
- Browser console: no errors on the corrected dashboard.
- Production browser smoke: HTTP 200, no browser exceptions, no horizontal overflow at 390px, zero axe violations on the tested overview, and expected security headers.
- Client-secret scan: 24 production JavaScript bundles checked; none contained the configured auth, database, Finnhub, mail or Gemini secret values. Only variable names and counts are reported.
- Finnhub read-only integration: HTTP 200 and a valid quote. The running app returned market mode with 10 of 10 overview quotes available.
- Real TradingView integration: no TradingView request before consent; after consent, an actual chart canvas rendered. Observed provider hosts included s3.tradingview.com, www.tradingview-widget.com, scanner-backend.tradingview.com and www.tradingview.com.
- npm installation audit reported zero known vulnerabilities at installation time.

The sandbox blocks outbound network traffic. Live-provider checks and the local production preview were run with approved network access. The routine browser suite uses sample data and intercepts widget scripts for repeatability.

## Local Inngest follow-up — 7 September 2026

- Installed the pinned Inngest CLI 1.44.0. Its ZIP dependency is overridden to patched adm-zip 0.6.0; the installation audit reports zero known vulnerabilities.
- Re-ran TypeScript, ESLint and the production build successfully.
- Unit tests: 11 passed (the original 5 alert tests plus 6 workflow preview/validation/production-guard tests).
- Local Inngest registration: both preview functions discovered in dev mode.
- `npm.cmd run test:inngest`: both manual events completed through actual Inngest durable steps; each output had `mode: "local-preview"`, `delivered: false` and a rendered message. No live email, AI request or account lookup occurred.
- Built production handler checked with `ENABLE_INNGEST_DEV=true`: GET remained disabled; POST and PUT both returned 403.
- Development handler rejected cross-origin browser GET, POST and PUT requests with 403, and normal diagnostic responses used `Cache-Control: no-store`.
- These tests validate local workflow orchestration and fixture rendering only, not live SMTP, live news summarisation, AI inference or subscriptions. The earlier browser/UI checks above were not rerun as a full suite for this backend-only follow-up.

See [INNGEST.md](INNGEST.md) to run the tests again.

## Accounts, delivery and research follow-up — 8 September 2026

- Production build: passed on Next.js 16.3.2, including the new research, workflow and unsubscribe routes. TypeScript and ESLint passed.
- Unit tests: 16 passed, including strict test-environment isolation, fail-closed misconfiguration, bounded research-output validation, selected-symbol validation and custom-stock alerts.
- Full Playwright/Edge regression: all 19 tests passed. Includes seven automated accessibility scans, consent withdrawal, keyboard navigation, guest data controls and mobile layout.
- Fixed custom-stock coverage: direct alert links retain their ticker instead of falling back to AAPL. Active alerts request only their symbols, in batches of at most ten. Watchlists request the current ten-stock page and retain saved company names. Browser tests verify custom-symbol triggering, no repeat after reload, pagination and bounded/invalid API requests using explicitly intercepted test quotes.
- Live selected-symbol check on the rebuilt application: `/api/market?symbols=IBM,COST` returned HTTP 200 in market mode with both provider quotes available. Their formatted prices rendered in the watchlist, with no browser exceptions or 390px overflow. The complete isolated account/email suite and production browser smoke were repeated successfully after these changes.
- Real isolated account integration passed: signup, SMTP verification, unverified-login rejection, two independent account watchlists/exports, password recovery, revoked old sessions, wrong-password deletion rejection and successful deletion. Only synthetic `@example.test` accounts in the launcher's disposable MongoDB were used.
- Optional brief integration passed through actual local Inngest execution and SMTP delivery: separate opt-in, one-per-UTC-day duplicate protection, signed confirmation-page unsubscribe and one-click POST unsubscribe. GET did not change consent; tampered signatures and older consent-version links did not affect the current subscription; oversized POST bodies returned 413.
- Authenticated research-interface test passed, including per-request permission, the clearly labelled local fixture and clearing the result when permission is withdrawn. This test deliberately makes no AI-provider request.
- Separate approved Gemini smoke check: `gemini-3.1-flash-lite` returned HTTP 200 with valid structured output for a short, non-personal diagnostic prompt. The initially attempted `gemini-2.5-flash` returned 404 for this key, so the configurable default was updated. This does not establish live market-analysis accuracy or the complete live account-to-model flow.
- Production workflow guards passed with synthetic, process-local configuration: unsigned execution POST and unsigned in-band sync PUT returned 401. The old preview endpoint still returned 403 for POST/PUT even with its development flag set. With normal delivery disabled, `/api/workflows` returned `{ "enabled": false }` and rejected POST/PUT with 403. No Cloud deployment or email job was submitted by these guard checks.
- Production browser smoke repeated: HTTP 200, zero browser exceptions, no 390px overflow, zero automated overview accessibility violations and expected security headers.
- Final client-secret check: 23 production JavaScript bundles scanned; none contained the configured secret values. The scanner now also covers SMTP and Inngest secrets when configured.
- Final npm audit: zero reported vulnerabilities. This is a point-in-time dependency check, not a security certification.
- Disabled development argument/URL logging to prevent future password/token output. Added hydration readiness so visible workspace controls do not accept input before their event handlers exist.
- Windows UI runner now owns and cleans up only its spawned test-server tree, avoiding shell-child teardown hangs. The sandbox required approved process-management access for cleanup; `.cmd` scripts do not require relaxing PowerShell execution policy.

The existing `.env` and account database were not changed. Verification, recovery and requested brief messages were delivered only to the local SMTP sink, never to an external recipient. No public registration, automatic Cloud schedule or live AI feature was enabled in the normal application.

See [TESTING.md](TESTING.md) for the repeatable local account/inbox workflow.

## Screenshots

Local generated previews (excluded from Git):

- `.artifacts/stillmark-desktop.png`
- `.artifacts/stillmark-mobile.png`
- `.artifacts/stillmark-production-desktop.png`

These display explicitly labelled illustrative sample data.

`.artifacts/stillmark-custom-watchlist.png` separately captures actual provider quotes for IBM and COST from the selected-symbol smoke check. These are a point-in-time provider response, not a guarantee of current prices.

## Not represented as complete

Public legal clearance, trademark/domain clearance, data redistribution rights, deployment platform/cookie inventory, real-provider inbox deliverability, a repeat of account/security checks on the chosen isolated staging deployment, Inngest Cloud scheduling, the full live AI flow, provider backup deletion, screen-reader testing and full accessibility certification are still outstanding.

No real user account was created, deleted or modified by these checks. Local verification, password-reset and requested-brief messages used a non-relaying SMTP sink only. No public deployment was performed.

See [LAUNCH.md](LAUNCH.md) for the remaining launch requirements and [AUDIT.md](AUDIT.md) for the implementation/privacy assessment.
