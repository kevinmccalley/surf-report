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
