#!/usr/bin/env node
// Render one curated issue (no Reddit API needed).
// You paste a thread you like; the issue is described in a small JSON draft;
// this turns it into the finished, Apple-clean HTML email for Beehiiv.
//
//   node make-issue.js drafts/001.json
//
// Draft shape:
// {
//   "number": "001", "subreddit": "r/AskReddit",
//   "stat": "6.3K upvotes · 3.5K comments",
//   "question": "...", "intro": "...",
//   "answers": [{ "text": "...", "author": "name", "upvotes": "10k" (optional) }],
//   "closer": "...", "threadUrl": "https://..."
// }

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderEmail } from "./lib/email.js";

const path = process.argv[2];
if (!path) {
  console.error("usage: node make-issue.js <draft.json>");
  process.exit(1);
}

const issue = JSON.parse(readFileSync(path, "utf8"));
mkdirSync("issues", { recursive: true });

const slug = (issue.question || "issue")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
const file = `${issue.number || "001"}-${slug}.html`;

writeFileSync(join("issues", file), renderEmail(issue));
console.log(`Wrote issues/${file}`);
