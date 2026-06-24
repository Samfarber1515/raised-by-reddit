import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY
const MODEL = process.env.MODEL || "claude-sonnet-4-6";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string", description: "Email subject line, under 60 chars, plain and clear" },
    intro: { type: "string", description: "1-2 sentence opener" },
    picks: {
      type: "array",
      description: "The best comments to feature, in order, each lightly edited",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer", description: "the index of the chosen comment from the list" },
          text: { type: "string", description: "the comment, lightly cleaned up — same meaning, never invented" },
        },
        required: ["index", "text"],
      },
    },
    closer: { type: "string", description: "1 short closing line" },
  },
  required: ["subject", "intro", "picks", "closer"],
};

const RULES = `Write like a calm, smart friend. Follow these rules exactly:
- Reading level: 5th grade. Short sentences. Common words. No jargon.
- No AI slop. Banned: "dive in", "in today's world", "game-changer", "unlock", "elevate", "supercharge", "treasure trove", "delve", "buckle up", "the best part?", emoji, and hype.
- No em dashes. Use a period or "and".
- Be plain and warm, not salesy. Do not exaggerate.
- The comment text you return must keep the original meaning. Fix typos and trim, but never invent facts, numbers, or quotes. If a comment is rude or unsafe, skip it.
- Pick the 4 to 5 most useful, kind, and interesting comments. Order them best first.`;

export async function generateIssue(thread, comments) {
  const list = comments
    .map((c, i) => `[${i}] (${c.score} upvotes) ${c.body}`)
    .join("\n\n");

  const prompt = `You are the editor of "Raised by Reddit", a newsletter that turns one great Reddit thread into a short, clear email.

Thread question: ${thread.title}
Subreddit: r/${thread.subreddit}

Comments to choose from:
${list}

${RULES}

Return JSON only.`;

  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });

  if (res.stop_reason === "refusal") throw new Error("Generation refused.");
  const out = res.parsed_output;
  if (!out) throw new Error("No parseable output.");
  return out;
}
