import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Separate artifacts allow the isolated test app to run alongside the normal app.
  distDir: process.env.APP_TEST_MODE === "true" ? ".next-test" : ".next",
  // Next 16 logs Server Function arguments by default, including passwords.
  // Keep credentials and verification/reset URLs out of development output.
  logging: {
    serverFunctions: false,
    incomingRequests: false,
    browserToTerminal: false,
  },
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
