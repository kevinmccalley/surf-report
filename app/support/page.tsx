import type { Metadata } from 'next'
import SupportContent from './SupportContent'

export const metadata: Metadata = {
  title: 'Support | Groundswell',
  description: 'Get help with Groundswell surf forecasting.',
}

export default function SupportPage() {
  return <SupportContent />
}
