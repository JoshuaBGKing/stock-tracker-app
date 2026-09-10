# Stillmark

A calm, original stock-research workspace built with Next.js 16, React 19, Better Auth, MongoDB and Finnhub. The redesign uses an original Stillmark vector mark, system fonts, warm neutral surfaces and green accents.

## Run locally

Node 22 is supported. On Windows PowerShell use the `.cmd` npm executable if script execution is disabled.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000. The overview is public; a guest can save a watchlist and create browser alerts without an account. Copy [.env.example](.env.example) to a private `.env` only if you do not already have one. Existing credentials are not modified by the redesign.

Set `MARKET_DATA_MODE=sample` for a clearly labelled offline demo. Without it, the app uses a configured Finnhub key; the overview falls back to a labelled demo if all its quotes are unavailable. Selected-stock requests remain independent and never silently substitute sample prices for failed provider quotes. Supported prices and alert targets are USD only; custom listings need a matching provider profile confirming USD. `/?mode=sample` previews the sample overview. Market mode shows actual quote ranges and timestamps, never an invented historical line chart.

## What works

- Light, dark and system appearance in Settings, remembered only in this browser.
- Responsive overview, stock details, keyboard stock search and sortable/filterable tables.
- Guest watchlist in browser storage; authenticated watchlist in MongoDB.
- Local price alerts evaluated while the workspace is open and visible, using fresh provider quotes. No background, push or email alert delivery.
- Native sample charts with a data-table alternative; optional TradingView charts blocked until consent.
- Market headlines linked to original publishers, without republishing photographs or full articles.
- Privacy settings, JSON exports, browser-data removal, account export and password-confirmed account deletion.
- Account email verification, sign-in, password recovery and reset. Email-dependent flows need configured provider credentials.
- Public privacy, terms, cookies and accessibility pages.
- Optional, separately consented news briefs with Inngest delivery and signed unsubscribe links.
- Optional Gemini research notes using public quote/headline inputs, verified accounts and per-request permission. No account profile or watchlist is sent.
- No analytics, ads, session recording or automatic signup subscriptions.

## Test accounts and real email delivery safely

Run `npm.cmd run dev:test` to start a separate app at **http://127.0.0.1:3001** with a disposable local MongoDB and an SMTP inbox at **http://127.0.0.1:8025**. The first start may download MongoDB. Use an address such as `you@example.test` and a password of at least 12 characters. Open the test inbox to follow verification and reset links. No message is relayed to the internet, and your private `.env` and existing database are not changed.

Keep `npm.cmd run inngest:dev` running for background brief delivery, then run `npm.cmd run test:accounts`. This registers the isolated delivery worker and tests signup, verification, two-account isolation, exports, research consent, opt-in briefs delivered through actual SMTP, unsubscribe, password reset/session revocation and password-confirmed deletion. The test workspace can also be used manually; see [TESTING.md](docs/TESTING.md).

Test accounts and the inbox reset when the test server stops. AI uses an explicitly labelled fixture in this isolated environment; it does **not** silently fall back to your real Gemini key.

## Test background workflows locally

Two manual Inngest workflows are enabled with `npm.cmd run dev`: welcome email and daily news summary. They execute real durable steps but return **unsent previews using synthetic data**, not live emails or AI output. No database, mail credentials or Inngest Cloud account is required.

Keep these commands running in separate terminals:

```powershell
# Terminal 1 — stop an existing npm.cmd start instance on port 3000 first
npm.cmd run dev

# Terminal 2 — checksum-pinned official CLI; downloaded on first use
npm.cmd run inngest:dev

# Terminal 3 — send synthetic events and verify both jobs complete
npm.cmd run test:inngest
```

Open [the local Inngest dashboard](http://localhost:8288), select the `stillmark-local` app, and inspect the Runs tab for each step and the rendered message. You can also send the events shown in [the workflow testing guide](docs/INNGEST.md). The default commands bind to loopback; do not expose the unsigned dev servers through a tunnel or public network.

`ENABLE_INNGEST_DEV=false` disables the old preview route at `/api/inngest`. That route always rejects production invocations. The separate `/api/workflows` endpoint supports explicitly enabled, signed production news delivery; see [INNGEST.md](docs/INNGEST.md). Signup does not automatically subscribe an account.

## Configuration and launch

**This is not cleared for public launch.** Operator details have not been chosen. The policy pages identify their preview status. Registration on the normal app remains disabled; only the isolated local test environment bypasses that launch gate.

Before allowing new accounts, configure `LEGAL_OPERATOR_NAME`, `LEGAL_COUNTRY`, `LEGAL_POSTAL_ADDRESS`, `PRIVACY_CONTACT_EMAIL`, verified mail delivery, MongoDB and Better Auth, and explicitly set `ENABLE_REGISTRATION=true`. Registration is checked on both the server and the form. Rebuild after changing deployment configuration.

Use `FINNHUB_API_KEY`, never a new public-prefixed secret. The old `NEXT_PUBLIC_FINNHUB_API_KEY` is supported only by server code for migration. Rename it in your private environment and rotate it if an earlier deployment exposed it.

Run `npm.cmd run check:launch` for missing configuration names (values are never printed). Read [the launch checklist](docs/LAUNCH.md) and [the privacy/accessibility audit](docs/AUDIT.md) before deployment. No database migrations or real account/email tests are performed automatically.

## Verification

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd run build
```

Browser tests start a sample-data server on port 3100 and use installed Microsoft Edge through Playwright. They never register a real account or send email. Change the browser channel in `playwright.config.ts` if Edge is unavailable. Screenshots are saved to `.artifacts/`.

## Project structure

- `app/(root)`: overview, watchlist, alerts, stock details, news, field guide and settings
- `app/(auth)`: minimal account forms and recovery
- `app/(legal)`: public policy pages
- `lib/market.ts`: fixed-origin, server-only provider integration
- `lib/actions`: validated user-facing actions; internal data helpers use `server-only`
- `lib/alert-rules.ts`: testable freshness and alert matching rules
- `components/PreferencesProvider.tsx`: optional-content permission, expiry and withdrawal

Production mailouts and Gemini inference require explicit feature configuration and provider/privacy review. See [INNGEST.md](docs/INNGEST.md) for deployment switches and [TESTING.md](docs/TESTING.md) for what is and is not verified.
