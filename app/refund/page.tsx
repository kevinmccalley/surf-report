import type { Metadata } from 'next'
import RefundContent from './RefundContent'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Groundswell',
  description: 'Groundswell refund and cancellation policy for monthly and annual subscriptions.',
}

export default function RefundPage() {
  return <RefundContent />
}
