# Inngest previews and email delivery

## Actual email delivery worker

The original `/api/inngest` preview functions described below are retained for backward-compatible smoke tests. **Actual opted-in news delivery uses `/api/workflows`**, a separate client identity and a real SMTP transport.

In the isolated workspace, run `npm.cmd run dev:test`, keep `npm.cmd run inngest:dev` running and run `npm.cmd run test:accounts`. The tests register `stillmark-test-delivery`, create synthetic accounts through the UI and exercise actual email delivery to the local sink. For manual use, sync `http://127.0.0.1:3001/api/workflows` through the Inngest Apps UI. Subscribe and request a brief in the test app's Settings.

For production deployment, configure the operator/legal fields, an HTTPS `BETTER_AUTH_URL`, your mail provider, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` and `ENABLE_BACKGROUND_EMAIL=true`. Sync the deployed `/api/workflows` URL with Inngest Cloud. The production SDK explicitly uses cloud mode and verifies signed execution requests; setting a development flag does not expose this worker unsigned. No Cloud keys or production features are automatically enabled by these changes.

News briefs are on demand by default. `ENABLE_DAILY_BRIEF_CRON=true` additionally registers the weekday 22:00 UTC scheduler. It selects only active subscribers in batches; the delivery worker rechecks subscription version, active consent and email verification immediately before SMTP delivery. Disable the schedule in the Inngest dashboard as well as in code when retiring a deployed workflow.

The account action queues a durable, server-owned delivery record and submits its opaque ID. Delivery records expire after 30 days and are included in account export/deletion. If submission fails, the user sees an error and can retry; queued records are not silently treated as delivered. The worker retries failures and skips already-sent/cancelled jobs. A request may still arrive if SMTP acceptance races with withdrawal. SMTP cannot provide an exactly-once guarantee across a crash between acceptance and the database update; a stable Message-ID and job checks reduce duplicates, not eliminate every possible duplicate.

The delivery worker receives only a job ID in event payloads. The optional scheduler's durable step state includes internal subscription/user IDs, so configure vendor retention and access controls. No account email, watchlist or personalised investment profile is embedded in Inngest events.

## Original local preview workflows

The app also serves two executable preview workflows through `/api/inngest` during `next dev`. The implementation follows the [Inngest local development guide](https://www.inngest.com/docs/local-development) and the installed **v3** SDK's three-argument `createFunction` API. The CLI release and archive checksums are pinned in `scripts/inngest-dev.mjs`. The limits below apply to those two original previews, not the delivery worker above.

## Start and test

1. Stop any existing `npm.cmd start` server on port 3000 with Ctrl+C in its terminal. Production builds deliberately do not expose the local workflow handler.
2. Run `npm.cmd run dev` in one terminal.
3. Run `npm.cmd run inngest:dev` in another terminal.
4. Run `npm.cmd run test:inngest` in a third terminal. It syncs the app, sends two synthetic events, polls their runs and checks the completed preview output.
5. Open http://localhost:8288 and inspect the `stillmark-local` app and its Runs tab. Open a completed run to see durable steps and the final message under output. The application remains at http://localhost:3000.

These `.cmd` commands work with PowerShell's existing restrictive execution policy; no policy change is needed. The first `inngest:dev` run downloads the official CLI from GitHub and verifies its pinned SHA-256 checksum before extraction or execution. The verified archive is cached in `.artifacts/tooling/inngest`; subsequent runs work without another download and verify the archive again. Only the executable is extracted into a fresh temporary directory, which is removed after it exits. Stopping this command stops only the process tree it launched.

The default command binds to `127.0.0.1` and disables app discovery. To check the installed release without starting a server, run `npm.cmd run inngest:dev -- --version`. Explicit arguments replace the defaults: for example, `npm.cmd run inngest:dev -- dev --host 127.0.0.1 --no-discovery -u http://127.0.0.1:3001/api/workflows` starts the isolated delivery worker directly. Keep the loopback binding when specifying your own arguments.

## Manual events

In the dashboard's Send Event control, use the full event JSON. If using a function's Invoke control instead, supply just its `data` object.

Welcome preview:

```json
{
  "name": "app/user.created",
  "data": {}
}
```

Daily summary preview:

```json
{
  "name": "app/send.daily.news",
  "data": { "symbols": ["AAPL", "MSFT", "NVDA"] }
}
```

Supported sample symbols: AAPL, NVDA, MSFT, AMZN, GOOGL, TSLA, JPM, JNJ, XOM, V. Omitting `symbols` uses AAPL, MSFT and NVDA. Invalid input fails visibly instead of sending anything. Each final output includes `mode: "local-preview"`, `delivered: false`, and the rendered message addressed to the reserved test address `reader@example.test`.

## Test boundaries

- These are working event/step/rendering tests, **not SMTP delivery tests, news-feed tests or AI inference tests**. The daily brief has sample quotes and research prompts, explicitly labelled as fixtures.
- No real account events are emitted, no database users are fetched, no watchlists are uploaded, and no AI/email provider is contacted by these jobs. They can run regardless of the application's `MARKET_DATA_MODE`.
- There is no cron trigger. These jobs run only when manually invoked or sent an event. Real emails and background price alerts remain off; existing browser price alerts are unchanged.
- Do not put real names, emails, passwords, IDs, or credentials in test events. The local dashboard stores event input before a function can validate it. Unknown payload fields are rejected by the functions, but rejection cannot undo that local event history.
- `ENABLE_INNGEST_DEV=false` disables the route. It is enabled by default only during development. Production POST/PUT requests are rejected even if `ENABLE_INNGEST_DEV=true` or legacy Inngest keys exist.
- The SDK uses the fixed local server URL and a separate `stillmark-local` identity. Existing production Inngest schedules still need to be disabled in their own dashboard; local registration does not remove them.
- Keep both servers bound to loopback and do not tunnel them. Development mode disables signature verification; the local hostname/origin guard is defense in depth, not authentication.
- The CLI command does not enable persistence. Stop/restart it to reset in-memory test history.
- Your private `.env`, account registration gate, verification emails and legal configuration are unchanged. See [LAUNCH.md](LAUNCH.md) for separate account-flow staging requirements.

## Dependency note

The npm `inngest-cli` wrapper and its `adm-zip` override have been removed because its ZIP installer still carried an affected dependency. The project now downloads the checksum-pinned [official Inngest 1.44.0 release](https://github.com/inngest/inngest/releases/tag/v1.44.0) directly. Extraction uses the operating system's ZIP support on Windows or `tar` on macOS/Linux, not an npm ZIP library. This does not change the application's Inngest SDK version. When updating the CLI, review the official release and update both its version and all archive checksums together; never skip checksum verification to work around a failed download.
