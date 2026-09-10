# Account and service testing

## Isolated interactive workspace

```powershell
# Terminal 1: separate local app, disposable MongoDB, real SMTP sink
npm.cmd run dev:test

# Terminal 2: local Inngest worker (skip if already running)
npm.cmd run inngest:dev

# Terminal 3: full account/service integration checks
npm.cmd run test:accounts
```

- Test app: http://127.0.0.1:3001 — use this exact origin for email/session consistency.
- Inbox: http://127.0.0.1:8025 — refresh to see verification, reset and requested brief messages.
- Inngest: http://localhost:8288 — app `stillmark-test-delivery`, function `deliver-news-brief`.
- Normal app: http://localhost:3000 — its database/configuration and public registration gate are unchanged.

Create an account using any unique `@example.test` address and a 12–128 character password. Open its verification link from the local inbox, sign in, save a stock, and visit Settings to export data, opt in to a news brief, request delivery or delete the account. On stock details, test the permission-controlled research interface; its output is explicitly labelled as a fixture.

If using the workspace without running the automated account tests, register its worker once through the Inngest Apps UI at `http://127.0.0.1:3001/api/workflows`. The tests automatically perform that sync. All job IDs are generated on the server; do not manually inject account or email details into events.

The launcher creates its own local database URI and random auth secret, overrides mail credentials with the loopback SMTP sink, and blanks the Gemini and Inngest Cloud keys for that child process. It does not rewrite `.env` or connect to your existing database. Registration bypass requires development mode, a loopback test-prefixed database, a loopback app origin and the exact test mail-sink settings together. Misconfigured test mode fails closed.

Stop the test launcher with Ctrl+C to discard disposable accounts and captured emails. Do not store valuable data there. Do not expose these development services through a tunnel, port forwarding or a public host. The local inbox is intentionally readable without account authentication and must remain private to the testing machine.

## What the integration test covers

- Signup with terms acceptance and real verification-message delivery over local SMTP.
- Unverified sign-in rejection, successful verification and sign-in.
- Two independent browser sessions, account-scoped watchlists and exports.
- Concurrent saves/removals and duplicate controls for the same ticker; the test deliberately holds one response to detect stale-state replacement.
- AI request permission, authenticated action and explicitly labelled local response.
- Separate newsletter opt-in, actual Inngest-to-SMTP delivery, one-per-day duplicate guard and signed unsubscribe without authentication; GET links do not unsubscribe.
- One-click POST unsubscribe, tampered-signature rejection, older-link replay protection after resubscribing and request-size limits.
- Password-reset mail, new password, old-password rejection and session revocation.
- Wrong-password deletion rejection and successful account deletion.
- Deletion cancellation through Keep my data, Escape, close and outside-click clears the password and confirmation text.
- Automated accessibility scan on the authenticated Settings page.

The standalone account script allows up to 30 seconds for UI assertions because development routes compile lazily. This does not relax their expected results. Account action errors, incorrect saved state and failed delivery still fail the test. The most recent completed run and dependency versions are recorded in [VERIFICATION.md](VERIFICATION.md).

These checks do not establish deliverability to Gmail/Outlook, DNS sender reputation, a production database's security, cross-region data compliance or live AI accuracy. SMTP acceptance is not proof of inbox placement, and exactly-once SMTP delivery cannot be guaranteed across process crashes.

## Browser regression suite

Run `npm.cmd run test:e2e` for the UI/accessibility checks. This includes consent withdrawal with failed storage, truthful alert-persistence failures, and partial browser-data clearing. The server uses sample mode; selected-symbol tests intercept the quote response with fresh test values to verify triggering without real market traffic. The runner owns port 3100 and refuses to reuse an existing server there; on Windows it terminates only its spawned process tree after completion. A restricted agent sandbox may need process-management approval for that cleanup. No global PowerShell execution-policy change is needed. A cold Next.js compile is allowed up to five minutes at startup; browser assertions keep their own shorter timeouts.

The UI runner uses the normal `.next/dev` directory, so stop a normal `npm.cmd run dev` process before running it. A built `npm.cmd run start` application and the separate `.next-test` account workspace can remain running. Do not edit source files during the suite, since hot reload can reset browser test state.

## Optional live features

### Gemini research

Configure server-only `GEMINI_API_KEY`, `GEMINI_MODEL` and `ENABLE_AI_INSIGHTS=true` after reviewing the [Gemini API terms](https://ai.google.dev/gemini-api/terms). In particular, the service tier, supported regions and age restrictions must fit the actual audience. The default model is configurable; verify its availability in your project.

The live path sends only a stock's public quote and a bounded set of provider headlines. It requires a verified account, permission on each request and a six-per-hour account limit. It rejects sample-mode market snapshots, applies a timeout, validates the JSON response and renders plain text. No generated response is saved to the account, and no model-supplied URL is trusted. The source links shown are the original input headlines, not independent validation of the output.

### Mail delivery

For Gmail, the existing `NODEMAILER_EMAIL` / `NODEMAILER_PASSWORD` integration remains supported. For another provider, configure `MAIL_MODE=smtp`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, and any `SMTP_USER` / `SMTP_PASSWORD`. TLS is required outside the tightly constrained isolated test environment. Verification and password recovery use this transport directly; optional news delivery uses Inngest as described in [INNGEST.md](INNGEST.md).

### Logging

Next.js 16's development Server Function argument logging is disabled because credentials can otherwise appear in the terminal. Request-URL logging is also disabled to avoid leaking verification, reset and unsubscribe tokens. This change does not erase historical terminal output or control hosting-provider logs; audit those separately.
