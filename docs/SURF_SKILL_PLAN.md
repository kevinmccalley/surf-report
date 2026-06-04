# Surf Forecasting Skill — Product & Technical Plan

*Planning doc. Not shipped code. Revise as decisions firm up.*

---

## Vision

A Claude skill that lets any surfer — developer or not — ask natural questions about a
break and get an honest, surfing-literate answer backed by real forecast data.

**Target audiences (both matter, delivery mechanism differs):**

| Audience | How they access Claude | What they want |
|---|---|---|
| Developer surfers | Claude Code CLI, API, MCP | Composable tool to integrate into their own alerts/bots |
| AI-native surfers (non-dev) | Claude.ai Projects, web chat | Simple Q&A: "Is X worth it Saturday?" |

---

## Access / Paywall Plan

- **Phase 0 (now):** Available to `BYPASS_EMAIL` users only (no paywall gate yet)
- **Phase 1:** Gated to Premium (Stripe) subscribers via Clerk metadata check — `tier === 'premium'`
- **Phase 2:** Possibly a standalone API key product for developer audience

For Phase 0, the skill can be distributed as a file that includes a `BYPASS_EMAIL` list
check or simply shared manually with those users. No code gate needed yet.

---

## Delivery Mechanisms

### For AI-native surfers (non-dev)

**Recommended path: Claude.ai Project**

1. Create a Claude.ai Project called "Groundswell Surf Advisor" (or similar)
2. Add `SURF_FORECASTING.md` as Project Knowledge — Claude reads it every session
3. Add a system prompt that defines Claude's persona, scope, and how to call the
   Groundswell API for live data
4. Share the Project link with bypass users

This requires **zero CLI knowledge**. The surfer opens Claude.ai, enters the shared project,
and asks "Is Rincon going to be good this weekend?" Claude uses the knowledge doc + live
API to answer.

**Limitation:** Claude.ai Projects cannot natively call external APIs unless a web search
tool is available or the user pastes data in. To get live data, we have two options:
- Option A: Instruct the user to paste a Groundswell forecast URL and Claude interprets it
- Option B: Wire up an MCP server (see Developer path below) so Claude can fetch live data

### For developer surfers

**Path: Claude Code skill (.md) + MCP server**

1. **Skill file** (`SURF_SKILL.md`) — a Claude Code skill that defines how to fetch and
   interpret surf data. Loaded via `/project:surf` or a custom slash command.
2. **MCP server** (`mcp-surf-forecasting/`) — a lightweight Node.js MCP server that exposes
   two tools:
   - `get_surf_forecast(lat, lon, days?)` → calls Groundswell's `/api/surf` endpoint and
     returns structured conditions
   - `get_saved_spots(userId)` → returns the user's Groundswell saved spots (requires auth)
3. Developers point their `~/.claude/settings.json` at the MCP server and get live data
   in any Claude Code session

---

## Skill File Design (`SURF_SKILL.md` — to be built)

The skill file should define:

```
## Role
You are a surf forecasting assistant powered by Groundswell. You give honest, 
surfing-literate condition reports with the confidence of a local who reads the models.

## What you can do
- Report current and forecast conditions for any named break or lat/lon
- Score conditions using Groundswell's rating system (FLAT → EPIC)
- Explain why conditions are good or bad (swell direction, period, wind)
- Compare multiple days to find the best window
- Alert the user to tide blind spots and forecast accuracy limits

## What you cannot do
- Predict crowd levels
- Account for individual surfer skill level without being told
- Guarantee accuracy beyond 5–7 days
- Access tide tables (not in current data pipeline)

## Response format
1. Lead with: [RATING LABEL], [HEIGHT], [PERIOD] — e.g., "FAIR TO GOOD, 3–4 ft, 14 s"
2. Wind: one sentence (speed, offshore/onshore relative to break)
3. Why: 1–2 sentences on what's driving the rating
4. Best window: if user asked about a range, name the best day/time
5. Caveats: flag anything the data can't tell them (tide, crowds, fog)
```

---

## MCP Server Design

**Repo location (proposed):** `app/mcp/surf-forecasting/` or a separate repo

**Tools to expose:**

```ts
// Tool 1: forecast by location
get_surf_forecast({
  lat: number,
  lon: number,
  spotName?: string,   // triggers calibration lookup
  days?: number        // 1–15, default 5
}) → SurfForecastResult

// Tool 2: named spot lookup
search_surf_spot({
  query: string        // "Pipeline", "Rincon", "Hossegor"
}) → { name, lat, lon, country }[]

// Tool 3: saved spots (auth required)
get_saved_spots({
  userId: string       // Clerk user ID
}) → SavedLocation[]
```

**Auth model for Phase 0:**
- MCP server checks an env var `GROUNDSWELL_BYPASS_EMAILS`
- Validates caller's email against the list before returning data
- No Stripe check yet

**Data source:** The MCP server can call Groundswell's own `/api/surf` route directly
(with a server-side API key) rather than duplicating the Open-Meteo integration.

---

## Surfer-Facing UX Copy (for non-dev users)

When setting up the Claude.ai Project, the welcome message should feel like:

> "Tell me a break name or paste a spot URL and I'll give you the real read on conditions.
> I use the same models as Groundswell — just ask me 'Is Malibu worth it Friday?' or
> 'What's the best day to surf this week near 34°N, 120°W?'"

Keep it casual. Surfers respond to authenticity. Don't use words like "AI-powered" or
"leveraging machine learning" in the UI copy.

---

## Phased Rollout

| Phase | Gate | What ships |
|---|---|---|
| 0 | Bypass emails | `SURF_FORECASTING.md` loaded manually into Claude.ai Projects; share link with users |
| 1 | Premium tier | Same but project requires Groundswell login + Stripe check |
| 2 | Developer launch | MCP server published, skill file in repo, docs for wiring it up |
| 3 | In-app AI tab | AI chat embedded directly in Groundswell app (no Claude.ai needed) |

---

## Open Questions

- [ ] Should the MCP server be open-source or proprietary?
- [ ] Separate pricing for the developer API vs. the AI chat feature?
- [ ] Claude.ai Project sharing — does Anthropic support shared/team projects for this use case?
- [ ] Should non-dev surfer access live inside Groundswell app (Phase 3) rather than Claude.ai?
- [ ] Tide data — worth adding to the pipeline before launching the AI feature?

---

*Created: 2026-05-26. Update as decisions are made on open questions above.*
