# Raised by Reddit

A weekly newsletter. Each issue takes one great Reddit thread, reads the answers,
and sends you the best ones — clean, simple, and worth your time.

**The trick:** the best Reddit threads are evergreen. So instead of a fragile daily
scraper, we build a **bank** of issues from the *top threads of all time* and let
Beehiiv drip them out. Build it once, send for a year.

## How it works

```
top all-time threads  ->  pick best comments  ->  Claude writes the issue  ->  Apple-clean HTML  ->  Beehiiv
   (lib/reddit.js)          (lib/reddit.js)         (lib/generate.js)         (lib/email.js)
```

`build-bank.js` runs the whole loop and saves `issues/NNN-slug.html` + `issues/manifest.json`.

## Setup (one time)

**1. Reddit API app** (free, ~2 min) — anonymous access is blocked, so we use the official API:
- Go to https://www.reddit.com/prefs/apps → "create another app..."
- Type: **script**, redirect uri: `http://localhost`
- Copy the **client id** (under the app name) and the **secret**.

**2. Environment:**
```bash
cp .env.example .env   # then fill it in
```
```
ANTHROPIC_API_KEY=sk-ant-...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=your_reddit_username   # recommended (most reliable auth)
REDDIT_PASSWORD=your_reddit_password
MODEL=claude-sonnet-4-6                # cheap + plenty; swap to claude-opus-4-8 for top quality
```

**3. Install:**
```bash
npm install
```

## Build the bank

```bash
# load .env into the shell, then run
export $(grep -v '^#' .env | xargs)

npm run bank -- 25     # start small: build 25 issues and eyeball them
npm run bank           # build up to 365 (resume-safe — re-run to add more)
```

Output lands in `issues/`. Open any `.html` to preview. It's resume-safe: it skips
threads already built, so you can stop and re-run anytime.

## Send through Beehiiv

For each issue: in Beehiiv, new post → add a **custom HTML / code block** → paste the
file's contents → schedule. `issues/manifest.json` lists every issue's subject line
and source thread to make scheduling easy.

(Want this automated via the Beehiiv API instead of paste? That's a quick add once
you confirm your plan has API post creation.)

## Preview the design

```bash
npm run preview        # writes issue-sample.html with placeholder content
```

## Files

- `lib/reddit.js` — Reddit API auth + top threads + top comments
- `lib/generate.js` — Claude turns a thread into an issue (5th-grade, anti-slop, real comments only)
- `lib/email.js` — renders an issue into the Apple-clean HTML email
- `build-bank.js` — orchestrates the whole bank
- `index.html` — the public landing page (also live via GitHub Pages)
- `brand/` — logo, thumbnail, and design prompts

---

Not affiliated with Reddit, Inc.
