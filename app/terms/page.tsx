import type { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service — Groundswell',
  description: 'Terms of Service for Groundswell surf forecasting.',
  openGraph: { title: 'Terms of Service — Groundswell', type: 'website' },
  twitter: { card: 'summary', title: 'Terms of Service — Groundswell' },
}

export default function TermsPage() {
  return <TermsContent />
}
