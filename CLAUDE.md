# Groundswell — Claude Code Guidelines

## i18n: all user-facing content must be translated

Every string visible to users **must** go through the `t()` function from `useLanguage()`.
Supported locales: `en`, `es`, `fr`, `pt-BR`, `pt-PT`.

**Rules:**
- Add every new key to `app/i18n/messages/en.ts` first.
- Add the same key with a proper translation to each of the other four locale files (`es.ts`, `fr.ts`, `pt-BR.ts`, `pt-PT.ts`) in the same commit.
- Never hardcode user-facing text (labels, headings, CTAs, error messages, tooltips) directly in JSX — always use `t('key')`.
- Static data arrays that contain user-visible strings (feature lists, step descriptions, etc.) must be derived inside the component using `t()`, not defined as module-level constants.
- Placeholder/mock data that is purely illustrative (e.g., day abbreviations in a UI preview) is exempt.
- This rule applies to every new page, component, modal, and API-driven message surfaced in the UI.

---

## Project Identity

**Groundswell** — surf conditions SaaS at groundswell.surf. Next.js 16 App Router + TypeScript + Tailwind. Clerk auth, Stripe payments, Vercel KV (Redis), Loops.so email, Leaflet maps, Recharts, Framer Motion. PWA-enabled. Vercel deploy.

**Note:** Most key files (`app/`, `next.config.mjs`, etc.) have the Windows hidden attribute — use `dir -Force` or PowerShell to see them.

**Laura** handles email automations in Loops.so. See `docs/loops-guide-laura.md` for what's wired up.

---

## Agentic OS — Shared Memory System

Global context (`C:\Users\pc\.claude\CLAUDE.md`) auto-loads at every session with all project names, paths, and stack info — no need to re-explain.

**At session start:**
1. Read `C:\Users\pc\.claude\projects\E--projects-surf-report\memory\MEMORY.md` for project context (create it if missing)
2. Search Qdrant (once set up): `qdrant_find_relevant("Groundswell [topic]")` for cross-project patterns
3. Search entity graph: `search_nodes("Groundswell")` for structured facts

**During session:** store significant decisions with `qdrant_store_information(text, {project: "Groundswell", type: "decision|pattern|bug-fix"})`

**Global memory** (shared with AccessBridge, TestPilot, etc.): `C:\Users\pc\.claude\global-memory\`
