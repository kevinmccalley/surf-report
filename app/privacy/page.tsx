import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy — Groundswell',
  description: 'Privacy Policy for Groundswell surf forecasting. GDPR-compliant.',
  openGraph: { title: 'Privacy Policy — Groundswell', type: 'website' },
  twitter: { card: 'summary', title: 'Privacy Policy — Groundswell' },
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
