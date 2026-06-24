# Raised by Reddit

A weekly AI newsletter. Every week it picks one great Reddit thread, reads all the answers, and emails you the best of them. Free.

Inspired by simple one-thing newsletters like [stayrelevant.email](https://stayrelevant.email/).

## What's here

- **`index.html`** — the landing page / signup page (static, deploy anywhere).
- **`generate.js`** — turns a Reddit thread URL into a finished issue (HTML email + Markdown) using Claude.

## Landing page

Open `index.html` directly, or:

```bash
npm run serve
```

To collect real signups, point the `<form action>` in `index.html` at your email
provider (Buttondown, ConvertKit, Mailchimp, etc.) — there's a `TODO` comment marking it.

Deploy by dropping the repo on Vercel, Netlify, or GitHub Pages — no build step.

## Generating an issue

```bash
npm install
export ANTHROPIC_API_KEY=sk-...
npm run generate -- https://www.reddit.com/r/AskReddit/comments/xxxxxx/
```

Output lands in `issues/<slug>.html` (paste into your ESP) and `issues/<slug>.md`.

Model: `claude-opus-4-8`. Swap it in `generate.js` if you want something cheaper.

## Roadmap

- [ ] Wire the signup form to a real provider
- [ ] Schedule weekly generation (cron / GitHub Action)
- [ ] Auto-send via the ESP's API once an issue is generated

---

Not affiliated with Reddit, Inc.
