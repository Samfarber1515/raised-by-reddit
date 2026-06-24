// Reddit sourcing via the official API (anonymous .json is now 403-blocked).
//
// Setup (free, ~2 min):
//   1. Go to https://www.reddit.com/prefs/apps  -> "create another app..."
//   2. Choose type "script", name it, set redirect uri to http://localhost
//   3. Copy the client id (under the app name) and the secret.
// Set env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, and (recommended for a script
// app) REDDIT_USERNAME + REDDIT_PASSWORD. Optionally REDDIT_USER_AGENT.

const UA =
  process.env.REDDIT_USER_AGENT ||
  `raised-by-reddit/1.0 (by u/${process.env.REDDIT_USERNAME || "anonymous"})`;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (see lib/reddit.js header).");
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  // Password grant (script app) is the most reliable; fall back to app-only.
  const body = new URLSearchParams(
    process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD
      ? {
          grant_type: "password",
          username: process.env.REDDIT_USERNAME,
          password: process.env.REDDIT_PASSWORD,
        }
      : { grant_type: "client_credentials" }
  );

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Reddit auth failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return cachedToken;
}

async function api(path) {
  const token = await getToken();
  const res = await fetch(`https://oauth.reddit.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Reddit API ${path} failed: ${res.status}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Top all-time posts for a subreddit. Paginates to reach `limit` (>100).
export async function fetchTopPosts(subreddit, limit = 100) {
  const out = [];
  let after = null;
  while (out.length < limit) {
    const q = new URLSearchParams({ t: "all", limit: "100" });
    if (after) q.set("after", after);
    const data = await api(`/r/${subreddit}/top?${q}`);
    const kids = data.data.children || [];
    if (!kids.length) break;
    for (const c of kids) out.push(c.data);
    after = data.data.after;
    if (!after) break;
    await sleep(1200); // stay well under 60 req/min
  }
  return out.slice(0, limit);
}

// A post is a good newsletter candidate if it's a self-post question, SFW, popular.
export function isGoodThread(post) {
  return (
    post.is_self &&
    !post.over_18 &&
    !post.stickied &&
    post.score >= 5000 &&
    post.title.trim().endsWith("?") &&
    post.title.length <= 160
  );
}

// Fetch a thread's top comments, cleaned and ranked.
export async function fetchTopComments(post, n = 6) {
  const q = new URLSearchParams({ sort: "top", limit: "60", depth: "1" });
  const data = await api(`/r/${post.subreddit}/comments/${post.id}?${q}`);
  const comments = (data[1]?.data?.children || [])
    .filter((c) => c.kind === "t1")
    .map((c) => c.data)
    .filter(
      (c) =>
        c.body &&
        c.author &&
        c.author !== "[deleted]" &&
        !c.stickied &&
        c.body !== "[removed]" &&
        c.body !== "[deleted]" &&
        c.body.length >= 40 &&
        c.body.length <= 900
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((c) => ({ author: c.author, score: c.score, body: c.body.trim() }));
  return comments;
}
