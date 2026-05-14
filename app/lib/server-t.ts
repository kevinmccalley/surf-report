import en from '@/app/i18n/messages/en'
import es from '@/app/i18n/messages/es'
import fr from '@/app/i18n/messages/fr'
import ptBR from '@/app/i18n/messages/pt-BR'
import ptPT from '@/app/i18n/messages/pt-PT'

const messages: Record<string, Record<string, string>> = {
  en,
  es,
  fr,
  'pt-BR': ptBR,
  'pt-PT': ptPT,
}

export function serverT(lang: string, key: string): string {
  const msgs = messages[lang] ?? messages['en']
  return msgs[key] ?? messages['en'][key] ?? key
}
