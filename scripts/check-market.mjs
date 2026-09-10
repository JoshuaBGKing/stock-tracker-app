const key =
  process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
if (!key) {
  console.log("No Finnhub key configured. Demo mode remains available.");
  process.exit(1);
}
try {
  const response = await fetch("https://finnhub.io/api/v1/quote?symbol=AAPL", {
    headers: { "X-Finnhub-Token": key },
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  console.log(
    JSON.stringify({
      provider: "Finnhub",
      httpStatus: response.status,
      validQuote:
        Number.isFinite(data.c) &&
        data.c > 0 &&
        Number.isFinite(data.t) &&
        data.t > 0,
    }),
  );
  process.exitCode = response.ok && data.c > 0 ? 0 : 1;
} catch (error) {
  console.log(
    JSON.stringify({
      provider: "Finnhub",
      available: false,
      errorCode: error.cause?.code || error.name,
    }),
  );
  process.exitCode = 1;
}
