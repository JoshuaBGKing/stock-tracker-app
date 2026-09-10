// One small inference call using only a public, non-personal research prompt.
// No keys, raw provider errors, account data or full responses are printed.
import {
  parseResearchInsight,
  insightJsonSchema,
} from "../lib/insight-schema.ts";
const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
try {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");
  if (!/^[a-z0-9.-]{1,80}$/.test(model)) throw new Error("Invalid model name");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Return a very short neutral stock-research note about what a price quote alone cannot tell a reader. No trading advice, no claimed current prices. Summary under 40 words, one observation and one research question.",
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: insightJsonSchema,
          temperature: 0.2,
          maxOutputTokens: 1800,
        },
      }),
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok) {
    console.log(
      JSON.stringify({
        httpStatus: response.status,
        model,
        validOutput: false,
      }),
    );
    process.exitCode = 1;
  } else {
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text || "")
      .join("");
    parseResearchInsight(JSON.parse(text));
    console.log(
      JSON.stringify({ httpStatus: response.status, model, validOutput: true }),
    );
  }
} catch {
  console.error(
    "Gemini verification failed. Check key, model, quota and connectivity; credentials were not printed.",
  );
  process.exitCode = 1;
}
