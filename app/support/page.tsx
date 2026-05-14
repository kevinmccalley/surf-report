import type { Metadata } from 'next'
import SupportContent from './SupportContent'

export const metadata: Metadata = {
  title: 'Support — Groundswell',
  description: 'Get help with Groundswell surf forecasting.',
  openGraph: { title: 'Support — Groundswell', type: 'website' },
  twitter: { card: 'summary', title: 'Support — Groundswell' },
}

export default function SupportPage() {
  return <SupportContent />
}
