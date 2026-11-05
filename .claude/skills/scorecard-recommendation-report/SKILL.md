---
name: scorecard-recommendation-report
description: Generate a branded, evidence-based PDF recommendation report for a Growth Readiness Scorecard prospect, given just their email address. Use this whenever the user asks for a "growth readiness report," "scorecard report," "recommendation report/PDF," or asks to "pull up" / "look up" / "generate a report for" a lead or prospect by email in the context of the scorecard database (scorecard_submissions in Supabase). Also trigger on requests like "turn this scorecard submission into a PDF" or "build a report for <email>".
---

# Scorecard Recommendation Report

Turns one Growth Readiness Scorecard submission into a client-ready PDF: the
same design and reasoning as the reports built by hand earlier — an
executive summary, a category-by-category breakdown backed by the
prospect's actual answers, a bright-spot callout, and a budget-aware
sequenced roadmap.

## Why this exists

Writing one of these by hand means logging into the admin dashboard,
reading through 30 answers, mapping points back to the option a prospect
picked, and hand-authoring recommendations for each category. That work is
now baked into scripts so the same submission always produces the same
well-reasoned report — you don't need to re-derive it from scratch each
time. What's left for you to do is judgment calls: which submission to use
if there are several, and whether anything about this specific prospect
warrants a note the mechanical pipeline can't know to add.

## Requirements

The scripts need `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in a `.env.local`
file at the project root (same values already configured in the Vercel
project — see `.env.local.example`). If that file is missing or the values
are wrong, `fetch-submission.mjs` fails with a clear message rather than a
cryptic Supabase error — surface that message to the user and ask them to
add the file rather than guessing at credentials.

Run scripts from the project root with Node (the project already has
`@supabase/supabase-js` and `puppeteer` installed — no extra install step).

## How to generate a report

1. Run the orchestrator with the prospect's email:

   ```bash
   node .claude/skills/scorecard-recommendation-report/scripts/generate-report.mjs --email prospect@example.com --out-dir <scratchpad-dir>
   ```

   This chains four steps (each individually runnable — see below if one
   fails and you need to debug which stage broke):
   - `fetch-submission.mjs` — queries `scorecard_submissions` by email, takes
     the most recent match, and resolves every raw answer (a 0–3 point
     value) back to the actual label the prospect selected.
   - `generate-content.mjs` — turns that into the report's actual content:
     an executive summary, per-category evidence + recommended fixes pulled
     from `question-bank.mjs`, a bright-spot callout (the single
     highest-scoring answer, if any hit a perfect 3/3), and a roadmap
     sequenced by a fixed priority order (foundational offer/funnel/tracking
     work before message polish, paid media always gated last).
   - `build-report.mjs` — renders that content into the branded HTML report
     (Playfair Display + DM Sans, the same black/orange palette as the rest
     of thedamlekdigital's site).
   - `render-pdf.mjs` — prints the HTML to a PDF via the project's existing
     puppeteer dependency.

   It prints the final PDF path on success. If the email has more than one
   submission on file, it uses the newest and prints a note about the older
   ones to stderr — mention that to the user rather than silently picking one.

2. Send the resulting PDF to the user (e.g. via `SendUserFile`). Skim the
   generated HTML or PDF first if you want to sanity-check it — the content
   is deterministic, but it's still worth a glance before handing it over,
   especially the first time you run this for a given prospect.

3. If the email isn't found, the script exits with an error naming the
   email — pass that along rather than guessing at typos; ask the user to
   confirm the address if it's not obviously a typo of one they gave you.

## When the mechanical output isn't enough

The roadmap, evidence, and fixes are generated the same way every time on
purpose — that's what makes this a skill rather than a one-off writing
task. But if the user asks for something the pipeline can't express (e.g.
"also mention that their budget doubled last month" or "compare this to
their previous submission"), add that as prose around the generated PDF
rather than trying to hand-edit the generated HTML — the next run would
just overwrite it anyway.

## Keeping the question bank in sync

`scripts/question-bank.mjs` mirrors the questions, options, and point
values in `scorecard.html` exactly, plus one canned recommendation per
question. If the scorecard's questions ever change, update both files
together — a mismatch means `fetch-submission.mjs` silently fails to
resolve some answer labels (they come back `null` and get skipped from the
evidence list rather than erroring, so check for suspiciously short
evidence lists as a sign the bank is stale).
