#!/usr/bin/env node
// Builds a bank of newsletter issues from the top all-time Reddit threads.
// Run once; it's resume-safe (re-run to add more, it skips threads already done).
//
//   REDDIT_CLIENT_ID=... REDDIT_CLIENT_SECRET=... ANTHROPIC_API_KEY=... \
//     node build-bank.js            # builds up to TARGET issues
//   node build-bank.js 50           # build only 50 (good for a first test)
//
// Output: issues/NNN-slug.html (paste into Beehiiv) + issues/manifest.json

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fetchTopPosts, isGoodThread, fetchTopComments } from "./lib/reddit.js";
import { generateIssue } from "./lib/generate.js";
import { renderEmail } from "./lib/email.js";

// Evergreen subreddits whose top threads age well. Tune freely.
const SUBREDDITS = [
  "AskReddit",
  "LifeProTips",
  "AskOldPeople",
  "getdisciplined",
  "personalfinance",
  "productivity",
  "Showerthoughts",
  "AskMen",
  "AskWomen",
  "frugal",
];

const TARGET = parseInt(process.argv[2] || "365", 10);
const PER_SUB = 100;
const OUT = "issues";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const manifestPath = join(OUT, "manifest.json");
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : [];
  const done = new Set(manifest.map((m) => m.threadId));
  console.log(`Starting. Already have ${manifest.length} issues. Target: ${TARGET}.`);

  // Gather candidate threads across subreddits.
  const candidates = [];
  for (const sub of SUBREDDITS) {
    try {
      console.log(`Fetching top posts from r/${sub}...`);
      const posts = await fetchTopPosts(sub, PER_SUB);
      for (const p of posts) {
        if (isGoodThread(p) && !done.has(p.id)) candidates.push(p);
      }
    } catch (e) {
      console.warn(`  skip r/${sub}: ${e.message}`);
    }
    await sleep(1200);
  }
  // De-dupe and rank by score so the best go first.
  const seen = new Set();
  const ranked = candidates
    .filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
    .sort((a, b) => b.score - a.score);
  console.log(`Found ${ranked.length} fresh candidate threads.`);

  for (const post of ranked) {
    if (manifest.length >= TARGET) break;
    try {
      const comments = await fetchTopComments(post, 6);
      if (comments.length < 3) continue;

      const issueData = await generateIssue(post, comments);
      const answers = issueData.picks
        .filter((p) => comments[p.index])
        .map((p) => ({
          text: p.text,
          author: comments[p.index].author,
          upvotes: fmt(comments[p.index].score),
        }));
      if (answers.length < 3) continue;

      const number = String(manifest.length + 1).padStart(3, "0");
      const issue = {
        number,
        dateLabel: "",
        subreddit: `r/${post.subreddit}`,
        stat: `${fmt(post.score)} upvotes · ${fmt(post.num_comments)} comments`,
        question: post.title,
        intro: issueData.intro,
        answers,
        closer: issueData.closer,
        threadUrl: `https://www.reddit.com${post.permalink}`,
      };

      const file = `${number}-${slugify(post.title)}.html`;
      writeFileSync(join(OUT, file), renderEmail(issue));
      manifest.push({
        number,
        threadId: post.id,
        subject: issueData.subject,
        question: post.title,
        subreddit: `r/${post.subreddit}`,
        score: post.score,
        threadUrl: issue.threadUrl,
        file,
      });
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`  [${manifest.length}/${TARGET}] ${issueData.subject}`);

      await sleep(1500);
    } catch (e) {
      console.warn(`  skip "${post.title.slice(0, 50)}": ${e.message}`);
    }
  }

  console.log(`\nDone. ${manifest.length} issues in ./${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
