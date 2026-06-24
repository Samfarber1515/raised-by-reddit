// Dev preview: renders one sample issue so we can approve the design.
// Real content comes from the pipeline; this is placeholder copy at a 5th-grade level.
import { writeFileSync } from "node:fs";
import { renderEmail } from "./lib/email.js";

const sample = {
  number: "001",
  dateLabel: "Sunday",
  subreddit: "r/AskReddit",
  stat: "48,000 upvotes · 12,000 comments",
  question: "What's a small habit that made a big difference in your life?",
  intro:
    "People shared the tiny changes that paid off the most. None of them are hard. Here are the four that came up again and again.",
  answers: [
    {
      text: "Make your bed every morning. It takes one minute, and you start the day having already finished something.",
      author: "morningperson",
      upvotes: "14.2k",
    },
    {
      text: "When you think of a small task, do it right then if it takes less than two minutes. The little jobs never pile up.",
      author: "two_min_rule",
      upvotes: "9.8k",
    },
    {
      text: "Drink a glass of water before your coffee. I used to feel tired all morning. Turns out I was just thirsty.",
      author: "hydrate_first",
      upvotes: "7.4k",
    },
    {
      text: "Put your phone in another room when you go to sleep. I fall asleep faster and I wake up without doomscrolling for an hour.",
      author: "goodnight_phone",
      upvotes: "6.1k",
    },
  ],
  closer:
    "Pick one and try it this week. That's the whole trick — small, then steady.",
  threadUrl: "https://www.reddit.com/r/AskReddit/",
};

writeFileSync("issue-sample.html", renderEmail(sample));
console.log("Wrote issue-sample.html");
