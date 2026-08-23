# AI Visibility scheduled-run prompt

This is the exact prompt sent to `claude -p` by the Windows Task Scheduler task
`GroundswellAIVisibility` (see `scripts/ai-visibility-scheduled-run.ps1`). Edit this file to
change what the scheduled run does — the `.ps1` wrapper reads it fresh each run, so no script
changes are needed for a checklist-content change. Ported from GoodStockPress's equivalent
system (`goodstockpress/docs/ai-visibility-scheduled-prompt.md`) — same rubric, adapted to
Groundswell's page types and i18n constraint.

---

You are running the Groundswell AI Visibility Standing Checklist as an unattended, scheduled
task. Nobody is watching this run in real time. Work from the files below, not from memory of past
sessions — you have no conversation history before this prompt.

**Read first:**
1. `E:\projects\surf-report\docs\ai-visibility-log.md` — newest entry is your baseline; don't
   re-flag something already fixed and logged as fixed.
2. `E:\projects\surf-report\public\llms.txt` — the current AI-crawler-facing site description and
   Key pages list. Re-derive whether it's complete from the site's actual live routes, not from a
   remembered list.
3. `E:\projects\surf-report\docs\project_seo_geo.md`-equivalent context (if present) or the git
   log for `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` — a different, broader system
   (`app/api/monitor/route.ts`, weekly Vercel cron) already covers general SEO regression
   (sitemap reachability, JSON-LD presence, meta tag existence). Don't duplicate its checks;
   focus on what's unique to this rubric: raw-HTML crawlability, answer-clarity, llms.txt
   completeness, and structured-data *appropriateness* (not just presence).

**The checklist — check all of these against the homepage, `/faq`, `/blog`, one recent blog post,
`/spots`, and one `/climatology/[spot]` page:**

1. **Raw-HTML crawlability.** Fetch each page's raw HTML (curl, not a browser) and confirm the
   actual answerable content (forecast summary, FAQ answers, blog article body, spot names) is
   present in the server-delivered HTML, not only rendered client-side by JavaScript. Most AI
   crawlers (GPTBot, ClaudeBot, CCBot, PerplexityBot) don't execute JS. **Verify occurrence counts
   correctly** — `grep -c` counts matching *lines*, and Next.js production HTML is typically a
   single unbroken line, so `grep -c` will only ever return 0 or 1 regardless of true occurrence
   count. Use `grep -o pattern | wc -l`, or slice the string directly, before concluding content is
   missing — a false "missing" finding here wastes a human review cycle.
2. **JSON-LD structured data**, appropriate to the page type: `FAQPage` on `/faq`, `BlogPosting`
   on posts, `SportsActivityLocation`/`ItemList` on spot pages, `Organization`+`SoftwareApplication`
   sitewide. Check the schema is not just present but internally consistent — e.g. if a
   `speakable.cssSelector` references a CSS class, confirm that class actually exists on real
   elements in the rendered page, not just inside the JSON-LD block itself.
3. **`sitemap.xml` and `llms.txt` sync** — every significant page type is listed in `llms.txt`'s
   Key pages section (home, spot directory, climatology, blog, FAQ, accuracy — re-check this list
   against actual top-level routes in `app/`, since a new route can ship without anyone thinking to
   add it here), and `sitemap.xml` `<lastmod>` values look real, not stale or missing.
4. **Meta fundamentals** on every page checked: `<title>`, meta description, canonical link,
   `og:*` (title/description/image/site_name), `twitter:card`.
5. **First ~150 words of extractable text** on each page: does it plainly state what the page
   is/who it's for/what it does? This is the window most answer engines actually quote — if the
   opening is vague, that's a real finding even if nothing is technically broken.
6. **`robots.txt`** stays wildcard-permissive with only the existing narrow disallows
   (`/api/`, `/sign-in`, `/sign-up`, `/studio/`, `/debug`); don't add bot-specific blocks unless
   something changed that would call for it.
7. **Traditional/AI search presence** — spot-check 1-2 surf-forecast-style searches (e.g. "what is
   swell period surf forecast", "surf report app for [a specific spot]"). Not appearing is expected
   for a site this age and is not itself a finding to act on — note it only if it's changed
   materially (better or worse) from the last logged entry.

**i18n constraint, specific to Groundswell:** any text edit inside the Next.js app itself (not
`public/llms.txt`, which is a single English crawler-facing file outside the i18n system) that
touches user-visible copy must go through `t()` and be added to all 5 locale files
(`app/i18n/messages/{en,es,fr,pt-BR,pt-PT}.ts`) in the same commit per this repo's CLAUDE.md rule.
This scheduled run should **not** attempt that kind of multi-locale content edit unattended —
if a wording/content-quality issue needs fixing inside the app (not `llms.txt`/`sitemap`/`robots`),
write it up as an open item for a human session instead of editing translated strings without a
human able to judge translation quality.

**When you find something fixable and mechanical** (a missing `llms.txt` entry, a stale sitemap
issue, a genuinely JS-only content gap, a broken schema cross-reference): fix it directly by
editing the file. Then: `git add` the specific files you changed (never `-A` — other uncommitted
work may exist in this repo), and `git commit` with a message naming the actual fix. **Do not run
`git push` or any deploy command — these are outside your permitted tools on this run and will
fail if attempted; that failure is expected and correct, not an error to work around.** Leaving the
commit staged-and-unpushed is the intended outcome — Kevin reviews and pushes it (to `dev` first,
per this repo's workflow — see project memory `feedback_git_workflow`) in the next session.

**When you find something needing a judgment call, not a mechanical fix** (translated-copy wording,
whether a page's opening paragraph is compelling vs. merely present, whether new structured data
is worth adding): don't act — write it up clearly as an open item instead.

**Wrapping up:**
1. Append a new dated entry (newest-first position, right after the header) to
   `E:\projects\surf-report\docs\ai-visibility-log.md` — what you checked, what you found, what
   you fixed-and-committed-locally (list the commit message), what's left as an open item needing
   a human judgment call. Be specific enough that the next run (automated or interactive) can tell
   "already handled" from "still open" without re-deriving it from scratch.
2. If you made any local commits, end your final summary with a clear line:
   `STAGED COMMITS AWAITING PUSH: <branch name, commit summary>` — this is what Kevin reviews next.
3. If you found nothing needing a fix, say so plainly in the log entry — a clean pass is a real,
   useful result, not a failure to report something.
