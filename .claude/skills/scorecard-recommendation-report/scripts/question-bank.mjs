// Mirrors the question bank in scorecard.html exactly (category, question text,
// answer options with point values 0-3). `fix` is the canned recommendation
// surfaced whenever a prospect scored below the max on that question.
// Keep this in sync with scorecard.html if the scorecard questions ever change.

export const QUESTIONS = [
  // Offer Strength
  { cat: 'Offer Strength', q: "How would you describe your offer compared to competitors?",
    opts: [
      { l: "It's basically the same as everyone else", p: 0 },
      { l: "A little different, but hard to explain why", p: 1 },
      { l: "Clearly different in 1–2 ways", p: 2 },
      { l: "Clearly different and customers tell us so unprompted", p: 3 },
    ],
    fix: "Name the one or two things that make the offer different, and say them the same way every time — in the bio, on the site, and in every caption." },
  { cat: 'Offer Strength', q: "Can you explain your offer in one sentence a stranger would understand?",
    opts: [
      { l: "No, it takes a few minutes to explain", p: 0 },
      { l: "Sort of, but it sounds like a list of services", p: 1 },
      { l: "Yes, with a little practice", p: 2 },
      { l: "Yes, instantly and clearly", p: 3 },
    ],
    fix: "Write one sentence that says what's sold and who it's for. Test it on five people who've never seen the brand before publishing it anywhere." },
  { cat: 'Offer Strength', q: "Do you give people a reason to act now rather than \"someday\"?",
    opts: [
      { l: "No urgency or incentive at all", p: 0 },
      { l: "We mention urgency occasionally", p: 1 },
      { l: "We have a consistent reason to act now", p: 2 },
      { l: "Yes, it's a core part of the offer", p: 3 },
    ],
    fix: "Build one recurring reason to act now into the offer itself — a drop schedule, restock window, or limited run — rather than mentioning urgency occasionally." },
  { cat: 'Offer Strength', q: "How confident are you in your pricing relative to the value you deliver?",
    opts: [
      { l: "Not confident — we guess or copy competitors", p: 0 },
      { l: "Somewhat confident", p: 1 },
      { l: "Confident, based on some testing", p: 2 },
      { l: "Very confident, tested and validated", p: 3 },
    ],
    fix: "Pressure-test pricing with a small, real offer (a bundle or limited run) instead of guessing or copying competitors." },
  { cat: 'Offer Strength', q: "Have customers told you why they chose you over an alternative?",
    opts: [
      { l: "Never asked", p: 0 },
      { l: "Asked once or twice", p: 1 },
      { l: "We ask sometimes", p: 2 },
      { l: "We consistently track and use this feedback", p: 3 },
    ],
    fix: "Ask the last 5–10 buyers directly why they chose this business. Their own words become the strongest proof in the offer." },

  // Audience Clarity
  { cat: 'Audience Clarity', q: "Do you have a clearly defined ideal customer?",
    opts: [
      { l: "Not really, we'll work with anyone", p: 0 },
      { l: "General idea, nothing written down", p: 1 },
      { l: "Defined, but a bit broad", p: 2 },
      { l: "Specific and documented", p: 3 },
    ],
    fix: "Put the ideal customer on paper — even a rough one-pager beats a general idea that lives only in your head." },
  { cat: 'Audience Clarity', q: "Do you know your ideal customer's #1 pain point right now?",
    opts: [
      { l: "Not sure", p: 0 },
      { l: "General sense of it", p: 1 },
      { l: "Yes, fairly clear", p: 2 },
      { l: "Yes, in their own words", p: 3 },
    ],
    fix: "Sharpen the pain point from a general sense to their exact words — ask directly rather than guessing." },
  { cat: 'Audience Clarity', q: "Do you know what makes a customer choose you over a competitor?",
    opts: [
      { l: "No idea", p: 0 },
      { l: "A guess", p: 1 },
      { l: "Pretty good idea", p: 2 },
      { l: "Documented and confirmed by customers", p: 3 },
    ],
    fix: "Fold this question into the customer outreach already recommended above — it's the fastest way to close this gap." },
  { cat: 'Audience Clarity', q: "Do you know where your ideal customers spend time online?",
    opts: [
      { l: "No", p: 0 },
      { l: "Vague idea", p: 1 },
      { l: "Yes, 1–2 main channels", p: 2 },
      { l: "Yes, clearly mapped", p: 3 },
    ],
    fix: "Confirm the channels already suspected with real data — where inquiries and sales actually come from — rather than a vague sense of it." },
  { cat: 'Audience Clarity', q: "Have you ever segmented customers by value or fit?",
    opts: [
      { l: "Never", p: 0 },
      { l: "Thought about it", p: 1 },
      { l: "Done informally", p: 2 },
      { l: "Done and used to guide targeting", p: 3 },
    ],
    fix: "Write down the criteria behind this segmentation so it can guide targeting consistently, not just informally." },

  // Message Clarity
  { cat: 'Message Clarity', q: "Does your website explain what you do within 5 seconds of landing?",
    opts: [
      { l: "No, people often ask \"what do you actually do?\"", p: 0 },
      { l: "Somewhat, but takes scrolling", p: 1 },
      { l: "Mostly clear", p: 2 },
      { l: "Yes, instantly obvious", p: 3 },
    ],
    fix: "Put the one-sentence offer at the very top of whatever page people land on first — no scrolling required to understand it." },
  { cat: 'Message Clarity', q: "Is your messaging focused on the customer's problem or on your business?",
    opts: [
      { l: "Mostly about us — our story, our process", p: 0 },
      { l: "A mix", p: 1 },
      { l: "Mostly about the customer", p: 2 },
      { l: "Entirely framed around their problem and outcome", p: 3 },
    ],
    fix: "Rewrite the top-of-page and pinned messaging around the customer's problem and outcome, not the brand's story or process." },
  { cat: 'Message Clarity', q: "Do your headlines make the value obvious without reading further?",
    opts: [
      { l: "No, mostly generic", p: 0 },
      { l: "Somewhat", p: 1 },
      { l: "Yes, on key pages", p: 2 },
      { l: "Yes, everywhere", p: 3 },
    ],
    fix: "Replace generic headlines with ones that state the specific outcome or benefit, so the value lands before anyone reads further." },
  { cat: 'Message Clarity', q: "Is there one clear, consistent message across your site, ads, and social?",
    opts: [
      { l: "No, it varies a lot", p: 0 },
      { l: "Loosely consistent", p: 1 },
      { l: "Mostly consistent", p: 2 },
      { l: "Fully consistent", p: 3 },
    ],
    fix: "Pick the single sentence from the offer work above and repeat it, word for word, everywhere the brand shows up." },
  { cat: 'Message Clarity', q: "Do you address objections (price, trust, timing) anywhere in your messaging?",
    opts: [
      { l: "Not at all", p: 0 },
      { l: "Rarely", p: 1 },
      { l: "On some pages", p: 2 },
      { l: "Yes, proactively and clearly", p: 3 },
    ],
    fix: "Add one line addressing the most common hesitation — price, fit, shipping, timing — directly in the messaging." },

  // Funnel Readiness
  { cat: 'Funnel Readiness', q: "Do you have a landing page built specifically to convert (not just a homepage)?",
    opts: [
      { l: "No", p: 0 },
      { l: "Working on one", p: 1 },
      { l: "Yes, basic one", p: 2 },
      { l: "Yes, tested and optimized", p: 3 },
    ],
    fix: "Build one simple page whose only job is converting a visitor — not a general homepage or a social profile standing in for one." },
  { cat: 'Funnel Readiness', q: "Is there one clear call-to-action, or several competing for attention?",
    opts: [
      { l: "Several, it's cluttered", p: 0 },
      { l: "Mostly one, some clutter", p: 1 },
      { l: "One clear CTA", p: 2 },
      { l: "One clear CTA, repeated strategically", p: 3 },
    ],
    fix: "Cut every call-to-action but one on each page or post, and repeat that single action consistently." },
  { cat: 'Funnel Readiness', q: "What happens immediately after someone submits a form or inquiry?",
    opts: [
      { l: "Nothing automated, we get to it eventually", p: 0 },
      { l: "A generic auto-reply", p: 1 },
      { l: "A relevant follow-up within a day", p: 2 },
      { l: "An immediate, personalized follow-up sequence", p: 3 },
    ],
    fix: "Set up one automatic first reply for every inquiry — even a simple acknowledgment closes the biggest gap here." },
  { cat: 'Funnel Readiness', q: "Do you have a process for following up with leads who don't respond right away?",
    opts: [
      { l: "No follow-up after the first touch", p: 0 },
      { l: "One follow-up attempt", p: 1 },
      { l: "A few follow-ups over time", p: 2 },
      { l: "A structured multi-touch follow-up sequence", p: 3 },
    ],
    fix: "Add two or three more follow-up touches over the following week for anyone who goes quiet after the first message." },
  { cat: 'Funnel Readiness', q: "How many steps does it take for a ready buyer to become a customer?",
    opts: [
      { l: "Many steps, confusing", p: 0 },
      { l: "A few steps, could be simpler", p: 1 },
      { l: "Fairly simple", p: 2 },
      { l: "As few steps as possible, frictionless", p: 3 },
    ],
    fix: "Walk the buying path as a customer would and cut every step that isn't essential." },

  // Paid Media Readiness
  { cat: 'Paid Media Readiness', q: "Have you tested ad creatives or messaging before (even informally)?",
    opts: [
      { l: "Never run ads", p: 0 },
      { l: "Ran ads once without much testing", p: 1 },
      { l: "Tested a few variations", p: 2 },
      { l: "Ongoing structured testing", p: 3 },
    ],
    fix: "Keep testing creative variations, but tie each new test to the sharper offer and message coming out of the work above." },
  { cat: 'Paid Media Readiness', q: "Do you know your target cost per lead or cost per acquisition?",
    opts: [
      { l: "No idea", p: 0 },
      { l: "Rough guess", p: 1 },
      { l: "Reasonable estimate based on margins", p: 2 },
      { l: "Calculated and tracked", p: 3 },
    ],
    fix: "Calculate a target cost-per-acquisition from real margins before the next round of spend, instead of guessing." },
  { cat: 'Paid Media Readiness', q: "Do you have a dedicated budget set aside for testing before scaling?",
    opts: [
      { l: "No budget allocated", p: 0 },
      { l: "Small, ad hoc budget", p: 1 },
      { l: "Defined testing budget", p: 2 },
      { l: "Defined testing + scaling budget plan", p: 3 },
    ],
    fix: "Set aside a small, defined testing budget that's separate from day-to-day spend, however modest." },
  { cat: 'Paid Media Readiness', q: "How would you describe your past experience with paid ads, if any?",
    opts: [
      { l: "Never tried, or tried and lost money with no insight", p: 0 },
      { l: "Tried, mixed results, unclear why", p: 1 },
      { l: "Worked reasonably, room to improve", p: 2 },
      { l: "Worked well, looking to scale", p: 3 },
    ],
    fix: "Revisit past ad results once tracking is in place — mixed results usually trace back to unclear tracking or messaging, not the ads themselves." },
  { cat: 'Paid Media Readiness', q: "Do you have proof people will buy (organic sales, referrals, waitlist) before paid traffic?",
    opts: [
      { l: "No sales yet", p: 0 },
      { l: "A few sales, inconsistent", p: 1 },
      { l: "Steady organic/referral sales", p: 2 },
      { l: "Strong consistent demand already", p: 3 },
    ],
    fix: "Build steadier organic or referral demand first — paid traffic amplifies existing demand, it doesn't create it from nothing." },

  // Tracking & Measurement
  { cat: 'Tracking & Measurement', q: "Do you have conversion tracking set up (pixel, analytics, CRM)?",
    opts: [
      { l: "No tracking at all", p: 0 },
      { l: "Basic analytics only", p: 1 },
      { l: "Tracking most key actions", p: 2 },
      { l: "Full funnel tracking in place", p: 3 },
    ],
    fix: "Install a pixel and basic analytics before spending on anything else — this is usually a same-day fix." },
  { cat: 'Tracking & Measurement', q: "Do you know which channel your leads or sales actually come from?",
    opts: [
      { l: "No idea", p: 0 },
      { l: "Rough guess", p: 1 },
      { l: "Mostly know", p: 2 },
      { l: "Tracked precisely", p: 3 },
    ],
    fix: "Log the source of every sale, even in a simple spreadsheet, to turn a rough guess into a precise answer." },
  { cat: 'Tracking & Measurement', q: "How often do you review marketing/campaign performance?",
    opts: [
      { l: "Rarely or never", p: 0 },
      { l: "Occasionally", p: 1 },
      { l: "Monthly", p: 2 },
      { l: "Weekly or more", p: 3 },
    ],
    fix: "Set a standing weekly check-in on performance, even 15 minutes, instead of reviewing only occasionally." },
  { cat: 'Tracking & Measurement', q: "If a campaign underperforms, do you know why within a day or two?",
    opts: [
      { l: "No, we can't tell", p: 0 },
      { l: "Takes a while to figure out", p: 1 },
      { l: "Usually within a few days", p: 2 },
      { l: "Yes, almost immediately", p: 3 },
    ],
    fix: "Once tracking is in place, review a slow period within a day or two rather than letting it go unexplained." },
  { cat: 'Tracking & Measurement', q: "Do you track revenue/customer value back to the original marketing source?",
    opts: [
      { l: "No", p: 0 },
      { l: "Loosely", p: 1 },
      { l: "For most customers", p: 2 },
      { l: "For all customers, consistently", p: 3 },
    ],
    fix: "Tag or note the source on every sale so revenue can be traced back to what actually drove it." },
];

export const TIERS = [
  { min: 0, max: 39, name: 'Foundation Gap', headline: "The foundation isn't fully ready to carry paid media yet.",
    desc: "These are fixable, foundational issues — fixing them first will make every dollar spent later work harder." },
  { min: 40, max: 69, name: 'Growth System Gap', headline: "Real pieces are in place, but the system isn't strong enough yet to scale consistently.",
    desc: "A few targeted fixes could meaningfully change the results." },
  { min: 70, max: 84, name: 'Scale Ready', headline: "Close, with a solid foundation already in place.",
    desc: "The next gains come from campaign structure, creative testing, and optimization." },
  { min: 85, max: 100, name: 'Performance Optimization', headline: "A strong system is already in place.",
    desc: "From here it's about deeper optimization to improve efficiency and scale further." },
];

// Fixed sequencing philosophy: foundational, cheap, and instinct-building fixes
// before message polish, and paid media always gated behind all of it.
export const CATEGORY_PRIORITY = [
  'Offer Strength',
  'Funnel Readiness',
  'Tracking & Measurement',
  'Message Clarity',
  'Audience Clarity',
  'Paid Media Readiness',
];

export const CATEGORY_WHY = {
  'Offer Strength': 'Unblocks messaging, the page, and every ad that follows',
  'Funnel Readiness': 'Fixes where leads are most likely leaking today',
  'Tracking & Measurement': 'Cheapest fix here; makes every later decision measurable',
  'Message Clarity': 'Builds on the audience work to make the offer land',
  'Audience Clarity': 'Documents an instinct that may already be working',
  'Paid Media Readiness': 'Only worth scaling once the rest can convert it',
};

export const BUDGET_LABELS = {
  under1k: 'Under $1,000/month',
  '1kto3k': '$1,000 – $3,000/month',
  '3kto10k': '$3,000 – $10,000/month',
  over10k: '$10,000+/month',
};

export function getTier(score) {
  return TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];
}

export function band(pct) {
  if (pct >= 70) return 'good';
  if (pct >= 40) return 'mid';
  return 'attn';
}
