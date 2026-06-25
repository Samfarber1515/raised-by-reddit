// Renders one issue into a Reddit-flavored HTML email — clean, but clearly Reddit:
// the alien mark, r/AskReddit, post upvotes + comment count, and each answer as a
// comment card with a vote pill. Paste the output into Beehiiv's custom HTML block.

const ORANGE = "#FF4500";
const INK = "#1a1a1b";
const GRAY = "#7c7c83";
const LINE = "#e6e6e8";
const CARD = "#f7f8f9";
const PAGE = "#e9ebee";
const FONT = `-apple-system, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif`;

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const LOGO = `<svg width="30" height="30" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="120" fill="${ORANGE}"/>
  <g fill="#fff"><circle cx="256" cy="110" r="17"/><rect x="249" y="118" width="14" height="74" rx="7"/>
  <ellipse cx="256" cy="290" rx="118" ry="104"/><circle cx="150" cy="288" r="30"/><circle cx="362" cy="288" r="30"/></g>
  <g fill="${ORANGE}"><ellipse cx="219" cy="278" rx="18" ry="24"/><ellipse cx="293" cy="278" rx="18" ry="24"/></g>
  <g fill="#fff"><circle cx="225" cy="270" r="6"/><circle cx="299" cy="270" r="6"/></g>
  <circle cx="256" cy="344" r="26" fill="none" stroke="#fff" stroke-width="11"/><circle cx="256" cy="344" r="11" fill="#fff"/></svg>`;

function commentCard(a) {
  const initial = esc((a.author || "?").charAt(0).toUpperCase());
  const vote = a.upvotes
    ? `<span style="display:inline-block;background:#fff;border:1px solid ${LINE};border-radius:999px;
         padding:5px 12px;font:700 13px/1 ${FONT};color:${ORANGE};">&#9650; ${esc(a.upvotes)}</span>`
    : "";
  return `
    <tr><td style="padding:8px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CARD};border:1px solid ${LINE};border-radius:14px;">
        <tr><td style="padding:18px 20px;">
          <div style="font:600 13px/1 ${FONT};color:${GRAY};margin-bottom:10px;">
            <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#d9dadc;
              color:#555;text-align:center;line-height:22px;font-size:12px;font-weight:700;vertical-align:middle;margin-right:8px;">${initial}</span>
            <a href="https://www.reddit.com/user/${encodeURIComponent(a.author)}" style="vertical-align:middle;color:${INK};text-decoration:none;">u/${esc(a.author)}</a>
          </div>
          <div style="font:400 17px/1.55 ${FONT};color:${INK};">${esc(a.text)}</div>
          ${vote ? `<div style="margin-top:12px;">${vote}</div>` : ""}
        </td></tr>
      </table>
    </td></tr>`;
}

export function renderEmail(issue) {
  const cards = (issue.answers || []).map(commentCard).join("");
  const upv = issue.upvotes || "";
  const coms = issue.comments || "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(issue.question)}</title></head>
<body style="margin:0;padding:0;background:${PAGE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};">
<tr><td align="center" style="padding:32px 14px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
    style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">

    <!-- masthead -->
    <tr><td style="padding:26px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">${LOGO}</td>
        <td style="vertical-align:middle;padding-left:10px;font:800 16px/1 ${FONT};color:${INK};">Raised by Reddit</td>
      </tr></table>
    </td></tr>

    <!-- post header -->
    <tr><td style="padding:24px 32px 0;">
      <div style="font:600 14px/1 ${FONT};color:${GRAY};">${esc(issue.subreddit || "r/AskReddit")}</div>
      <h1 style="font:700 26px/1.25 ${FONT};color:${INK};margin:10px 0 0;">${esc(issue.question)}</h1>
      <div style="margin-top:14px;font:700 14px/1 ${FONT};color:${GRAY};">
        <span style="color:${ORANGE};">&#9650; ${esc(upv)} upvotes</span>
        &nbsp;&nbsp;&#128172; ${esc(coms)} comments
      </div>
    </td></tr>

    <!-- intro -->
    <tr><td style="padding:20px 32px 0;font:400 17px/1.6 ${FONT};color:${INK};">
      ${esc(issue.intro)}
    </td></tr>

    <!-- top answers label -->
    <tr><td style="padding:24px 32px 0;font:700 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${GRAY};">
      Top answers
    </td></tr>

    <!-- comment cards -->
    <tr><td style="padding:8px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
    </td></tr>

    <!-- closer -->
    <tr><td style="padding:20px 32px 0;font:400 17px/1.6 ${FONT};color:${INK};">
      ${esc(issue.closer)}
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:24px 32px 0;">
      <a href="${esc(issue.threadUrl || "#")}" style="display:inline-block;background:${ORANGE};color:#fff;
        font:700 15px/1 ${FONT};text-decoration:none;padding:13px 22px;border-radius:999px;">
        Read the thread on Reddit &rarr;
      </a>
    </td></tr>

    <!-- footer -->
    <tr><td style="padding:32px 32px 36px;">
      <div style="border-top:1px solid ${LINE};padding-top:20px;font:400 12px/1.6 ${FONT};color:${GRAY};">
        Raised by Reddit &nbsp;·&nbsp; one great thread, read for you.<br />
        Not affiliated with Reddit, Inc.
      </div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
