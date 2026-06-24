#!/usr/bin/env node
/**
 * Raised by Reddit — issue generator
 *
 * Takes a Reddit thread URL, pulls the post + top comments, and uses Claude to
 * write one week's newsletter issue (HTML email + plain text).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node generate.js https://www.reddit.com/r/AskReddit/comments/xxxx/
 *
 * Output is written to ./issues/<slug>.html and ./issues/<slug>.md
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const MODEL = "claude-opus-4-8";

async function fetchThread(url) {
  // Reddit serves JSON for any thread by appending .json
  const jsonUrl = url.replace(/\/?(\?.*)?$/, "") + ".json";
  const res = await fetch(jsonUrl, {
    headers: { "User-Agent": "raised-by-reddit/1.0 (newsletter)" },
  });
  if (!res.ok) throw new Error(`Reddit fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();

  const post = data[0].data.children[0].data;
  const comments = data[1].data.children
    .filter((c) => c.kind === "t1" && c.data.body)
    .slice(0, 40)
    .map((c) => ({ author: c.data.author, score: c.data.score, body: c.data.body }));

  return {
    title: post.title,
    subreddit: post.subreddit_name_prefixed,
    score: post.score,
    numComments: post.num_comments,
    url,
    comments,
  };
}

async function writeIssue(thread) {
  const commentBlock = thread.comments
    .map((c) => `[${c.score} upvotes] u/${c.author}: ${c.body}`)
    .join("\n\n");

  const prompt = `You are the editor of "Raised by Reddit," a weekly email that distills one great Reddit thread into its best, most useful answers.

Thread: ${thread.title}
Subreddit: ${thread.subreddit} · ${thread.score} upvotes · ${thread.numComments} comments

Top comments:
${commentBlock}

Write this week's issue. Requirements:
- A short, warm intro (2-3 sentences) framing why this thread is worth your reader's time.
- The 3-5 best answers, each as a pull-quote with a one-line takeaway. Lightly edit comments for clarity; never invent quotes.
- A one-sentence closer.
- Voice: friendly, concise, a little witty. No fluff, no "in today's fast-paced world."

Return JSON only.`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            subject: { type: "string" },
            intro: { type: "string" },
            answers: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  quote: { type: "string" },
                  takeaway: { type: "string" },
                  attribution: { type: "string" },
                },
                required: ["quote", "takeaway", "attribution"],
              },
            },
            closer: { type: "string" },
          },
          required: ["subject", "intro", "answers", "closer"],
        },
      },
    },
  });

  return response.parsed_output;
}

function renderHtml(issue, thread) {
  const answers = issue.answers
    .map(
      (a) => `
    <blockquote style="border-left:3px solid #ff4500;margin:0 0 20px;padding:4px 0 4px 16px;">
      <p style="margin:0 0 6px;font-size:17px;">${a.quote}</p>
      <p style="margin:0;color:#6b635a;font-size:14px;">${a.takeaway} <em>— ${a.attribution}</em></p>
    </blockquote>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1714;">
  <p style="color:#ff4500;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;font-size:13px;">Raised by Reddit</p>
  <h1 style="font-size:26px;line-height:1.2;">${thread.title}</h1>
  <p style="color:#6b635a;font-size:14px;">${thread.subreddit} · ${thread.score} upvotes · ${thread.numComments} comments</p>
  <p style="font-size:17px;">${issue.intro}</p>
  ${answers}
  <p style="font-size:17px;">${issue.closer}</p>
  <hr style="border:none;border-top:1px solid #e9e2d8;margin:28px 0;" />
  <p style="font-size:13px;color:#6b635a;">
    <a href="${thread.url}" style="color:#6b635a;">Read the full thread →</a><br />
    You're getting this because you subscribed to Raised by Reddit. Unsubscribe anytime.
  </p>
</body></html>`;
}

function renderMarkdown(issue, thread) {
  const answers = issue.answers
    .map((a) => `> ${a.quote}\n>\n> ${a.takeaway} — *${a.attribution}*`)
    .join("\n\n");
  return `# ${thread.title}\n\n_${thread.subreddit} · ${thread.score} upvotes · ${thread.numComments} comments_\n\n${issue.intro}\n\n${answers}\n\n${issue.closer}\n\n[Read the full thread →](${thread.url})\n`;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node generate.js <reddit-thread-url>");
    process.exit(1);
  }

  console.log("Fetching thread…");
  const thread = await fetchThread(url);
  console.log(`  "${thread.title}" (${thread.comments.length} comments pulled)`);

  console.log("Writing issue with Claude…");
  const issue = await writeIssue(thread);

  mkdirSync("issues", { recursive: true });
  const slug = slugify(issue.subject || thread.title);
  writeFileSync(join("issues", `${slug}.html`), renderHtml(issue, thread));
  writeFileSync(join("issues", `${slug}.md`), renderMarkdown(issue, thread));

  console.log(`\nSubject: ${issue.subject}`);
  console.log(`Saved → issues/${slug}.html and issues/${slug}.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
