export type ResearchInsight = {
  summary: string;
  observations: string[];
  questions: string[];
};

export function parseResearchInsight(value: unknown): ResearchInsight {
  if (!value || typeof value !== "object")
    throw new Error("Invalid research response");
  const data = value as Record<string, unknown>;
  const safeText = (text: unknown, max: number): text is string =>
    typeof text === "string" &&
    text.trim().length > 0 &&
    text.length <= max &&
    !/[<>\x00-\x08]/.test(text);
  const safeList = (items: unknown): items is string[] =>
    Array.isArray(items) &&
    items.length >= 1 &&
    items.length <= 4 &&
    items.every((text) => safeText(text, 400));
  if (
    !safeText(data.summary, 1200) ||
    !safeList(data.observations) ||
    !safeList(data.questions)
  )
    throw new Error("Invalid research response");
  return {
    summary: data.summary,
    observations: data.observations,
    questions: data.questions,
  };
}

export const insightJsonSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    observations: { type: "ARRAY", items: { type: "STRING" } },
    questions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "observations", "questions"],
};
