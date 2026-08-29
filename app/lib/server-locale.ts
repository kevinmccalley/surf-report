import { cookies } from 'next/headers'

const VALID_LOCALES = new Set(['en', 'es', 'fr', 'pt-BR', 'pt-PT'])

/**
 * Resolve the active locale inside a Server Component / generateMetadata.
 *
 * Precedence:
 *   1. an explicit `?lang=` query param — used by the hreflang alternates and
 *      by crawlers requesting a specific locale
 *   2. the `groundswell_locale` cookie — set by the in-app language switcher
 *      (app/i18n/LanguageContext.tsx). This is what makes a user's chosen
 *      language stick on server-rendered text (breadcrumb, <h1>, subtitle…).
 *   3. 'en'
 *
 * Note: calling this opts the route into dynamic rendering (it reads cookies).
 * Every caller today already renders dynamically (force-dynamic or it reads
 * searchParams), so this is not a new cost.
 */
export async function getServerLocale(paramLang?: string | null): Promise<string> {
  if (paramLang && VALID_LOCALES.has(paramLang)) return paramLang
  try {
    const cookieLang = (await cookies()).get('groundswell_locale')?.value
    if (cookieLang && VALID_LOCALES.has(cookieLang)) return cookieLang
  } catch {
    // cookies() can throw in some prerender contexts — fall through to 'en'
  }
  return 'en'
}
