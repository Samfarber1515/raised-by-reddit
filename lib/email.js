// Renders one newsletter issue into a clean, Apple-style HTML email.
// Design goals: lots of whitespace, near-monochrome, one accent, clear hierarchy.
// Paste the output into Beehiiv's "custom HTML" block, or preview standalone.

const INK = "#1d1d1f";
const GRAY = "#6e6e73";
const HAIR = "#d2d2d7";
const BG = "#f5f5f7";
const ACCENT = "#FF4500";
const FONT = `-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif`;

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function answerBlock(a, i, total) {
  const n = String(i + 1).padStart(2, "0");
  const divider = i < total - 1
    ? `<tr><td style="padding:32px 0 0;"><div style="border-top:1px solid ${HAIR};"></div></td></tr>`
    : "";
  return `
    <tr><td style="padding-top:${i === 0 ? 8 : 32}px;">
      <div style="font:600 13px/1 ${FONT};letter-spacing:.04em;color:${HAIR === GRAY ? GRAY : "#b0b0b5"};">${n}</div>
      <div style="font:400 19px/1.55 ${FONT};color:${INK};margin-top:12px;">${esc(a.text)}</div>
      <div style="font:400 14px/1.4 ${FONT};color:${GRAY};margin-top:12px;">
        <span style="color:${ACCENT};font-weight:600;">▲ ${esc(a.upvotes)}</span>
        &nbsp;·&nbsp; u/${esc(a.author)}
      </div>
    </td></tr>${divider}`;
}

export function renderEmail(issue) {
  const answers = (issue.answers || [])
    .map((a, i) => answerBlock(a, i, issue.answers.length))
    .join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(issue.question)}</title></head>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
    style="width:600px;max-width:100%;background:#ffffff;border-radius:18px;overflow:hidden;">
    <tr><td style="padding:48px 48px 0;">

      <!-- masthead -->
      <div style="font:700 12px/1 ${FONT};letter-spacing:.18em;text-transform:uppercase;color:${ACCENT};">
        Raised by Reddit
      </div>
      <div style="font:400 13px/1 ${FONT};color:${GRAY};margin-top:8px;">
        ${esc(issue.dateLabel || "")}${issue.number ? ` &nbsp;·&nbsp; Issue ${esc(issue.number)}` : ""}
      </div>

      <!-- headline -->
      <h1 style="font:600 30px/1.18 ${FONT};color:${INK};letter-spacing:-0.02em;margin:28px 0 0;">
        ${esc(issue.question)}
      </h1>
      <div style="font:400 14px/1.4 ${FONT};color:${GRAY};margin-top:12px;">
        ${esc(issue.subreddit || "r/AskReddit")}${issue.stat ? ` &nbsp;·&nbsp; ${esc(issue.stat)}` : ""}
      </div>

      <!-- intro -->
      <p style="font:400 17px/1.6 ${FONT};color:${INK};margin:24px 0 0;">
        ${esc(issue.intro)}
      </p>

      <div style="border-top:1px solid ${HAIR};margin:32px 0 0;"></div>

      <!-- answers -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${answers}
      </table>

      <div style="border-top:1px solid ${HAIR};margin:36px 0 0;"></div>

      <!-- closer -->
      <p style="font:400 17px/1.6 ${FONT};color:${INK};margin:28px 0 0;">
        ${esc(issue.closer)}
      </p>

      <!-- read more -->
      <p style="margin:24px 0 0;">
        <a href="${esc(issue.threadUrl || "#")}" style="font:600 15px/1 ${FONT};color:${ACCENT};text-decoration:none;">
          Read the original thread &rarr;
        </a>
      </p>

    </td></tr>

    <!-- footer -->
    <tr><td style="padding:40px 48px 44px;">
      <div style="border-top:1px solid ${HAIR};padding-top:24px;
        font:400 12px/1.6 ${FONT};color:${GRAY};">
        Raised by Reddit &nbsp;·&nbsp; one great thread, read for you.<br />
        Not affiliated with Reddit, Inc.
      </div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
