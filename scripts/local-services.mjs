import { MongoMemoryServer } from "mongodb-memory-server";
import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";

// Everything here is synthetic and ephemeral. There is no mail relay or remote DB.
export async function startLocalServices() {
  const messages = [];
  const mongo = await MongoMemoryServer.create({
    binary: { downloadDir: resolve(".artifacts/mongodb-binaries") },
    instance: { ip: "127.0.0.1", dbName: "stillmark_test_workspace" },
  });
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["AUTH", "STARTTLS"],
    size: 200000,
    onRcptTo(address, _session, callback) {
      callback(
        /^[a-z0-9._+-]+@example\.test$/i.test(address.address)
          ? undefined
          : new Error("Test addresses only"),
      );
    },
    onData(stream, session, callback) {
      simpleParser(stream, { skipHtmlToText: true, skipTextToHtml: true })
        .then((mail) => {
          messages.push({
            id: randomUUID(),
            to: session.envelope.rcptTo.map((item) => item.address),
            subject: mail.subject || "",
            text: mail.text || "",
            date: new Date().toISOString(),
          });
          if (messages.length > 100) messages.shift();
          callback();
        })
        .catch(callback);
    },
  });
  const mailbox = createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    if (
      !["127.0.0.1:8025", "localhost:8025"].includes(req.headers.host || "") ||
      (req.headers.origin &&
        !["http://127.0.0.1:8025", "http://localhost:8025"].includes(
          req.headers.origin,
        ))
    ) {
      res.writeHead(403);
      res.end("Local requests only");
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();
      return;
    }
    if (req.url === "/api/messages") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(messages));
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const escape = (value) =>
      value.replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[char],
      );
    res.end(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Stillmark test inbox</title><style>body{font:16px/1.6 system-ui;max-width:850px;margin:40px auto;padding:20px;color:#173e31;background:#f5f7f3}article{background:white;border:1px solid #cdd8cf;border-radius:16px;padding:24px;margin:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}a{color:#155c42}</style></head><body><h1>Test inbox</h1><p>Local SMTP delivery only. Nothing here is sent to the internet. Test accounts and messages are discarded when this server stops.</p><a href="/">Refresh inbox</a> · <a href="http://127.0.0.1:3001">Open test workspace</a>${
        messages
          .toReversed()
          .map(
            (mail) =>
              `<article><h2>${escape(mail.subject)}</h2><p>To: ${escape(mail.to.join(", "))}</p><pre>${escape(mail.text).replace(/http:\/\/127\.0\.0\.1:3001\/[^\s<]+/g, (url) => `<a href="${url}">${url}</a>`)}</pre></article>`,
          )
          .join("") ||
        "<p>No messages yet. Create an @example.test account in the test workspace.</p>"
      }</body></html>`,
    );
  });
  try {
    await new Promise((done, reject) => {
      smtp.once("error", reject);
      smtp.listen(2525, "127.0.0.1", done);
    });
    await new Promise((done, reject) => {
      mailbox.once("error", reject);
      mailbox.listen(8025, "127.0.0.1", done);
    });
  } catch (error) {
    smtp.close();
    mailbox.close();
    await mongo.stop();
    throw error;
  }
  return {
    env: {
      APP_TEST_MODE: "true",
      NODE_ENV: "development",
      MARKET_DATA_MODE: "sample",
      MONGODB_URI: mongo.getUri("stillmark_test_workspace"),
      BETTER_AUTH_URL: "http://127.0.0.1:3001",
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
      MAIL_MODE: "smtp",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "2525",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      MAIL_FROM: "stillmark@example.test",
      NODEMAILER_EMAIL: "",
      NODEMAILER_PASSWORD: "",
      GEMINI_API_KEY: "",
      INNGEST_EVENT_KEY: "",
      INNGEST_SIGNING_KEY: "",
      ENABLE_REGISTRATION: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    async stop() {
      smtp.close();
      mailbox.close();
      await mongo.stop();
    },
  };
}
