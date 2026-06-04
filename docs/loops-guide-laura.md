# Groundswell Email Guide for Laura
### How to build and manage our emails in Loops

---

## What is Loops and how does it connect to Groundswell?

Loops is our email platform. Groundswell's app is wired up to send Loops a signal ("event") every time something important happens — a new user signs up, someone cancels their subscription, or it's Sunday morning and there are great waves somewhere.

When Loops receives one of these signals, it looks for an email you've built for that signal and sends it. **Your job is to build those emails.** The engineering side (sending the signals) is already done.

There are three signals to build emails for:

| Signal name | When it fires | Purpose |
|---|---|---|
| `user_created` | Every time someone creates an account | Onboarding sequence |
| `weekly_swell_alert` | Every Sunday at 8am UTC | Weekly surf conditions digest |
| `subscription_cancelled` | When someone cancels their paid plan | Churn recovery |
| `swell_threshold_alert` | Daily at 7am UTC, when waves hit a user's saved threshold | Personal swell alert |

---

## Getting started

1. Go to **loops.so** and log in with the Groundswell team account
2. You'll land on the dashboard — the main sections you'll use are **Loops** (automations) and **Emails** (one-off broadcasts)

---

## How to build an email automation

Every automation in Loops follows the same structure:
**Trigger → Wait (optional) → Send Email**

Here's how to create one:

1. In the left sidebar, click **Workflows**
2. Click **New Workflow** (top right)
3. Choose **Event** as the trigger type
4. Type in the event name exactly as shown in the table above (e.g. `user_created`) — these are case-sensitive
5. Add your email steps using the **+** button (more on each one below)
6. Click **Publish** when ready — unpublished Workflows don't send anything

---

## Using contact details in your emails

Every email can be personalised with **variables** — placeholders that get swapped for real data when the email sends. In Loops, variables look like this: `{{firstName}}`

**Variables always available (from the contact's profile):**
- `{{firstName}}` — their first name
- `{{email}}` — their email address

**Extra variables for the weekly swell alert only** (sent with the event):
- `{{spot1Name}}` — name of the #1 surf spot this week (e.g. "Playa Cavancha")
- `{{spot1Rating}}` — rating label (e.g. "VERY GOOD")
- `{{spot1Waves}}` — wave height (e.g. "1.8m")
- `{{spot2Name}}`, `{{spot2Rating}}`, `{{spot2Waves}}` — #2 spot
- `{{spot3Name}}`, `{{spot3Rating}}`, `{{spot3Waves}}` — #3 spot

Example subject line: `{{spot1Name}} is looking {{spot1Rating}} this weekend 🏄`

---

## The three emails to build

---

### 1. Onboarding sequence — triggered by `user_created`

This fires the moment someone creates a Groundswell account. The goal is to get them to actually use the app and understand what it does.

**Structure: 3 emails**

**How to add the delay between emails:**
After each email step in the Loop builder, click the **+** button and choose **Delay** — set it to 2 days, 5 days, etc.

> **Variable note:** Use `{{firstName | "there"}}` (not `{{first_name}}`). The `| "there"` fallback means a blank name renders as "Hey there" instead of "Hey ,".

---

**Email 1 — send immediately (delay: 0 minutes)**

Subject: `You're in 🌊`

Body:
Hey {{firstName | "there"}},

Welcome to Groundswell. Really glad you found us.

Here are three things worth trying right now:

1. Search your local break and look at the accuracy rating — it's the number next to the forecast. That's us being honest about how confident the model is. No other app shows you this.
2. Check the tide section — four data sources, NOAA-verified where available.
3. Click through to the historical tab. You'll hit the upgrade prompt, but have a look at what's there — that's 3.5 years of swell data for any coastal coordinate on earth.

The free tier stays free. No time limit, no pressure.

If something feels off or you have a question, just reply — we both read every one.

Kevin & Laura
groundswell.surf

---

**Email 2 — send 2 days later**

Subject: `How one surfer chose October over November`

Body:
> Hey {{firstName | "there"}},
>
> A surfer we know was planning a trip to the Maldives. Two possible windows: October or November. Both looked good on paper.
>
> He pulled up three years of historical swell data on Groundswell — wave height, period, wind — for the exact atolls he was considering. October came up consistently stronger, with cleaner wind angles. November had more swell variance and a higher percentage of onshore days.
>
> He went in October. It was the best surf trip of his life.
>
> That feature is sitting behind the upgrade prompt you saw on day one. The 7-day trial unlocks everything — no card required to start.
>
> If you're planning a trip and want to dig into the data before you book, that's exactly what it's there for.
>
> Kevin & Laura
> groundswell.surf

---

**Email 3 — send 5 days later**

Subject: `Worth it?`

Body:
> Hey {{firstName | "there"}},
>
> We built Groundswell because we were frustrated with the same apps you probably use. Forecasts buried under ads. Check limits designed to annoy you into paying. Prices that keep going up. No transparency about when the model is actually confident.
>
> So we built something different. No ads on any tier, ever. No check limits. Published accuracy stats — 400 days of real error data, per station. Historical swell data going back to 2022 for anywhere on earth. Five languages.
>
> It's $4 a month. $40 for the year.
>
> If you've found it useful this week, here's how to unlock everything. Seven-day trial, no card required — you only need to add payment details if you decide to stay.
>
> If $4 a month isn't worth it to you right now, that's genuinely fine. The free tier is yours to keep.
>
> [Unlock everything — start free trial]
>
> Kevin & Laura
> groundswell.surf

---

### 2. Weekly swell alert — triggered by `weekly_swell_alert`

This fires every Sunday morning with the top 3 surf spots firing worldwide right now. The goal is to give subscribers a reason to open Groundswell every week.

**Structure: 1 email, sent immediately**

- Subject idea: `This week: {{spot1Name}} ({{spot1Rating}})` or `3 spots worth watching this Sunday`
- Content: List the 3 spots with their rating and wave height, link to groundswell.surf so they can pull up the full report

**Example body:**
> Here are this week's standout spots:
>
> **1. {{spot1Name}}** — {{spot1Rating}}, {{spot1Waves}}
> **2. {{spot2Name}}** — {{spot2Rating}}, {{spot2Waves}}
> **3. {{spot3Name}}** — {{spot3Rating}}, {{spot3Waves}}
>
> [See full forecast →]

Note: this email only goes to users who have opted in (the default for all new signups).

---

### 3. Churn recovery — triggered by `subscription_cancelled`

This fires when someone cancels their paid subscription. The goal is not to beg or offer a discount — it's to understand why they left and leave the door open.

**Structure: 1 email, sent 1 hour after the event**
(Add a 1-hour delay before the email so it doesn't feel robotic)

> **Reply-to:** Set the reply-to address to Kevin's email (kevinmccalley@gmail.com) so replies land directly with him — not in a shared inbox.

Subject: `Did we get something wrong?`

Body:
> Hey {{firstName | "there"}},
>
> We noticed you cancelled — that's completely fine, and we mean that.
>
> But if there was something specific that didn't work for you, we'd genuinely like to know. A missing spot, a forecast that felt off, something confusing in the UI — Kevin reads every reply and it goes directly into what we build next.
>
> No pressure to come back. Just an honest question from the two people who built this.
>
> Kevin & Laura
> groundswell.surf

---

## Testing before publishing

Before publishing any Loop, you can send yourself a test email:

1. Inside the Loop, click on an email step
2. Click **Send test email** (top right of the email editor)
3. It'll send to your Loops account email with placeholder data filled in

You can also preview how variables will look by clicking **Preview** in the email editor.

---

## A few things to know

- **Loops won't send anything until you publish.** A Loop in draft mode is invisible to users.
- **Events that fired before you published are gone.** If someone signed up before the onboarding Loop was live, they won't get those emails retroactively. Going forward is fine.
- **Unsubscribes are handled automatically.** Loops adds an unsubscribe link to every email. You don't need to manage this.
- **The sending domain is groundswell.surf.** Emails will come from whatever address Kevin has set in Loops → Settings → Domain (e.g. `hello@groundswell.surf`). Ask Kevin to confirm the from-address before you publish.

---

---

### 4. Swell threshold alert — triggered by `swell_threshold_alert`

This fires daily at 7am UTC for any user who has saved a surf spot and set a personal wave height threshold. It only fires when the actual wave height at that spot meets or exceeds their threshold. A 20-hour cooldown prevents the same spot from triggering again the next day unless they'd been alerted yesterday.

The goal is to give users a "go surf now" moment — a short, punchy alert that gets them out of bed and into the water.

**Structure: 1 email, sent immediately**

---

**Variables available in this email:**

| Variable | What it contains | Example |
|---|---|---|
| `{{firstName}}` | User's first name | "Jamie" |
| `{{spotName}}` | The saved spot that crossed the threshold | "Jeffreys Bay" |
| `{{waveHeightFt}}` | Current wave height in feet | "6.2" |
| `{{waveHeightM}}` | Current wave height in metres | "1.9" |
| `{{thresholdFt}}` | The threshold the user set, in feet | "5.0" |
| `{{thresholdM}}` | The threshold the user set, in metres | "1.5" |

---

**Subject line ideas:**

- `🌊 {{spotName}} is firing — {{waveHeightFt}}ft right now`
- `Your alert: {{spotName}} hit {{waveHeightFt}}ft`
- `{{spotName}} just crossed your threshold`

---

**Sample email body:**

> Hey {{firstName}},
>
> You asked us to let you know when **{{spotName}}** hits {{thresholdFt}}ft — it just did.
>
> **Right now: {{waveHeightFt}}ft**
>
> Conditions are live. Check the full forecast — swell direction, period, tide, and wind — before you head out.
>
> [Open {{spotName}} on Groundswell →](https://groundswell.surf)
>
> — The Groundswell team
>
> *You're receiving this because you set a swell alert for {{spotName}}. You can adjust or remove your alert from the bookmark menu on groundswell.surf.*

---

**A few notes:**

- **This email is personal** — unlike the weekly digest which goes to everyone, this fires per-user based on their specific saved spot and threshold. Every recipient has explicitly asked for it.
- **The link goes to groundswell.surf** — the user will need to search for their spot again when they arrive (we don't have deep-link URLs per spot yet).
- **Units:** the email includes both feet and metres variables. Use whichever you prefer in the template — or include both if you want (e.g., "6.2ft / 1.9m"). Most of our users are international so metres is a safe default, but feet is fine for an English-language template.
- **Keep it short.** This email should feel like a text message from a surf buddy, not a newsletter. One key fact (the wave height), one action (click to see the forecast).

---

## Questions?

If something doesn't look right or an event isn't showing up in a Loop, check with Kevin — the event names have to match exactly (they're case-sensitive).
