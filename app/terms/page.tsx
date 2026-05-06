import type { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service | Groundswell',
  description: 'Terms of Service for Groundswell surf forecasting.',
}

export default function TermsPage() {
  return <TermsContent />
}
