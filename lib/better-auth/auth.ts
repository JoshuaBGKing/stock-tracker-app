import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { registrationOpen } from "@/lib/legal";
import { policyVersion } from "@/lib/brand";
import { sendAccountEmail } from "@/lib/nodemailer";
import { permitAuthMail } from "@/lib/auth-rate-limit";
type AdapterDatabase = Parameters<typeof mongodbAdapter>[0];
const createAuth = async () => {
  const secret = process.env.BETTER_AUTH_SECRET,
    baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || !baseURL) throw new Error("Account service is not configured");
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Account service is unavailable");
  return betterAuth({
    appName: "Stillmark",
    telemetry: { enabled: false },
    database: mongodbAdapter(db as unknown as AdapterDatabase),
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: !registrationOpen,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        if (!(await permitAuthMail(user.email, "reset"))) return;
        await sendAccountEmail(user.email, url, "reset");
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        if (!(await permitAuthMail(user.email, "verify"))) return;
        await sendAccountEmail(user.email, url, "verify");
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              termsVersion: policyVersion,
              termsAcceptedAt: new Date(),
            },
          }),
        },
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    user: {
      additionalFields: {
        termsVersion: { type: "string", required: false, input: false },
        termsAcceptedAt: { type: "date", required: false, input: false },
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await Watchlist.deleteMany({ userId: user.id });
          await db
            .collection("newsSubscriptions")
            .deleteMany({ userId: user.id });
          await db.collection("briefJobs").deleteMany({ userId: user.id });
        },
      },
    },
    plugins: [nextCookies()],
  });
};
let pending: ReturnType<typeof createAuth> | undefined;
export async function getAuth() {
  if (!pending)
    pending = createAuth().catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}
