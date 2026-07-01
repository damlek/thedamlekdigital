# MailerLite Setup — Growth Readiness Scorecard

This connects scorecard submissions to MailerLite so each lead gets tagged by tier and dropped into the right follow-up sequence. The code (`api/scorecard.js`) already pushes subscribers to MailerLite — this doc covers what to set up on the MailerLite side.

## 1. Get your API key

1. Log into MailerLite → click your account name (bottom left) → **Integrations**
2. Find **MailerLite API** → click it → **Generate new token**
3. Copy the token and add it to Vercel: **Project → Settings → Environment Variables** → `MAILERLITE_API_KEY`
4. Also add it to your local `.env.local` for testing

## 2. Create 4 groups (one per tier)

Go to **Subscribers → Groups → Create group**. Create exactly these 4, named however you like, but keep track of the IDs:

- `Scorecard – Foundation Gap`
- `Scorecard – Growth System Gap`
- `Scorecard – Scale Ready`
- `Scorecard – Performance Optimization`

To find each group's ID: click into the group, the ID is in the URL (`app.mailerlite.com/subscribers/groups/<GROUP_ID>`).

Add each ID to your env vars:

```
MAILERLITE_GROUP_FOUNDATION=<id>
MAILERLITE_GROUP_GROWTH=<id>
MAILERLITE_GROUP_SCALE=<id>
MAILERLITE_GROUP_PERFORMANCE=<id>
```

## 3. Create custom fields

MailerLite requires custom fields to exist before the API can set them. Go to **Subscribers → Custom Fields → Create field** and add these (type: **Text**, except `score` which is **Number**):

| Field key       | Type   |
|-----------------|--------|
| `company`       | Text   |
| `website`       | Text   |
| `budget`        | Text   |
| `score`         | Number |
| `tier`          | Text   |
| `weakest_areas` | Text   |

(`name` and `email` are built-in MailerLite fields, no need to create those.)

## 4. Build one automation per group

Go to **Automations → Create automation → Subscriber joins a group** for each of the 4 groups.

Trigger: *Subscriber joins group* → select the matching tier group.

Each automation should send **one email immediately** with their personalized action steps. Draft copy below — paste into the automation email, then personalize using MailerLite's `{$name}`, `{$score}`, `{$weakest_areas}` merge tags.

### Foundation Gap (0–39)

> Subject: Your Growth Readiness Score: {$score}/100 — here's what to fix first
>
> Hi {$name},
>
> Thanks for taking the Growth Readiness Scorecard. Your score was **{$score}/100** — which puts you in the Foundation Gap range.
>
> This isn't bad news. It means the fastest way to grow right now isn't more ad spend — it's fixing the foundation first. Your biggest gaps were: **{$weakest_areas}**.
>
> Here's what I'd recommend focusing on first:
> 1. Get your offer and messaging crystal clear before anything else
> 2. Build (or rebuild) a landing page designed to convert, not just inform
> 3. Put basic tracking in place so you know what's working
>
> Want a second pair of eyes on this? Book a free Growth Accelerator Strategy Session and we'll walk through your specific gaps together: [book link]
>
> — thedamlek digital

### Growth System Gap (40–69)

> Subject: Your Growth Readiness Score: {$score}/100 — you're closer than you think
>
> Hi {$name},
>
> Your Growth Readiness Score was **{$score}/100**. You've got real pieces in place — but the system isn't tight enough yet to scale consistently.
>
> Your biggest gaps: **{$weakest_areas}**. Fixing these two areas alone could meaningfully change your results before you spend more on ads.
>
> Want help prioritizing what to fix first? Book a free Growth Accelerator Strategy Session: [book link]
>
> — thedamlek digital

### Scale Ready (70–84)

> Subject: Your Growth Readiness Score: {$score}/100 — you're ready to scale
>
> Hi {$name},
>
> Solid result — **{$score}/100**. Your foundation is in good shape. From here, the gains come from campaign structure, creative testing, and tighter optimization rather than fixing fundamentals.
>
> Your area with the most room to improve: **{$weakest_areas}**.
>
> If you want a plan for scaling profitably, book a free Growth Accelerator Strategy Session: [book link]
>
> — thedamlek digital

### Performance Optimization (85–100)

> Subject: Your Growth Readiness Score: {$score}/100 — strong system
>
> Hi {$name},
>
> Excellent — **{$score}/100**. You already have a strong growth system in place. At this stage, it's about deeper optimization to squeeze more efficiency out of what's already working.
>
> If you'd like a second opinion on where the next gains are, book a free Growth Accelerator Strategy Session: [book link]
>
> — thedamlek digital

## 5. Test it

1. Fill out the scorecard at `/scorecard` on your live or preview deployment with a real test email
2. Check MailerLite → Subscribers → confirm the subscriber appears with the correct group + custom fields filled in
3. Confirm the automation email arrives

## Notes

- Replace `[book link]` in each email with your actual booking/contact link once you have one (currently the on-page CTA points to `index.html#contact`)
- If `MAILERLITE_API_KEY` isn't set, the scorecard still works — it just skips the MailerLite sync (submission is still saved to Supabase and emailed to you internally)
