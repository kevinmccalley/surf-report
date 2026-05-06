import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy | Groundswell',
  description: 'Privacy Policy for Groundswell surf forecasting. GDPR-compliant.',
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
