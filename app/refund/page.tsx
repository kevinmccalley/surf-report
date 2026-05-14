import type { Metadata } from 'next'
import RefundContent from './RefundContent'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Groundswell',
  description: 'Groundswell refund and cancellation policy for monthly and annual subscriptions.',
  openGraph: { title: 'Refund & Cancellation Policy — Groundswell', type: 'website' },
  twitter: { card: 'summary', title: 'Refund & Cancellation Policy — Groundswell' },
}

export default function RefundPage() {
  return <RefundContent />
}
